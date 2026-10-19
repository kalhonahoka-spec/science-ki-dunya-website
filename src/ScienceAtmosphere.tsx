import type {CSSProperties} from 'react'

/** A fixed atmosphere behind every section, not just the individual tool panels. */
export default function ScienceAtmosphere({paused}:{paused:boolean}){
 return <div className={`science-atmosphere ${paused?'atmosphere-paused':''}`} aria-hidden="true">
  <div className="aurora-stream stream-cyan"/><div className="aurora-stream stream-violet"/><div className="aurora-stream stream-rose"/>
  <div className="atmosphere-grid"/>
  {Array.from({length:18},(_,i)=><span key={i} className={`science-mote mote-${i%3}`} style={{left:`${(i*37+9)%100}%`,top:`${(i*23+7)%100}%`,'--drift-time':`${18+i%7*3}s`,'--drift-delay':`${-i*2}s`} as CSSProperties}>{i%6===0?<svg viewBox="0 0 60 60"><ellipse cx="30" cy="30" rx="26" ry="10"/><ellipse cx="30" cy="30" rx="26" ry="10" transform="rotate(60 30 30)"/><ellipse cx="30" cy="30" rx="26" ry="10" transform="rotate(120 30 30)"/><circle cx="30" cy="30" r="3"/></svg>:null}</span>)}
 </div>
}
