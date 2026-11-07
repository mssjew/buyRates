async function queryRelay() {
  const response=await fetch('https://animated-leopard-505.eu-west-1.convex.cloud/api/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'priceRelay:watchTestFeed',args:{},format:'json'}),signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw new Error('Relay unavailable');
  const data=await response.json();if(data.status!=='success')throw new Error('Relay unavailable');return data.value;
}
/** Read the shared policy before every REST fallback. Unknown policy fails closed. */
export function createHandler(metal, { query = queryRelay, fetcher = fetch, now = Date.now, apiKey = () => process.env.MASSIVE_API_KEY } = {}) {
  return async req => {
    const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*' };
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (req.method !== 'GET') return new Response(null,{status:405,headers});
    try {
      const feed = await query();
      const q = feed?.quotes?.find(q => q.metal === metal), a = q?.adjustment;
      const correction = a?.active === true && a.expiresAt > now();
      const symbol = metal === 'gold' ? 'XAU' : 'XAG';
      if (feed.enabled && correction && a.closing) return new Response(JSON.stringify({status:'success',symbol:`${symbol}/USD`,last:{ask:q.askUSDPerOz,bid:q.bidUSDPerOz,timestamp:q.sourceUpdatedAt},relayAdjustment:a}),{headers});
      if (correction && a.mode === 'fixed') throw new Error('Closing snapshot unavailable');
      const key=apiKey(); if(!key) throw new Error('Not configured');
      const response = await fetcher(`https://api.massive.com/v1/last_quote/currencies/${symbol}/USD`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(6000)});
      if(!response.ok) throw new Error('Provider unavailable');
      const data = await response.json();
      if (data.status !== 'success' || data.symbol !== `${symbol}/USD` || !Number.isFinite(data.last?.ask) || !Number.isFinite(data.last?.bid) || data.last.bid<=0 || data.last.ask<data.last.bid || !Number.isSafeInteger(data.last?.timestamp) || data.last.timestamp>now()+5000) throw new Error('Invalid quote');
      if(correction && a.mode==='offset') { data.last.ask+=a.value; data.last.bid+=a.value; data.relayAdjustment=a; }
      if(data.last.bid<=0) throw new Error('Invalid adjusted quote');
      return new Response(JSON.stringify(data),{headers});
    } catch { return new Response(JSON.stringify({error:'Shared price temporarily unavailable'}),{status:503,headers}); }
  };
}
