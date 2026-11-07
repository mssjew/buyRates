import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../netlify/lib/relay-price.mjs';
const request=()=>new Request('https://example.test/gold-price');
const now=100000;
const quote={metal:'gold',askUSDPerOz:4005,bidUSDPerOz:4003,sourceUpdatedAt:1000,adjustment:{active:true,closing:true,mode:'fixed',expiresAt:200000}};
test('a weekend correction survives REST fallback without fetching another source',async()=>{
 let calls=0;const handler=createHandler('gold',{now:()=>now,query:async()=>({enabled:true,quotes:[quote]}),fetcher:async()=>{calls++;throw Error();}});
 const result=await handler(request());assert.equal(result.status,200);assert.equal((await result.json()).last.ask,4005);assert.equal(calls,0);
});
test('REST offset applies once and expired corrections restore provider values',async()=>{
 for(const expiresAt of [200000,50000]){
 const handler=createHandler('gold',{now:()=>now,apiKey:()=> 'fixture',query:async()=>({enabled:true,quotes:[{...quote,adjustment:{active:true,closing:false,mode:'offset',value:-3,expiresAt}}]}),fetcher:async()=>Response.json({status:'success',symbol:'XAU/USD',last:{ask:4000,bid:3998,timestamp:now}})});
 const data=await(await handler(request())).json();assert.equal(data.last.ask,expiresAt>now?3997:4000);assert.equal(data.last.bid,expiresAt>now?3995:3998);
 }
});
test('unknown policy fails closed instead of publishing unadjusted prices',async()=>{
 let called=false;const handler=createHandler('gold',{query:async()=>{throw Error('unreachable');},fetcher:async()=>{called=true;}});
 assert.equal((await handler(request())).status,503);assert.equal(called,false);
});
