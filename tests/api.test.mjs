import test from 'node:test'
import assert from 'node:assert/strict'
process.env.NODE_ENV='test';process.env.GEMINI_API_KEY='test-only';process.env.VERCEL='1'
const {server}=await import('../server.mjs')
test('production API routes study generation and refuses unsafe long background jobs',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=async(url,options)=>{if(String(url).includes('generativelanguage.googleapis.com'))return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({title:'Light',overview:'Light scatters.',items:[{question:'What scatters?',answer:'Light.',options:[],answerIndex:-1,evidence:''}]})}]}}]}));return original(url,options)}
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`
 try{
  const status=await original(base+'/api/status').then(r=>r.json());assert.equal(status.studyStudio,true);assert.equal(status.longPodcastsAvailable,false)
  const result=await original(base+'/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:'Light',format:'summary',language:'en'})});assert.equal(result.status,200);assert.equal((await result.json()).study.title,'Light')
  const podcast=await original(base+'/api/podcasts',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(podcast.status,503)
  const badType=await original(base+'/api/study',{method:'POST',body:'hello'});assert.equal(badType.status,415)
 }finally{globalThis.fetch=original;await new Promise(resolve=>server.close(resolve))}
})
