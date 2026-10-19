import { ElevenReader } from './CloudTools'

export default function VoiceReader({text,isUrdu}:{text:string;isUrdu:boolean}) {
 return <div className="reader-shell"><ElevenReader text={text} isUrdu={isUrdu}/></div>
}
