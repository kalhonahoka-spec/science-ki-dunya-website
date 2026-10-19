import { openAssistant } from './ScienceAssistant'
import VoiceReader from './VoiceReader'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, BookOpen, Bot, Check, FlaskConical, Sparkles, X } from 'lucide-react'

export class SceneBoundary extends Component<{children: ReactNode}, {failed:boolean}> {
  state = {failed:false}
  static getDerivedStateFromError(){ return {failed:true} }
  render(){return this.state.failed ? <div className="scene-fallback" aria-hidden="true"/> : this.props.children}
}

export function DetailDialog({title, children, onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog?.close();document.body.style.overflow=old}},[])
  return <dialog ref={ref} className="detail-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} aria-labelledby="detail-title"><div><button className="close-modal" onClick={onClose} aria-label="Close dialog"><X/></button><span className="dialog-symbol"><Sparkles/></span><h2 id="detail-title">{title}</h2>{children}</div></dialog>
}

export function Tutor({isUrdu}:{isUrdu:boolean}) {
 const [question,setQuestion]=useState(''),[level,setLevel]=useState('8')
 function ask(text=question){openAssistant(isUrdu?`جماعت ${level} کے طالب علم کے لیے سمجھائیں: ${text}`:`Explain for a grade ${level} student: ${text}`)}
 return <><div className="demo-top"><div><small>SKD AI TUTOR</small><h3>{isUrdu?'اپنا سوال پوچھیں، بات کر کے سیکھیں':'Ask your question. Learn through conversation.'}</h3></div><label className="grade-select">{isUrdu?'جماعت':'Grade'}<select value={level} onChange={e=>setLevel(e.target.value)}><option>6</option><option>8</option><option>10</option></select></label></div><p>{isUrdu?'یہ خانہ آپ کا سوال اصل Gemini اسسٹنٹ میں کھولتا ہے۔ وہاں سوال بھیجیں یا وائس کال شروع کریں۔':'Open your question in the live Gemini assistant, then send it or start a voice call.'}</p><form className="question-box" onSubmit={e=>{e.preventDefault();ask()}}><input value={question} onChange={e=>setQuestion(e.target.value)} minLength={3} maxLength={1000} required aria-label={isUrdu?'اپنا سائنسی سوال':'Your science question'} placeholder={isUrdu?'تارے کیسے بنتے ہیں؟':'How do stars form?'}/><button type="submit" aria-label="Open question in SKD AI"><ArrowRight/></button></form><div className="suggested-questions">{(isUrdu?['آسمان نیلا کیوں ہے؟','پودے غذا کیسے بناتے ہیں؟','مجھے روشنی پر تین سوالوں کا کوئز دیں۔']:['Why is the sky blue?','How do plants make food?','Give me a three-question quiz about light.']).map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div><button className="lab-button" onClick={()=>openAssistant()}><Bot/>{isUrdu?'SKD اسسٹنٹ اور وائس کال کھولیں':'Open SKD assistant & voice call'}</button></>
}