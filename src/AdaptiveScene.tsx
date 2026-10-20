import {lazy,Suspense,useEffect,useState} from 'react'
const Scene=lazy(()=>import('./SpaceScene'))
export function preferLite(){
 if(typeof window==='undefined')return true
 const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection
 return window.matchMedia('(max-width: 960px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches||!!connection?.saveData
}
export default function AdaptiveScene({paused}:{paused:boolean}){
 const [lite,setLite]=useState(preferLite)
 useEffect(()=>{const query=window.matchMedia('(max-width: 960px), (pointer: coarse), (prefers-reduced-motion: reduce)');const update=()=>setLite(preferLite());query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[])
 if(lite)return <div className="light-space" aria-hidden="true"><div className="light-sun"/><div className="light-orbit orbit-one"><i/></div><div className="light-orbit orbit-two"><i/></div><div className="light-orbit orbit-three"><i/></div></div>
 return <Suspense fallback={<div className="scene-fallback"/>}><Scene paused={paused}/></Suspense>
}
