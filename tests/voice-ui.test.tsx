import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import React,{useState} from 'react'
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:4175'})
for(const name of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLDialogElement','MutationObserver','Event','CustomEvent','DOMException'])Object.defineProperty(globalThis,name,{value:(dom.window as any)[name],configurable:true,writable:true})
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true})
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true
dom.window.HTMLElement.prototype.scrollTo=()=>{}
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
Object.defineProperty(dom.window,'speechSynthesis',{value:{cancel(){},getVoices(){return []},addEventListener(){},removeEventListener(){}}})
const {render,fireEvent,waitFor,cleanup,act}=await import('@testing-library/react')
const {default:UniversalMic}=await import('../src/UniversalMic')
const {default:ScienceAssistant}=await import('../src/ScienceAssistant')
const {dictate}=await import('../src/speech')
class Recognition{
 static instances:Recognition[]=[]
 lang='';continuous=false;interimResults=false;onstart:any;onresult:any;onerror:any;onend:any;aborted=false
 constructor(){Recognition.instances.push(this)}
 start(){this.onstart?.()}
 abort(){this.aborted=true}
 stop(){this.onend?.()}
 text(text:string){this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:text}}]})}
}
;(window as any).SpeechRecognition=Recognition
test('universal mic updates controlled input at selection, excludes passwords, and handles denial',async()=>{
 function Fields(){const [value,setValue]=useState('Hello world');return <><input aria-label="Target" value={value} onChange={e=>setValue(e.target.value)}/><input type="password"/><textarea aria-label="Notes"/><UniversalMic isUrdu={false}/></>}
 const ui=render(<React.StrictMode><Fields/></React.StrictMode>);await waitFor(()=>assert.equal(ui.getAllByLabelText('Dictate into this field').length,2))
 const field=ui.getByLabelText('Target') as HTMLInputElement;field.focus();field.setSelectionRange(6,11)
 fireEvent.click(ui.getAllByLabelText('Dictate into this field')[0]);const recognition=Recognition.instances.at(-1)!
 assert.equal(recognition.lang,'en-US');await act(async()=>recognition.text('science'));assert.equal(field.value,'Hello science')
 fireEvent.click(ui.getAllByLabelText('Dictate into this field')[1]);await act(async()=>Recognition.instances.at(-1)!.onerror({error:'not-allowed'}))
 assert.ok(ui.getByText(/Microphone permission denied/));cleanup()
})
test('recognition cancels old sessions and ignores late results',()=>{
 let first='',second='';const callbacks={language:'ur',onState:()=>{},onError:()=>{}}
 const stop=dictate({...callbacks,onText:t=>first=t});const old=Recognition.instances.at(-1)!,late=old.onresult
 const stop2=dictate({...callbacks,onText:t=>second=t});assert.equal(old.aborted,true)
 late({resultIndex:0,results:[{isFinal:true,0:{transcript:'old'}}]});Recognition.instances.at(-1)!.text('نیا سوال');assert.equal(first,'');assert.equal(second,'نیا سوال');stop();stop2()
})
test('assistant general answers, explicit web fallback, dictation, and call cancellation',async()=>{
 const original=globalThis.fetch;let calls:any[]=[];let release:(r:Response)=>void=()=>{}
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options?.body as string);calls.push(body);if(body.voice)return new Promise(resolve=>{release=resolve});if(body.mode==='web')return new Response(JSON.stringify({error:'Search quota unavailable',canUseGeneral:true}),{status:429});return new Response(JSON.stringify({text:'Stars form when gas collapses under gravity.',sources:[],evidence:'Model knowledge; not web-verified.'}))}
 try{
  const ui=render(<ScienceAssistant isUrdu={false}/>);fireEvent.click(ui.getByText('SKD AI'))
  const question=ui.getByLabelText('Science question')
  fireEvent.change(question,{target:{value:'How do stars form?'}});fireEvent.click(ui.getByText('Ask SKD'))
  await waitFor(()=>assert.ok(ui.getByText('Stars form when gas collapses under gravity.')));assert.equal(calls[0].mode,'general')
  fireEvent.change(ui.getByLabelText('Sources / ذرائع'),{target:{value:'web'}});fireEvent.change(question,{target:{value:'Find sources about stars'}});fireEvent.click(ui.getByText('Ask SKD'))
  await waitFor(()=>assert.ok(ui.getByText('Answer with General science instead')));fireEvent.click(ui.getByText('Answer with General science instead'));await waitFor(()=>assert.equal(calls.at(-1).mode,'general'))
  await waitFor(()=>assert.equal((question as HTMLTextAreaElement).disabled,false));fireEvent.click(ui.getByText('Dictate'));await act(async()=>Recognition.instances.at(-1)!.text('Tell me about light'));assert.equal((question as HTMLTextAreaElement).value,'Tell me about light')
  fireEvent.click(ui.getByText('Start voice call'));await act(async()=>Recognition.instances.at(-1)!.text('What is gravity?'));assert.equal(calls.at(-1).voice,true)
  fireEvent.click(ui.getByText('End call'));await act(async()=>release(new Response(JSON.stringify({text:'Late answer must disappear',sources:[],evidence:'Model knowledge'}))));assert.equal(ui.queryByText('Late answer must disappear'),null)
  assert.ok(ui.getByText('Start voice call'));cleanup()
 }finally{globalThis.fetch=original;cleanup()}
})
test('voice call completes answer/audio cycle, returns to listening and stops capture on close',async()=>{
 const original=globalThis.fetch,originalAudio=(globalThis as any).Audio
 class AudioMock{static instances:AudioMock[]=[];onended:any;onerror:any;src='';paused=false;constructor(src:string){this.src=src;AudioMock.instances.push(this)}play(){return Promise.resolve()}pause(){this.paused=true}}
 ;(globalThis as any).Audio=AudioMock
 globalThis.fetch=async(url)=>String(url).endsWith('/api/speech')?new Response(new Uint8Array([73,68,51,1]),{headers:{'Content-Type':'audio/mpeg'}}):new Response(JSON.stringify({text:'Gravity pulls objects together.',sources:[],evidence:'General science'}))
 try{
  const ui=render(<ScienceAssistant isUrdu={false}/>);fireEvent.click(ui.getByText('SKD AI'));fireEvent.click(ui.getByText('Start voice call'));const first=Recognition.instances.at(-1)!
  await act(async()=>first.text('What is gravity?'))
  await waitFor(()=>assert.equal(AudioMock.instances.length,1));assert.equal(first.aborted,true)
  await act(async()=>AudioMock.instances[0].onended())
  await waitFor(()=>assert.notEqual(Recognition.instances.at(-1),first));assert.ok(ui.getByText('Listening…'))
  const listening=Recognition.instances.at(-1)!;fireEvent.click(ui.getByLabelText('Close assistant'));assert.equal(listening.aborted,true);assert.equal(AudioMock.instances[0].paused,true);cleanup()
 }finally{globalThis.fetch=original;(globalThis as any).Audio=originalAudio;cleanup()}
})


test('community bookmarks survive remount, sync between feeds, and body search works',async()=>{
 const {CommunityFeed,posts}=await import('../src/Community')
 window.localStorage.clear()
 const ui=render(<><CommunityFeed isUrdu={false}/><CommunityFeed isUrdu={false}/></>)
 fireEvent.click(ui.getAllByLabelText(`Save ${posts[0].title}`)[0])
 await waitFor(()=>assert.equal(ui.getAllByLabelText(`Unsave ${posts[0].title}`).length,2))
 cleanup()
 const reopened=render(<CommunityFeed isUrdu={false}/>)
 assert.ok(reopened.getByLabelText(`Unsave ${posts[0].title}`))
 fireEvent.click(reopened.getByText('Saved (1)'))
 assert.equal(reopened.container.querySelectorAll('.post-card').length,1)
 fireEvent.click(reopened.getByText('All'))
 fireEvent.change(reopened.getByLabelText('Search community posts'),{target:{value:'  misconceptions  '}})
 assert.equal(reopened.container.querySelectorAll('.post-card').length,1)
 fireEvent.click(reopened.getByLabelText(`Unsave ${posts[0].title}`))
 assert.deepEqual(JSON.parse(window.localStorage.getItem('skd-saved-community-posts')!),[])
 cleanup()
 window.localStorage.setItem('skd-saved-community-posts','broken json')
 const corrupt=render(<CommunityFeed isUrdu={true}/>);assert.ok(corrupt.getByText('محفوظ'));cleanup()
})

test('video filters, selection, embed and direct fallback follow the selected video',async()=>{
 const {default:VideoLibrary}=await import('../src/VideoLibrary')
 const ui=render(<VideoLibrary isUrdu={false}/>)
 assert.equal(ui.container.querySelectorAll('.video-tile').length,6)
 fireEvent.click(ui.getByText('Full lectures'))
 assert.equal(ui.container.querySelectorAll('.video-tile').length,2)
 fireEvent.click(ui.getByLabelText('Select Cricket Bat to the Big Bang'))
 fireEvent.click(ui.getByLabelText('Play Cricket Bat to the Big Bang'))
 assert.match(ui.container.querySelector('iframe')!.src,/youtube-nocookie.com\/embed\/A7eFS0vxasI/)
 assert.equal(ui.getByText('Open on YouTube').getAttribute('href'),'https://www.youtube.com/watch?v=A7eFS0vxasI')
 fireEvent.click(ui.getByLabelText('Select Space Exploration, Astronomy & Cosmos Myths'))
 assert.equal(ui.container.querySelector('iframe'),null)
 cleanup()
})

test('call sounds ring, replace cues, stop timers and release audio resources',async()=>{
 const {createCallSounds}=await import('../src/callSounds')
 const original=(window as any).AudioContext
 const nodes:any[]=[];let closed=0
 class Context{
  state='running';currentTime=0;destination={}
  resume(){return Promise.resolve()}
  close(){closed++;return Promise.resolve()}
  createOscillator(){const node={frequency:{value:0},type:'',stops:0,onended:null,connect(){},disconnect(){},start(){},stop(){this.stops++}};nodes.push(node);return node}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}}
 }
 ;(window as any).AudioContext=Context
 try{
  const sound=createCallSounds();sound.ring();assert.deepEqual(nodes.map(n=>n.frequency.value),[440,520])
  sound.connected();assert.ok(nodes.slice(0,2).every(n=>n.stops===2));assert.deepEqual(nodes.slice(2).map(n=>n.frequency.value),[660,880])
  sound.disconnected();assert.deepEqual(nodes.slice(-2).map(n=>n.frequency.value),[520,350])
  sound.silence();const count=nodes.length;await new Promise(resolve=>setTimeout(resolve,1550));assert.equal(nodes.length,count)
  sound.dispose();assert.equal(closed,1)
  ;(window as any).AudioContext=undefined
  const silent=createCallSounds();silent.ring();silent.connected();silent.disconnected();silent.dispose()
 }finally{(window as any).AudioContext=original}
})

test('read aloud defaults to ElevenLabs and submits only a bounded audio preview',async()=>{
 const {audioPreview}=await import('../src/CloudTools')
 const {default:VoiceReader}=await import('../src/VoiceReader')
 const article=Array(500).fill('science').join(' ')
 assert.equal(audioPreview(article).split(' ').length,150)
 assert.ok(audioPreview(Array(200).fill('سائنسی معلومات').join(' ')).length<=1200)
 assert.equal(audioPreview('   '),'')
 const original=globalThis.fetch;let sent:any
 globalThis.fetch=async(_url,options)=>{sent=JSON.parse(options?.body as string);return new Response(JSON.stringify({error:'Test response'}),{status:429})}
 try{
  const ui=render(<VoiceReader text={article} isUrdu={false}/>)
  assert.equal(ui.queryByText('Device voice'),null);assert.equal(ui.queryByText('ElevenLabs'),null)
  fireEvent.click(ui.getByText('Listen to sample'))
  await waitFor(()=>assert.ok(ui.getByText('Test response')))
  assert.equal(sent.text.split(' ').length,150);assert.equal(sent.language,'en');assert.ok(sent.text.length<=1200)
 }finally{cleanup();globalThis.fetch=original}
})

test('call playback unlocks before reply and abort stops decoded audio',async()=>{
 const {createCallPlayback}=await import('../src/callPlayback')
 const original=(window as any).AudioContext;let resumed=0,stopped=0,closed=0,started=0
 class Context{
  state='suspended';destination={}
  resume(){this.state='running';resumed++;return Promise.resolve()}
  close(){closed++;return Promise.resolve()}
  decodeAudioData(){return Promise.resolve({})}
  createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},start(){started++},stop(){stopped++}}}
 }
 ;(window as any).AudioContext=Context
 try{
  const player=createCallPlayback();player.unlock();assert.equal(resumed,1)
  const controller=new AbortController();const playback=player.play(new Blob(['audio']),controller.signal)
  await waitFor(()=>assert.equal(started,1));controller.abort();await assert.rejects(playback,{name:'AbortError'});assert.equal(stopped,1)
  player.dispose();assert.equal(closed,1)
 }finally{(window as any).AudioContext=original}
})

test('Study Studio generates, reveals, grades and restores saved sets',async()=>{
 const {default:StudyStudio}=await import('../src/StudyStudio')
 window.localStorage.clear();Object.defineProperty(globalThis,'localStorage',{value:window.localStorage,configurable:true})
 const original=globalThis.fetch;let payload:any
 globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options?.body as string);return new Response(JSON.stringify({format:payload.format,language:payload.language,basis:'your-notes',createdAt:new Date().toISOString(),study:{title:'Test study',overview:'Light scatters.',items:[{question:'Which light scatters?',answer:'Blue light.',options:payload.format==='quiz'?['Blue','Red','Green','Yellow']:[],answerIndex:payload.format==='quiz'?0:-1,evidence:'Blue light scatters.'}]}}))}
 try{
  const ui=render(<StudyStudio u={false}/>);fireEvent.change(ui.getByLabelText('Study topic'),{target:{value:'Light'}});fireEvent.change(ui.getByLabelText('Source notes'),{target:{value:'Blue light scatters.'}})
  fireEvent.click(ui.getByText('Create study set'));await waitFor(()=>assert.ok(ui.getByText('Test study')))
  fireEvent.click(ui.getByText('Reveal answer'));assert.ok(ui.getByText('Blue light.'))
  fireEvent.change(ui.getByLabelText('Study format'),{target:{value:'quiz'}});fireEvent.click(ui.getByText('Create study set'));await waitFor(()=>assert.ok(ui.getByText('Blue')))
  fireEvent.click(ui.getByText('Blue'));assert.match(ui.getByRole('status').textContent!,/1 \/ 1/)
  cleanup();const restored=render(<StudyStudio u={false}/>);assert.ok(restored.getByText('Test study'));assert.equal((restored.getByLabelText('Source notes') as HTMLTextAreaElement).value,'Blue light scatters.')
  fireEvent.click(restored.getByText('Clear saved workspace'));assert.equal(restored.queryByText('Test study'),null)
 }finally{cleanup();globalThis.fetch=original;window.localStorage.clear()}
})
