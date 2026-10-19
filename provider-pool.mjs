import { createHash } from 'node:crypto'
const cooldowns=new Map()
export function providerKeys(provider){
 const prefix=provider==='gemini'?'GEMINI_API_KEY':'ELEVENLABS_API_KEY'
 return [...new Set([process.env[prefix],...Object.keys(process.env).filter(n=>new RegExp(`^${prefix}_\\d+$`).test(n)).sort((a,b)=>Number(a.split('_').at(-1))-Number(b.split('_').at(-1))).map(n=>process.env[n])].map(v=>v?.trim()).filter(Boolean))]
}
export function resetPool(){cooldowns.clear()}
export async function providerFetch(provider,url,options){
 const keys=providerKeys(provider),header=provider==='gemini'?'x-goog-api-key':'xi-api-key'
 const scope=provider==='gemini'&&String(options.body||'').includes('"google_search"')?'search':'standard'
 let last,limited
 for(const key of keys){
  const id=createHash('sha256').update(provider+key).digest('hex')
  if((cooldowns.get(id)||0)>Date.now()||(cooldowns.get(id+scope)||0)>Date.now())continue
  const response=await fetch(url,{...options,headers:{...options.headers,[header]:key}})
  if(response.ok)return response
  let detail=''
  try{const body=await response.clone().json();detail=body.detail?.status||body.error?.status||''}catch{}
  const quota=detail==='quota_exceeded'
  if(response.status===429||quota)limited=response.status===429?response:new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED'}}),{status:429,headers:{'Content-Type':'application/json'}})
  const invalid=response.status===401||response.status===403
  if(response.status!==429&&!quota&&!invalid)return response
  const retry=response.headers.get('retry-after')
  const seconds=retry?(Number.isFinite(Number(retry))?Number(retry):Math.max(0,(Date.parse(retry)-Date.now())/1000)):60
  cooldowns.set(invalid?id:id+scope,Date.now()+(invalid?86400000:quota?3600000:Math.max(60,Number.isFinite(seconds)?seconds:60)*1000))
  last=response
 }
 return limited||last||new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED',message:keys.length?'All configured keys are cooling down.':'No API keys configured.'}}),{status:429,headers:{'Content-Type':'application/json'}})
}
