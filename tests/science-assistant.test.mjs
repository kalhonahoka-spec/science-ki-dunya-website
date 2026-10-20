import test from 'node:test'
import assert from 'node:assert/strict'
process.env.NODE_ENV='test'
import {parseAnswer,askScience} from '../science-assistant.mjs'
test('web answers require source supports and reject unsafe source links',()=>{
 const candidate={content:{parts:[{text:'Light scatters.'}]}}
 assert.equal(parseAnswer(candidate,'web').status,422)
 candidate.groundingMetadata={groundingChunks:[{web:{uri:'javascript:alert(1)'}}],groundingSupports:[{segment:{text:'Light scatters.'},groundingChunkIndices:[0,99]}]}
 assert.equal(parseAnswer(candidate,'web').status,422)
 candidate.groundingMetadata.groundingChunks[0].web={uri:'https://science.nasa.gov/',title:'NASA'}
 const answer=parseAnswer(candidate,'web');assert.equal(answer.supports.length,1);assert.equal(answer.sources[0].title,'NASA')
})
test('saved citations resolve only against the fixed library',()=>{
 const result=parseAnswer({content:{parts:[{text:'Blue light scatters [S1]. Fake [S999].'}]}},'library')
 assert.deepEqual(result.sources.map(s=>s.id),['S1'])
})
test('assistant validates input and handles Gemini grounding, language and history',async t=>{
 assert.equal((await askScience({question:'x',mode:'web'})).status,400)
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY,oldModel=process.env.GEMINI_MODEL
 t.after(()=>{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;if(oldModel===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=oldModel})
 delete process.env.GEMINI_API_KEY
 assert.equal((await askScience({question:'Why blue?',mode:'web'})).status,503)
 process.env.GEMINI_API_KEY='fake';process.env.GEMINI_MODEL='test-model'
 globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.ok(body.tools[0].google_search);assert.match(body.systemInstruction.parts[0].text,/Urdu/);assert.equal(body.contents.length,1);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Unreferenced answer'}]}}]}))}
 assert.equal((await askScience({question:'Why blue?',mode:'web',language:'ur',history:[{role:'system',text:'bad'}]})).status,422)
})
