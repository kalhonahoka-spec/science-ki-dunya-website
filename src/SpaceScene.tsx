import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, Stars } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

type PlanetProps = { orbit:number; size:number; colors:[string,string]; speed:number; offset:number; ring?:boolean }

function Planet({orbit,size,colors,speed,offset,ring=false}:PlanetProps) {
  const group=useRef<THREE.Group>(null), planet=useRef<THREE.Mesh>(null)
  useFrame(({clock})=>{
    const time=clock.elapsedTime*speed+offset
    if(group.current){group.current.position.set(Math.cos(time)*orbit,Math.sin(time*.72)*.38,Math.sin(time)*orbit*.38)}
    if(planet.current){planet.current.rotation.y+=.006;planet.current.rotation.x+=.001}
  })
  return <group ref={group}>
    <mesh ref={planet} castShadow>
      <sphereGeometry args={[size,64,64]}/>
      <meshStandardMaterial color={colors[0]} emissive={colors[1]} emissiveIntensity={.2} roughness={.52} metalness={.22}/>
    </mesh>
    <mesh scale={1.035}><sphereGeometry args={[size,48,48]}/><meshBasicMaterial color={colors[1]} transparent opacity={.13} wireframe/></mesh>
    {ring&&<mesh rotation={[Math.PI/2.18,0,.2]}><ringGeometry args={[size*1.35,size*2.15,128]}/><meshBasicMaterial color="#f2d68c" transparent opacity={.72} side={THREE.DoubleSide}/></mesh>}
  </group>
}

function Orbit({radius}:{radius:number}) {
  const line=useMemo(()=>{
    const curve=new THREE.EllipseCurve(0,0,radius,radius*.38,0,Math.PI*2)
    const geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(220).map(p=>new THREE.Vector3(p.x,0,p.y)))
    const object=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#65efff',transparent:true,opacity:.16}))
    object.rotation.x=Math.PI/2
    return object
  },[radius])
  return <primitive object={line}/>
}

function EnergyRings(){
  const rings=useRef<THREE.Group>(null)
  useFrame(({clock})=>{if(rings.current){rings.current.rotation.z=clock.elapsedTime*.06;rings.current.rotation.x=Math.sin(clock.elapsedTime*.18)*.08}})
  return <group ref={rings} rotation={[1.2,.05,.18]}>
    {[1.52,1.68,1.92].map((radius,index)=><mesh key={radius}><torusGeometry args={[radius,.012+index*.006,16,180]}/><meshBasicMaterial color={index===1?'#ffcf68':'#62ebff'} transparent opacity={.42-index*.09}/></mesh>)}
  </group>
}

function Nebula(){
  const cloud=useRef<THREE.Group>(null)
  useFrame(({clock})=>{if(cloud.current)cloud.current.rotation.z=clock.elapsedTime*.009})
  return <group ref={cloud} position={[2.5,.1,-5]}>
    <mesh scale={[7,3.8,1]}><sphereGeometry args={[1,48,48]}/><meshBasicMaterial color="#0c67ff" transparent opacity={.065} blending={THREE.AdditiveBlending}/></mesh>
    <mesh position={[1.4,-.3,.4]} scale={[4.8,2.8,1]}><sphereGeometry args={[1,48,48]}/><meshBasicMaterial color="#e330ff" transparent opacity={.055} blending={THREE.AdditiveBlending}/></mesh>
    <Sparkles count={95} scale={[14,7,5]} size={3} speed={.16} color="#9bf4ff" opacity={.7}/>
  </group>
}

function CameraRig(){
  const {camera,pointer}=useThree(); const scroll=useRef(0)
  useEffect(()=>{const update=()=>{scroll.current=Math.min(scrollY/Math.max(innerHeight,1),1.5)};update();addEventListener('scroll',update,{passive:true});return()=>removeEventListener('scroll',update)},[])
  useFrame(()=>{
    camera.position.x=THREE.MathUtils.lerp(camera.position.x,.8+pointer.x*.75+scroll.current*1.2,.028)
    camera.position.y=THREE.MathUtils.lerp(camera.position.y,.35+pointer.y*.5-scroll.current*.3,.028)
    camera.position.z=THREE.MathUtils.lerp(camera.position.z,11.4-scroll.current*2.4,.028)
    camera.lookAt(2.25,0,0)
  }); return null
}

function Universe(){
  const system=useRef<THREE.Group>(null)
  useFrame(({clock})=>{if(system.current)system.current.rotation.z=Math.sin(clock.elapsedTime*.1)*.045})
  return <>
    <Nebula/>
    <group ref={system} position={[3,.05,0]} rotation={[.08,-.18,-.08]}>
      <ambientLight intensity={.32}/><pointLight position={[0,0,1]} intensity={55} color="#ffb62e" distance={32}/><directionalLight position={[4,7,8]} intensity={3} color="#a7f4ff"/>
      <Float speed={1.8} rotationIntensity={.12} floatIntensity={.28}>
        <mesh><sphereGeometry args={[1.32,80,80]}/><meshStandardMaterial color="#ffd86a" emissive="#ff7618" emissiveIntensity={3.6} roughness={.72}/></mesh>
        <mesh scale={1.18}><sphereGeometry args={[1.32,48,48]}/><meshBasicMaterial color="#ff9d2e" transparent opacity={.1} wireframe/></mesh>
        <pointLight intensity={24} color="#ffad2f" distance={18}/>
      </Float>
      <EnergyRings/>
      {[2.35,3.35,4.5,5.8].map(radius=><Orbit key={radius} radius={radius}/>) }
      <Planet orbit={2.35} size={.24} colors={['#69e8d0','#1ed3ff']} speed={.52} offset={.2}/>
      <Planet orbit={3.35} size={.5} colors={['#168be4','#7cecff']} speed={.29} offset={1.45}/>
      <Planet orbit={4.5} size={.36} colors={['#e96a6c','#ffbb7c']} speed={.18} offset={2.5}/>
      <Planet orbit={5.8} size={.7} colors={['#c79263','#ffd28d']} speed={.11} offset={4.2} ring/>
    </group>
  </>
}

export default function SpaceScene({paused=false}:{paused?:boolean}){const container=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(true);useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));if(container.current)observer.observe(container.current);return()=>observer.disconnect()},[]);return <div ref={container} className="space-canvas" aria-hidden="true"><Canvas frameloop={paused || !visible ? 'demand' : 'always'} camera={{position:[.8,.35,11.4],fov:45}} dpr={[1,1.6]} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><color attach="background" args={['#03020d']}/><fog attach="fog" args={['#050311',11,30]}/><Stars radius={80} depth={45} count={3800} factor={3.8} saturation={.65} fade speed={.5}/><Universe/><CameraRig/></Canvas></div>}
