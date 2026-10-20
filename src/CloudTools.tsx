import StudyStudio from './StudyStudio'
import PodcastStudio from './PodcastStudio'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Download, Sparkles, Volume2 } from 'lucide-react'

export function audioPreview(text:string) {
 const words=text.trim().split(/\s+/).filter(Boolean).slice(0,150)
 while(words.join(' ').length>1200)words.pop()
 return words.join(' ')
}

export function ElevenReader({text,isUrdu:u}:{text:string;isUrdu:boolean}){
  const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
  const preview=audioPreview(text)
  const request=useRef<AbortController|null>(null),audio=useRef<HTMLAudioElement|null>(null)
  useEffect(()=>{const stop=(event:Event)=>{if((event as CustomEvent).detail!==audio.current)audio.current?.pause()};window.addEventListener('skd-speech-start',stop);return()=>{window.removeEventListener('skd-speech-start',stop);request.current?.abort();audio.current?.pause()}},[])
  useEffect(()=>{setUrl('');setMessage('');request.current?.abort();setBusy(false)},[text,u])
  useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url])
  async function generate(){
    setBusy(true);setMessage('');const controller=new AbortController();request.current=controller
    try{const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:preview,language:u?'ur':'en'}),signal:controller.signal});if(!response.ok){const data=await response.json().catch(()=>({error:'Start the local API server to enable ElevenLabs.'}));throw new Error(data.error)}const blob=await response.blob();if(!blob.type.includes('audio'))throw new Error('Audio service unavailable. Start the local API server.');if(!controller.signal.aborted)setUrl(URL.createObjectURL(blob))}catch(e){if(!controller.signal.aborted)setMessage(e instanceof Error?e.message:'Could not generate audio.')}finally{if(!controller.signal.aborted)setBusy(false)}
  }
  return <div className="cloud-reader">{!url?<button className="lab-button" disabled={busy||!preview} onClick={generate}><Volume2 size={16}/>{busy?(u?'آواز تیار ہو رہی ہے…':'Preparing audio…'):(u?'مختصر آڈیو سنیں':'Listen to sample')}</button>:<audio ref={audio} controls src={url} onPlay={()=>{window.speechSynthesis?.cancel();window.dispatchEvent(new CustomEvent('skd-speech-start',{detail:audio.current}))}} aria-label="ElevenLabs read aloud"/>}<small>{u?'آڈیو نمونہ: زیادہ سے زیادہ ۱۵۰ الفاظ یا ۱۲۰۰ حروف۔ مختصر متن پورا پڑھا جاتا ہے۔':'Audio preview: up to 150 words or 1,200 characters. Shorter text is read in full.'} {preview.split(/\s+/).filter(Boolean).length} {u?'الفاظ':'words'}</small>{message&&<p role="status">{message}</p>}</div>
}

export default function CloudTools({u}:{u:boolean}){
 return <div className="cloud-tools"><StudyStudio u={u}/><details className="advanced-audio"><summary>{u?'طویل آڈیو پوڈکاسٹ (اضافی کریڈٹس)':'Long audio podcasts (additional credits)'}</summary><PodcastStudio u={u}/></details></div>
}
