export type RecognitionResult={isFinal:boolean;0:{transcript:string}}
export type Recognition={lang:string;continuous:boolean;interimResults:boolean;onstart:(()=>void)|null;onresult:((e:{resultIndex:number;results:ArrayLike<RecognitionResult>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void;stop:()=>void}
export function recognitionAPI(){const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};return w.SpeechRecognition||w.webkitSpeechRecognition}
export function speechError(code:string,urdu=false){
 const messages:Record<string,[string,string]>={
  'not-allowed':['Microphone permission denied. Allow microphone access for this site in your browser.','مائیک کی اجازت نہیں ملی۔ براؤزر میں اس سائٹ کے لیے مائیک کی اجازت دیں۔'],
  'service-not-allowed':['Speech recognition is blocked by this browser. Open this app in Chrome or Edge and allow the microphone.','اس براؤزر میں آواز کی شناخت بند ہے۔ ایپ کروم یا ایج میں کھولیں اور مائیک کی اجازت دیں۔'],
  'audio-capture':['No microphone is available. Connect a microphone and try again.','مائیک دستیاب نہیں۔ مائیک منسلک کر کے دوبارہ کوشش کریں۔'],
  network:['Speech recognition could not connect. Check your internet connection, or try Chrome/Edge.','آواز کی شناخت کا رابطہ نہیں ہوا۔ انٹرنیٹ چیک کریں یا کروم/ایج آزمائیں۔'],
  'no-speech':['No speech detected. Press the microphone and try again.','آواز سنائی نہیں دی۔ مائیک دبا کر دوبارہ بولیں۔'],
  unsupported:['Voice input is unavailable here. Open this app in Chrome or Edge; typing still works.','یہاں وائس ان پٹ دستیاب نہیں۔ ایپ کروم یا ایج میں کھولیں؛ ٹائپنگ دستیاب ہے۔']
 }
 return (messages[code]||['Could not start voice input. Try again.','وائس ان پٹ شروع نہیں ہوا۔ دوبارہ کوشش کریں۔'])[urdu?1:0]
}
export function dictate(options:{language:string;onText:(text:string)=>void;onState:(state:string)=>void;onError:(message:string)=>void;onInterim?:(text:string)=>void;onSuperseded?:()=>void}){
 const API=recognitionAPI();if(!API){options.onError(speechError('unsupported',options.language==='ur'));return ()=>{}}
 const token={},r=new API();let done=false
 window.speechSynthesis?.cancel();document.querySelectorAll('audio').forEach(audio=>audio.pause());window.dispatchEvent(new Event('skd-speech-start'))
 const clean=()=>{if(done)return;done=true;r.onstart=null;r.onresult=null;r.onerror=null;r.onend=null;window.removeEventListener('skd-mic-start',other);r.abort();options.onState('idle')}
 const other=(event:Event)=>{if((event as CustomEvent).detail!==token){clean();options.onSuperseded?.()}}
 window.dispatchEvent(new CustomEvent('skd-mic-start',{detail:token}));window.addEventListener('skd-mic-start',other)
 r.lang=options.language==='ur'?'ur-PK':'en-US';r.continuous=false;r.interimResults=true
 r.onstart=()=>{if(!done)options.onState('listening')}
 r.onresult=e=>{if(done)return;let final='',interim='';for(let i=e.resultIndex;i<e.results.length;i++){const result=e.results[i];if(result.isFinal)final+=result[0].transcript+' ';else interim+=result[0].transcript}options.onInterim?.(interim);if(final.trim()){clean();options.onText(final.trim())}}
 r.onerror=e=>{if(done)return;clean();if(e.error!=='aborted')options.onError(speechError(e.error,options.language==='ur'))}
 r.onend=()=>{if(!done){clean();options.onError(speechError('no-speech',options.language==='ur'))}}
 try{options.onState('starting');r.start()}catch{clean();options.onError(speechError('service-not-allowed',options.language==='ur'))}
 return clean
}

export function insertDictation(field:HTMLInputElement|HTMLTextAreaElement,text:string){
 if(!field.isConnected||field.disabled||field.readOnly)return false
 const start=field.selectionStart??field.value.length,end=field.selectionEnd??start
 const before=field.value.slice(0,start),after=field.value.slice(end)
 const insert=(before&&!/\s$/.test(before)?' ':'')+text+(after&&!/^\s/.test(after)?' ':'')
 const value=(before+insert+after).slice(0,field.maxLength<0?undefined:field.maxLength)
 const prototype=field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype
 Object.getOwnPropertyDescriptor(prototype,'value')?.set?.call(field,value)
 field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}))
 field.focus();field.setSelectionRange(Math.min(start+insert.length,value.length),Math.min(start+insert.length,value.length));return true
}

export async function speakReply(text:string,language:string,provider:string,signal:AbortSignal,playAudio?:(blob:Blob,signal:AbortSignal)=>Promise<void>){
 const chunks=text.replace(/\[[A-Z]?\d+\]/g,'').match(/[\s\S]{1,1000}(?:\s|$)|[\s\S]{1,1000}/g)||[]
 for(let index=0;index<chunks.length;index++){
  if(signal.aborted)throw new DOMException('Stopped','AbortError')
  if(provider==='device'){
   const synth=window.speechSynthesis,voice=synth?.getVoices().find(v=>v.lang.toLowerCase().startsWith(language))
   if(!voice)throw Error(language==='ur'?'آلے میں اردو آواز موجود نہیں۔ کال کی آواز ElevenLabs منتخب کریں۔':'No matching device voice. Choose ElevenLabs in call voice settings.')
   await new Promise<void>((resolve,reject)=>{
    const utterance=new SpeechSynthesisUtterance(chunks[index]);utterance.voice=voice;utterance.lang=voice.lang
    const cleanup=()=>{signal.removeEventListener('abort',abort);window.removeEventListener('skd-speech-start',interrupted);utterance.onend=null;utterance.onerror=null}
    const abort=()=>{cleanup();synth.cancel();reject(new DOMException('Stopped','AbortError'))}
    const interrupted=()=>{cleanup();synth.cancel();reject(Error('Playback interrupted. Press Continue call to listen again.'))}
    synth.cancel();window.dispatchEvent(new Event('skd-speech-start'));window.addEventListener('skd-speech-start',interrupted)
    signal.addEventListener('abort',abort,{once:true});utterance.onend=()=>{cleanup();resolve()};utterance.onerror=()=>{cleanup();reject(Error('Device speech playback failed.'))};synth.speak(utterance)
   })
  }else{
   if(index)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},1600);const abort=()=>{clearTimeout(timer);reject(new DOMException('Stopped','AbortError'))};signal.addEventListener('abort',abort,{once:true})})
   const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:chunks[index],language}),signal})
   if(!response.ok){const body=await response.json();throw Error(body.error||'Voice service unavailable.')}
   const blob=await response.blob();if(!blob.type.includes('audio'))throw Error('No audio returned by the voice service.')
   if(signal.aborted)throw new DOMException('Stopped','AbortError')
   if(playAudio){await playAudio(blob,signal);continue}
   const url=URL.createObjectURL(blob),audio=new Audio(url)
   try{await new Promise<void>((resolve,reject)=>{
    const cleanup=()=>{signal.removeEventListener('abort',abort);window.removeEventListener('skd-speech-start',other);audio.onended=null;audio.onerror=null}
    const abort=()=>{cleanup();audio.pause();reject(new DOMException('Stopped','AbortError'))}
    const other=(event:Event)=>{if((event as CustomEvent).detail!==audio){cleanup();audio.pause();reject(Error('Playback interrupted. Press Continue call to listen again.'))}}
    window.speechSynthesis?.cancel();window.dispatchEvent(new CustomEvent('skd-speech-start',{detail:audio}));window.addEventListener('skd-speech-start',other)
    signal.addEventListener('abort',abort,{once:true});audio.onended=()=>{cleanup();resolve()};audio.onerror=()=>{cleanup();reject(Error('Audio playback failed.'))};audio.play().catch(()=>{cleanup();reject(Error('Browser blocked audio playback. Use Read aloud or allow sound for this site.'))})
   })}finally{audio.pause();audio.src='';URL.revokeObjectURL(url)}
  }
 }
}
