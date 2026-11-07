import { createHandler } from '../lib/relay-price.mjs';

const handlers = { XAU: createHandler('gold'), XAG: createHandler('silver') };

export default req => {
  const handler = handlers[new URL(req.url).searchParams.get('symbol') || 'XAU'];
  return handler ? handler(req) : Response.json({ error: 'Invalid symbol' }, { status: 400 });
};
