// Unlock playback during the user's Start call gesture, before asynchronous AI replies.
export function createCallPlayback(){
 let context:AudioContext|null=null
 return {
  unlock(){try{const API=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!context&&API)context=new API();if(context?.state==='suspended')void context.resume().catch(()=>{})}catch{}},
  async play(blob:Blob,signal:AbortSignal){
   if(!context)throw Error('Call audio is unavailable in this browser. Open the app in Chrome or Edge.')
   if(context.state!=='running')throw Error('Sound is paused by the browser. Press Replay answer to enable audio.')
   const buffer=await context.decodeAudioData(await blob.arrayBuffer())
   if(signal.aborted)throw new DOMException('Stopped','AbortError')
   await new Promise<void>((resolve,reject)=>{
    const source=context!.createBufferSource();source.buffer=buffer;source.connect(context!.destination)
    const cleanup=()=>{signal.removeEventListener('abort',abort);window.removeEventListener('skd-speech-start',other);source.onended=null;source.disconnect()}
    const abort=()=>{source.stop();cleanup();reject(new DOMException('Stopped','AbortError'))}
    const other=()=>{source.stop();cleanup();reject(Error('Audio interrupted. Press Replay answer to listen again.'))}
    window.speechSynthesis?.cancel();window.dispatchEvent(new Event('skd-speech-start'));window.addEventListener('skd-speech-start',other)
    signal.addEventListener('abort',abort,{once:true});source.onended=()=>{cleanup();resolve()};source.start()
   })
  },
  available(){return !!context},
  dispose(){if(context)void context.close().catch(()=>{});context=null},
 }
}
