import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Mic,Square} from 'lucide-react'
import {dictate,insertDictation} from './speech'
type Field=HTMLInputElement|HTMLTextAreaElement
type Entry={field:Field;slot:HTMLSpanElement;id:number}
export default function UniversalMic({isUrdu}:{isUrdu:boolean}){
 const [entries,setEntries]=useState<Entry[]>([]),[language,setLanguage]=useState(isUrdu?'ur':'en'),[active,setActive]=useState<number|null>(null),[state,setState]=useState('idle'),[message,setMessage]=useState('')
 const cancel=useRef<()=>void>(()=>{}),target=useRef<Field|null>(null)
 useEffect(()=>{setLanguage(isUrdu?'ur':'en')},[isUrdu])
 useEffect(()=>{
  const known=new Map<Field,Entry>();let next=0
  function scan(){let changed=false;for(const [field,entry] of known)if(!field.isConnected){entry.slot.remove();known.delete(field);changed=true;if(target.current===field){cancel.current();target.current=null}}
   document.querySelectorAll<Field>('textarea:not([data-no-dictation]),input:not([type]):not([data-no-dictation]),input[type="text"]:not([data-no-dictation]),input[type="search"]:not([data-no-dictation])').forEach(field=>{if(!known.has(field)){const slot=document.createElement('span');slot.className='dictation-slot';field.insertAdjacentElement('afterend',slot);known.set(field,{field,slot,id:++next});changed=true}})
   if(changed)setEntries([...known.values()])
  }
  scan();const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true})
  const focus=(event:FocusEvent)=>{if((event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)&&event.target!==target.current)cancel.current()}
  document.addEventListener('focusin',focus)
  return()=>{observer.disconnect();document.removeEventListener('focusin',focus);cancel.current();for(const entry of known.values())entry.slot.remove()}
 },[])
 function start(entry:Entry){
  if(active===entry.id&&state!=='idle'){cancel.current();return}
  cancel.current();setActive(entry.id);target.current=entry.field;setMessage('')
  if(entry.field.disabled||entry.field.readOnly){setMessage(isUrdu?'یہ خانہ ابھی قابلِ ترمیم نہیں۔':'This field is currently unavailable.');return}
  cancel.current=dictate({language,onState:setState,onInterim:setMessage,onError:setMessage,onText:text=>{const ok=insertDictation(entry.field,text);setMessage(ok?(isUrdu?'متن شامل ہو گیا۔ بھیجنے سے پہلے دیکھ لیں۔':'Text inserted. Review it before submitting.'):(isUrdu?'خانہ بند ہو گیا؛ متن شامل نہیں ہوا۔':'The field is no longer editable.'))}})
 }
 return <>{entries.map(entry=>createPortal(<><button type="button" className={`field-mic ${active===entry.id&&state!=='idle'?'listening':''}`} onPointerDown={e=>e.preventDefault()} onClick={e=>{e.preventDefault();e.stopPropagation();start(entry)}} aria-label={isUrdu?'اس خانے میں بول کر لکھیں':'Dictate into this field'} title={isUrdu?'بول کر لکھیں':'Dictate into this field'}>{active===entry.id&&state!=='idle'?<Square size={15}/>:<Mic size={15}/>}<span>{active===entry.id&&state!=='idle'?(isUrdu?'بند کریں':'Stop'):(isUrdu?'بول کر لکھیں':'Dictate')}</span></button>{active===entry.id&&<span className="dictation-options"><select aria-label="Dictation language" value={language} disabled={state!=='idle'} onChange={e=>setLanguage(e.target.value)}><option value="ur">اردو</option><option value="en">English</option></select><small role="status">{state==='starting'?(isUrdu?'مائیک شروع ہو رہا ہے…':'Starting microphone…'):state==='listening'?(message|| (isUrdu?'سن رہا ہوں…':'Listening…')):message}</small></span>}</>,entry.slot,entry.id))}</>
}
