import ScienceMark from './ScienceMark'
import {useEffect,useRef,useState} from 'react'
import {Mic,Phone,PhoneOff,Send,Square,X} from 'lucide-react'
import VoiceReader from './VoiceReader'
import {dictate,speakReply} from './speech'
import {createCallSounds} from './callSounds'
import {createCallPlayback} from './callPlayback'
type Source={id:string;title:string;url:string}
type Reply={text:string;sources:Source[];supports?:{claim:string;sources:Source[]}[];evidence:string;searchHtml?:string}
type Turn={question:string;reply:Reply;urdu:boolean}
export function openAssistant(question='',mode='general'){window.dispatchEvent(new CustomEvent('skd-open-assistant',{detail:{question,mode}}))}
export default function ScienceAssistant({isUrdu}:{isUrdu:boolean}){
 const [open,setOpen]=useState(false),[question,setQuestion]=useState(''),[mode,setMode]=useState('general'),[urdu,setUrdu]=useState(isUrdu),[busy,setBusy]=useState(false),[error,setError]=useState(''),[turns,setTurns]=useState<Turn[]>([])
 const [call,setCall]=useState(false),[phase,setPhase]=useState('idle'),[interim,setInterim]=useState(''),[canUseGeneral,setCanUseGeneral]=useState(false)
 const [callSeconds,setCallSeconds]=useState(0)
 useEffect(()=>{if(!call){setCallSeconds(0);return}const timer=setInterval(()=>setCallSeconds(s=>s+1),1000);return()=>clearInterval(timer)},[call])
 const pending=useRef<AbortController|null>(null),playback=useRef<AbortController|null>(null),mic=useRef<()=>void>(()=>{}),panel=useRef<HTMLDialogElement>(null),conversation=useRef<HTMLDivElement>(null),calling=useRef(false),epoch=useRef(0),restart=useRef<ReturnType<typeof setTimeout>|null>(null)
 const sounds=useRef<ReturnType<typeof createCallSounds>|null>(null),connected=useRef(false)
 if(!sounds.current)sounds.current=createCallSounds()
 const callAudio=useRef<ReturnType<typeof createCallPlayback>|null>(null),lastSpoken=useRef('')
 if(!callAudio.current)callAudio.current=createCallPlayback()
 const voice='eleven'
 const latest=useRef({mode,urdu,voice,turns});latest.current={mode,urdu,voice,turns}
 function stop(audible=true){if(calling.current&&audible)sounds.current?.disconnected();else sounds.current?.silence();connected.current=false;epoch.current++;calling.current=false;setCall(false);if(restart.current)clearTimeout(restart.current);mic.current();pending.current?.abort();pending.current=null;playback.current?.abort();playback.current=null;setBusy(false);setPhase('idle');setInterim('')}
 useEffect(()=>{setUrdu(isUrdu)},[isUrdu])
 useEffect(()=>{if(open)panel.current?.showModal();else panel.current?.close()},[open])
 useEffect(()=>{const listener=(event:Event)=>{const detail=(event as CustomEvent).detail||{};stop();setQuestion(detail.question||'');setMode(['general','web','library'].includes(detail.mode)?detail.mode:'general');setError('');setOpen(true)};window.addEventListener('skd-open-assistant',listener);return()=>{window.removeEventListener('skd-open-assistant',listener);stop(false);sounds.current?.dispose();callAudio.current?.dispose()}},[])
 useEffect(()=>{conversation.current?.scrollTo({top:conversation.current.scrollHeight,behavior:'auto'})},[turns,busy])
 async function ask(text=question,spoken=false,overrideMode?:string){
  if(text.trim().length<3)return
  const ticket=epoch.current,settings={...latest.current,mode:overrideMode||latest.current.mode},controller=new AbortController();pending.current?.abort();pending.current=controller;setBusy(true);setError('');setCanUseGeneral(false);setPhase('thinking')
  try{
   const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({question:text,mode:settings.mode,language:settings.urdu?'ur':'en',voice:spoken,history:settings.turns.slice(-3).flatMap(t=>[{role:'user',text:t.question},{role:'model',text:t.reply.text}])})})
   const result=await response.json();if(controller.signal.aborted||ticket!==epoch.current)return
   if(!response.ok){setCanUseGeneral(!!result.canUseGeneral);throw Error(result.error||'Request failed')}
   setTurns(t=>[...t,{question:text,reply:result,urdu:settings.urdu}]);setQuestion('');setBusy(false)
   if(spoken&&calling.current){lastSpoken.current=result.text;setPhase('speaking');const speech=new AbortController();playback.current=speech;await speakReply(result.text,settings.urdu?'ur':'en',settings.voice,speech.signal,callAudio.current?.available()?callAudio.current.play:undefined);if(ticket===epoch.current&&calling.current)restart.current=setTimeout(()=>listen(true),350)}else setPhase('idle')
  }catch(e){if(!controller.signal.aborted&&ticket===epoch.current){setError(e instanceof Error?e.message:'Connection failed');setPhase('paused')}}finally{if(pending.current===controller){pending.current=null;setBusy(false)}}
 }
 function listen(spoken:boolean){
  mic.current();playback.current?.abort();setError('');setInterim('');const ticket=epoch.current
  mic.current=dictate({language:latest.current.urdu?'ur':'en',onState:s=>{if(ticket===epoch.current){setPhase(s);if(spoken&&calling.current&&s==='listening'&&!connected.current){connected.current=true;sounds.current?.connected()}}},onInterim:setInterim,onSuperseded:()=>{if(calling.current)stop()},onError:m=>{if(ticket===epoch.current){sounds.current?.silence();setError(m);setPhase('paused')}},onText:text=>{if(ticket!==epoch.current)return;setQuestion(text);setInterim('');if(spoken&&calling.current){if(text.trim().length<3){setError(latest.current.urdu?'ذرا تفصیل سے سوال کریں۔':'Please ask a slightly longer question.');setPhase('paused')}else void ask(text,true)}}})
 }
 function startCall(){stop(false);lastSpoken.current='';callAudio.current?.unlock();calling.current=true;setCall(true);sounds.current?.ring();listen(true)}
 async function replay(){
  callAudio.current?.unlock();mic.current();playback.current?.abort();if(restart.current)clearTimeout(restart.current)
  const ticket=epoch.current,controller=new AbortController();playback.current=controller;setError('');setPhase('speaking')
  try{await speakReply(lastSpoken.current,latest.current.urdu?'ur':'en','eleven',controller.signal,callAudio.current?.available()?callAudio.current.play:undefined);if(ticket===epoch.current&&calling.current)restart.current=setTimeout(()=>listen(true),350)}catch(e){if(!controller.signal.aborted&&ticket===epoch.current){setError(e instanceof Error?e.message:'Audio failed');setPhase('paused')}}
 }
 function interrupt(){epoch.current++;pending.current?.abort();pending.current=null;playback.current?.abort();if(restart.current)clearTimeout(restart.current);setBusy(false);listen(true)}
 const phases:Record<string,[string,string]>={idle:['Ready','تیار'],starting:['Connecting call / starting microphone…','کال مل رہی ہے / مائیک شروع ہو رہا ہے…'],listening:['Listening…','سن رہا ہوں…'],thinking:['Preparing answer…','جواب تیار ہو رہا ہے…'],speaking:['Speaking…','جواب سنا رہا ہوں…'],paused:['Paused—continue when ready','وقفہ—تیار ہوں تو جاری کریں']}
 const hint=mode==='general'?(urdu?'عام سائنسی سوالات کے لیے۔ یہ ماڈل کے علم سے جواب ہے؛ ویب سے تصدیق شدہ نہیں۔':'Ask general science questions. Answers use model knowledge and are not web-verified.'):mode==='library'?(urdu?'تین محفوظ گروپ خلاصے اور دو سائنسی نوٹس؛ پورے گروپ تک براہ راست رسائی نہیں۔':'Answers from three saved group summaries and two science notes. No full-group access.'):(urdu?'براہِ راست ویب تحقیق اور حوالے۔ سرچ کوٹہ ختم ہو تو عام سائنس منتخب کریں۔':'Live web research with references. If search quota is unavailable, choose General science.')
 return <><button className="akg-launch" onClick={()=>setOpen(true)}><ScienceMark/><span>SKD AI <small>{isUrdu?'اے آئی اسسٹنٹ':'Science Assistant'}</small></span></button>
  <dialog ref={panel} className="akg-panel" onCancel={()=>{stop();setOpen(false)}} aria-labelledby="akg-title">
   <header><ScienceMark/><h2 id="akg-title">SKD AI Assistant</h2><button aria-label="Close assistant" onClick={()=>{stop();setOpen(false)}}><X/></button></header>
   <div className="akg-body">
    <div className="akg-settings"><label>Answer / جواب<select value={urdu?'ur':'en'} disabled={busy||call} onChange={e=>{mic.current();setUrdu(e.target.value==='ur')}}><option value="en">English</option><option value="ur">اردو</option></select></label><label>Sources / ذرائع<select value={mode} disabled={busy||call} onChange={e=>{setMode(e.target.value);setError('');setCanUseGeneral(false)}}><option value="general">General science / عام سائنس</option><option value="library">Saved library / محفوظ مواد</option><option value="web">Web research / ویب تحقیق</option></select></label></div>
    <p className="demo-hint">{hint}</p>
    <div className={`call-controls ${call?'call-active':''}`}>{call?<><button className="end-call" onClick={()=>stop()}><PhoneOff size={17}/>{urdu?'کال بند کریں':'End call'}</button>{phase==='paused'&&lastSpoken.current&&<button onClick={()=>void replay()}>{urdu?'جواب دوبارہ سنیں':'Replay answer'}</button>}<button onClick={interrupt}><Mic size={17}/>{phase==='speaking'||phase==='thinking'?(urdu?'روک کر بولیں':'Interrupt & speak'):(urdu?'کال جاری کریں':'Continue call')}</button></>:<button disabled={busy} onClick={startCall}><Phone size={17}/>{urdu?'وائس کال شروع کریں':'Start voice call'}</button>}</div>
    {call&&<section className={`call-stage phase-${phase}`} aria-label={urdu?'فعال وائس کال':'Active voice call'}><ScienceMark/><div><strong>SKD AI</strong><span>{urdu?'سائنس پر گفتگو':'Science voice conversation'}</span><time>{Math.floor(callSeconds/60).toString().padStart(2,'0')}:{(callSeconds%60).toString().padStart(2,'0')}</time></div><div className="call-wave" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i} style={{animationDelay:`${i*.12}s`}}/>)}</div></section>}
    <small>{urdu?'کال: بولیں، جواب سنیں، پھر اگلا سوال کریں۔ مائیک صرف سننے کے دوران چلتا ہے۔ براؤزر آواز آن لائن پراسیس کر سکتا ہے؛ ElevenLabs کریڈٹس استعمال ہوتے ہیں۔':'Call: speak, hear the answer, then ask again. Mic runs only while listening. Browser speech recognition may process audio online; ElevenLabs uses credits.'}</small>
    {(call||phase==='listening'||phase==='starting')&&<div className={`call-status phase-${phase}`} role="status"><span className="call-pulse"/>{phases[phase]?.[urdu?1:0]}{interim&&<p>{interim}</p>}</div>}
    <div className="akg-conversation" ref={conversation} aria-live="polite">
     {turns.length===0&&<div className="akg-empty"><ScienceMark/><h3>{urdu?'آج کیا جاننا چاہیں گے؟':'What would you like to discover?'}</h3>{(urdu?['تارے کیسے بنتے ہیں؟','آسمان نیلا کیوں ہے؟']:['How do stars form?','Why is the sky blue?']).map(q=><button key={q} disabled={busy||call} onClick={()=>setQuestion(q)}>{q}</button>)}</div>}
     {turns.map((t,i)=><article key={i} dir={t.urdu?'rtl':'ltr'}><h3>{t.question}</h3><p className="akg-answer">{t.reply.text}</p><small>{t.reply.evidence}</small>{t.reply.sources.length>0&&<ul>{t.reply.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">[{s.id}] {s.title}</a></li>)}</ul>}{t.reply.supports&&<details><summary>{t.urdu?'دعوے اور ان کے حوالے':'Claims and supporting references'}</summary>{t.reply.supports.map((s,j)=><p key={j}>{s.claim} {s.sources.map(ref=><a key={ref.id} href={ref.url} target="_blank" rel="noreferrer"> [{ref.id}] </a>)}</p>)}</details>}{t.reply.searchHtml&&<iframe title="Google Search suggestions" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={t.reply.searchHtml} className="akg-search"/>}{!call&&<VoiceReader text={t.reply.text} isUrdu={t.urdu}/>}</article>)}
    </div>
    {error&&<div className="assistant-error" role="alert"><p>{error}</p>{canUseGeneral&&<button onClick={()=>{stop();setMode('general');void ask(question,false,'general')}}>{urdu?'ویب کے بغیر عام سائنسی جواب لیں':'Answer with General science instead'}</button>}</div>}
    {busy&&!call&&<p role="status">{urdu?'جواب تیار ہو رہا ہے…':'Preparing your answer…'}</p>}
    <form className="assistant-composer" onSubmit={e=>{e.preventDefault();mic.current();void ask()}}><textarea data-no-dictation dir={urdu?'rtl':'ltr'} aria-label="Science question" value={question} onChange={e=>setQuestion(e.target.value)} minLength={3} maxLength={1200} required disabled={busy||call} placeholder={urdu?'اپنا سائنسی سوال لکھیں یا مائیک دبائیں…':'Type a science question or press the microphone…'}/><div><button type="button" disabled={busy||call} onClick={()=>{if(phase==='listening'||phase==='starting')mic.current();else listen(false)}}><Mic size={16}/>{phase==='listening'&&!call?(urdu?'مائیک بند':'Stop mic'):(urdu?'بول کر لکھیں':'Dictate')}</button>{busy&&!call?<button type="button" onClick={()=>stop()}><Square size={16}/>{urdu?'روکیں':'Stop'}</button>:<button disabled={call||busy||question.trim().length<3}><Send size={16}/>{urdu?'پوچھیں':'Ask SKD'}</button>}<button type="button" disabled={busy||call} onClick={()=>{mic.current();setTurns([]);setError('');setQuestion('')}}>{urdu?'صاف کریں':'Clear chat'}</button></div></form>
    <small>{urdu?'اے آئی سے غلطی ہو سکتی ہے۔ اہم معلومات اصل حوالوں سے جانچیں۔':'AI can make mistakes. Check important claims against original sources.'}</small>
   </div>
  </dialog></>
}
