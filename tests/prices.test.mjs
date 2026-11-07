import { test, after } from 'node:test';
import assert from 'node:assert/strict';

const raw = { ask: 4066.5, bid: 4066 };
const correction = fields => ({ value: 5, revision: 1, active: true, expiresAt: Date.now() + 3600000, ...fields });
const goldQuote = adjustment => ({ metal: 'gold', askUSDPerOz: raw.ask + 5, bidUSDPerOz: raw.bid + 5, sourceUpdatedAt: Date.now() - 60000, ...(adjustment && { adjustment }) });
const silverQuote = { metal: 'silver', askUSDPerOz: 52.5, bidUSDPerOz: 52.25, sourceUpdatedAt: Date.now() - 60000, adjustment: correction({ mode: 'offset', value: 0.5, closing: true }) };

let state;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith('https://animated-leopard-505.eu-west-1.convex.cloud/')) {
    return state.quotes ? Response.json({ status: 'success', value: { enabled: true, quotes: state.quotes } }) : new Response('', { status: 502 });
  }
  if (url.startsWith('https://api.massive.com/')) {
    state.massive.push({ url, authorization: new Headers(init.headers).get('authorization') });
    const symbol = url.match(/currencies\/(XAU|XAG)\/USD/)[1];
    return Response.json({ status: 'success', symbol: `${symbol}/USD`, last: { ...raw, timestamp: Date.now() - 1000 } });
  }
  throw new Error(`unexpected fetch ${url}`);
};
after(() => { globalThis.fetch = originalFetch; });
process.env.MASSIVE_API_KEY = 'fixture-key';
const { default: prices } = await import('../netlify/functions/prices.js');

async function get(symbol, quotes) {
  state = { quotes, massive: [] };
  const response = await prices(new Request(`https://buy.mssbars.com/.netlify/functions/prices?symbol=${symbol}`));
  return { status: response.status, body: await response.json(), massive: state.massive };
}

test('a closing correction serves the relay quote without calling Massive', async () => {
  const { status, body, massive } = await get('XAU', [goldQuote(correction({ mode: 'offset', closing: true }))]);
  assert.equal(status, 200);
  assert.deepEqual([body.last.ask, body.last.bid], [4071.5, 4071]);
  assert.equal(massive.length, 0);
});

test('an open-market offset is added to the Massive quote exactly once', async () => {
  const { status, body, massive } = await get('XAU', [goldQuote(correction({ mode: 'offset', closing: false }))]);
  assert.equal(status, 200);
  assert.deepEqual([body.last.ask, body.last.bid], [4071.5, 4071]);
  assert.equal(massive.length, 1);
  assert.doesNotMatch(massive[0].url, /fixture-key/);
  assert.equal(massive[0].authorization, 'Bearer fixture-key');
});

test('without a correction the Massive quote is served unchanged', async () => {
  const { status, body } = await get('XAU', [goldQuote()]);
  assert.equal(status, 200);
  assert.deepEqual([body.last.ask, body.last.bid], [4066.5, 4066]);
});

test('a fixed correction without a closing snapshot fails closed', async () => {
  const { status, body, massive } = await get('XAU', [goldQuote(correction({ mode: 'fixed', closing: false }))]);
  assert.equal(status, 503);
  assert.equal(body.last, undefined);
  assert.equal(massive.length, 0);
});

test('an unreachable relay fails closed', async () => {
  const { status, body, massive } = await get('XAU', undefined);
  assert.equal(status, 503);
  assert.equal(body.last, undefined);
  assert.equal(massive.length, 0);
});

test('silver requests read the silver relay quote', async () => {
  const { status, body } = await get('XAG', [goldQuote(), silverQuote]);
  assert.equal(status, 200);
  assert.equal(body.symbol, 'XAG/USD');
  assert.equal(body.last.ask, 52.5);
});

test('symbols other than XAU and XAG are rejected', async () => {
  const { status } = await get('BTC', [goldQuote()]);
  assert.equal(status, 400);
});
