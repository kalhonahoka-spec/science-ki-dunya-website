import test from 'node:test'
import assert from 'node:assert/strict'
import {createStudy,validateStudy,validateStudyOutput} from '../study.mjs'
const item={question:'What is light?',answer:'Electromagnetic radiation.',options:[],answerIndex:-1,evidence:'Light is electromagnetic radiation.'}
const result={title:'Light',overview:'A study guide.',items:[item]}
const input={topic:'Light',language:'en',format:'flashcards',source:'Light is electromagnetic radiation.'}
test('study validates source bounds, language and format',()=>{
 assert.equal(validateStudy(input).topic,'Light')
 for(const change of [{source:'x'.repeat(6001)},{topic:'x'},{language:'de'},{format:'unknown'},{source:[]},null])assert.throws(()=>validateStudy(change===null?null:{...input,...change}))
})
test('study uses server-side Gemini structured output and literal source excerpts',async()=>{
 process.env.GEMINI_API_KEY='test-only';let payload
 const fetcher=async(_provider,_url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]}))}
 const response=await createStudy(input,fetcher);assert.equal(response.basis,'your-notes');assert.equal(response.study.items[0].evidence,item.evidence);assert.equal(payload.generationConfig.responseMimeType,'application/json');assert.ok(payload.generationConfig.responseJsonSchema)
 const noNotes=await createStudy({...input,source:''},fetcher);assert.equal(noNotes.study.items[0].evidence,'');assert.equal(noNotes.basis,'general-knowledge')
 const unrelated=await createStudy({...input,source:'The sky appears blue.'},fetcher);assert.equal(unrelated.study.items[0].evidence,'')
})
test('all study formats accept valid structures; quiz rejects inconsistent answers',()=>{
 for(const format of ['flashcards','summary','mindmap','podcast','worksheet'])assert.equal(validateStudyOutput(result,format).title,'Light')
 assert.throws(()=>validateStudyOutput(result,'quiz'))
 assert.ok(validateStudyOutput({...result,items:[{...item,options:['A','B','C','D'],answerIndex:1}]},'quiz'))
})
test('study returns useful quota and malformed-output errors',async()=>{
 assert.equal((await createStudy(input,async()=>new Response('{}',{status:429}))).status,429)
 assert.equal((await createStudy(input,async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:'invalid'}]}}]})))).status,502)
})
test('study rejects English-only results requested in Urdu',async()=>{
 const response=await createStudy({...input,language:'ur'},async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]})))
 assert.equal(response.status,502)
})
