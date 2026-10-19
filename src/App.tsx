import ScienceAtmosphere from './ScienceAtmosphere'
import CloudTools from './CloudTools'
import UniversalMic from './UniversalMic'
import PodcastStudio from './PodcastStudio'
import ScienceAssistant, { openAssistant } from './ScienceAssistant'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Cpu, Telescope, Clapperboard, Network, BadgeCheck, LibraryBig, ArrowRight, Atom, BookOpen, Bot, BrainCircuit, ChevronRight, CirclePlay,
  FlaskConical, Globe2, GraduationCap, Languages, Menu, Mic2, Orbit,
  Play, Rocket, School, Search, ShieldCheck, Sparkles, Users, WandSparkles, X
} from 'lucide-react'
import VideoLibrary from './VideoLibrary'
import DiscoveryLab from './DiscoveryLab'
import Community, { CommunityFeed, TiltCard } from './Community'
import { DetailDialog, SceneBoundary, Tutor } from './Experience'
const SpaceScene = lazy(() => import('./SpaceScene'))

type Lang = 'en' | 'ur'
type DemoTab = 'tutor' | 'feed' | 'school' | 'studio'

const copy = {
  en: {
    nav: ['Explore', 'AI Tutor', 'For Schools', 'Creator Studio'],
    heroKicker: 'Pakistan’s AI science learning network',
    heroTitleA: 'Curiosity becomes', heroTitleB: 'understanding.',
    heroBody: 'Ask, explore, create and learn science at your own level — with trusted sources, visual explanations and a community built for discovery.',
    primary: 'Explore the prototype', secondary: 'Watch how it works',
    trusted: 'Built for students, teachers, schools and science creators',
    stat1: 'Adaptive learning paths', stat2: 'Bilingual by design', stat3: 'Evidence first',
    demoEyebrow: 'INTERACTIVE PRODUCT DEMO', demoTitle: 'One platform. Every way to learn science.',
    tabs: ['AI Tutor', 'Smart Feed', 'School Space', 'Creator Studio'],
    question: 'Why don’t we feel the Earth moving?', ask: 'Ask in your own words', answerTitle: 'Let’s understand it at your level',
    answer: 'You are moving with Earth at a nearly constant speed. Just like sitting inside a smoothly moving train, constant motion is hard to feel until speed or direction changes.',
    source: '3 trusted sources', visual: 'Generate visual', voice: 'Listen in Urdu', quiz: 'Test my understanding',
    sectionKicker: 'A COMPLETE LEARNING ECOSYSTEM', sectionTitle: 'More than answers. A world built around learning.',
    ctaTitle: 'Science belongs to every curious mind.', ctaBody: 'Start with a question. Leave with a clearer view of the world.', cta: 'Enter Science Ki Dunya',
  },
  ur: {
    nav: ['دریافت کریں', 'اے آئی استاد', 'اسکولز کے لیے', 'کریئیٹر اسٹوڈیو'],
    heroKicker: 'پاکستان کا اے آئی سائنس لرننگ نیٹ ورک',
    heroTitleA: 'تجسس سے جنم لے', heroTitleB: 'سمجھ اور شعور۔',
    heroBody: 'سوال کریں، تحقیق کریں، تخلیق کریں اور اپنی سطح کے مطابق سائنس سیکھیں — مستند ذرائع، بصری وضاحت اور سیکھنے والی کمیونٹی کے ساتھ۔',
    primary: 'پروٹوٹائپ دیکھیں', secondary: 'یہ کیسے کام کرتا ہے',
    trusted: 'طلبہ، اساتذہ، اسکولز اور سائنس کریئیٹرز کے لیے',
    stat1: 'ذاتی لرننگ راستے', stat2: 'اردو اور انگلش', stat3: 'ثبوت سب سے پہلے',
    demoEyebrow: 'انٹرایکٹو پروڈکٹ ڈیمو', demoTitle: 'ایک پلیٹ فارم، سائنس سیکھنے کے کئی انداز',
    tabs: ['اے آئی استاد', 'اسمارٹ فیڈ', 'اسکول اسپیس', 'کریئیٹر اسٹوڈیو'],
    question: 'ہمیں زمین کی حرکت محسوس کیوں نہیں ہوتی؟', ask: 'اپنے الفاظ میں سوال کریں', answerTitle: 'آئیے آپ کی سطح کے مطابق سمجھتے ہیں',
    answer: 'آپ زمین کے ساتھ تقریباً یکساں رفتار سے حرکت کر رہے ہیں۔ بالکل ایسے جیسے ہموار چلتی ٹرین میں بیٹھے ہوں؛ مستقل حرکت تب تک محسوس نہیں ہوتی جب تک رفتار یا سمت تبدیل نہ ہو۔',
    source: '3 مستند ذرائع', visual: 'بصری خاکہ بنائیں', voice: 'اردو میں سنیں', quiz: 'میری سمجھ جانچیں',
    sectionKicker: 'مکمل لرننگ ایکو سسٹم', sectionTitle: 'صرف جواب نہیں، سیکھنے کی پوری دنیا',
    ctaTitle: 'سائنس ہر متجسس ذہن کا حق ہے', ctaBody: 'ایک سوال سے آغاز کریں اور دنیا کو بہتر انداز میں سمجھیں۔', cta: 'سائنس کی دنیا میں داخل ہوں',
  }
}

const featureData = [
  { icon: Cpu, en: 'Adaptive AI Tutor', ur: 'ذاتی اے آئی استاد', enText: 'Explanations that adjust to age, class and prior knowledge.', urText: 'عمر، جماعت اور سابقہ علم کے مطابق وضاحت۔', color: 'cyan' },
  { icon: Telescope, en: 'Research Mode', ur: 'ریسرچ موڈ', enText: 'Compare trusted sources and follow evidence to the original research.', urText: 'مستند ذرائع کا موازنہ اور اصل تحقیق تک رسائی۔', color: 'blue' },
  { icon: Clapperboard, en: 'Creator Studio', ur: 'کریئیٹر اسٹوڈیو', enText: 'Make infographics, podcasts, videos, quizzes and flashcards.', urText: 'انفوگرافکس، پوڈکاسٹ، ویڈیوز، کوئز اور فلیش کارڈز۔', color: 'amber' },
  { icon: LibraryBig, en: 'School Workspaces', ur: 'اسکول ورک اسپیس', enText: 'Upload textbooks, map chapters and support every learner.', urText: 'کتابیں اپ لوڈ کریں، ابواب میپ کریں اور ہر طالب علم کی مدد کریں۔', color: 'green' },
  { icon: Network, en: 'Science Community', ur: 'سائنس کمیونٹی', enText: 'Profiles, discussions, competitions, projects and safe collaboration.', urText: 'پروفائلز، مباحثے، مقابلے، پروجیکٹس اور محفوظ تعاون۔', color: 'violet' },
  { icon: BadgeCheck, en: 'Evidence & Safety', ur: 'ثبوت اور حفاظت', enText: 'Source labels, scientific review, child safety and clear corrections.', urText: 'ذرائع، سائنسی جانچ، بچوں کی حفاظت اور واضح اصلاحات۔', color: 'rose' },
]

function Logo({compact=false}:{compact?:boolean}) {
  return <div className={`brand skd-brand ${compact?'compact':''}`} aria-label="SKD — Science Ki Dunya, سائنس کی دنیا"><img src="/skd-logo.png" alt="SKD — سائنس کی دنیا" width="240" height="160"/></div>
}

function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [tab, setTab] = useState<DemoTab>('tutor')
  const [menu, setMenu] = useState(false)
  const [video, setVideo] = useState(false)
  const [detail, setDetail] = useState<number|null>(null)
  const [paused, setPaused] = useState(false)
  useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ur'?'rtl':'ltr'},[lang])
  const reduced = useReducedMotion()
  const t = copy[lang]
  const isUrdu = lang === 'ur'
  const direction = isUrdu ? 'rtl' : 'ltr'
  const tabs: DemoTab[] = ['tutor','feed','school','studio']
  const featureCards = useMemo(() => featureData, [])

  const scrollToDemo = () => document.getElementById('demo')?.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'})

  return <div className={isUrdu ? 'app urdu' : 'app'} dir={direction}>
    <ScienceAtmosphere paused={paused||!!reduced}/>
    <a className="skip-link" href="#demo">{isUrdu?'ڈیمو پر جائیں':'Skip to demo'}</a>
    <header className="nav-wrap">
      <nav className="nav shell" aria-label="Main navigation">
        <Logo compact />
        <div className="nav-links">
          {t.nav.map((item, i)=><a key={item} onClick={()=>{if(i>0)setTab(tabs[i===1?0:i])}} href={i===0?'#features':'#demo'}>{item}</a>)}
        <a href="#discovery-lab">{isUrdu?'جدید فیچرز':'Discovery Lab'}</a></div>
        <div className="nav-actions">
          <div className="language-switch" aria-label="Choose language">
            <Languages size={16}/>
            <button className={!isUrdu?'active':''} onClick={()=>setLang('en')}>English</button>
            <button lang="ur" className={isUrdu?'active':''} onClick={()=>setLang('ur')}>اردو</button>
          </div>
          <button className="nav-cta" onClick={scrollToDemo}>{isUrdu?'ڈیمو کھولیں':'Open demo'}<ArrowRight size={16}/></button>
          <button className="menu-button" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-label="Open menu">{menu?<X/>:<Menu/>}</button>
        </div>
      </nav>
      <AnimatePresence>{menu&&<motion.div className="mobile-menu" initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}>{t.nav.map((n,i)=><a onClick={()=>{setMenu(false);if(i>0)setTab(tabs[i===1?0:i])}} key={n} href={i===0?'#features':'#demo'}>{n}</a>)}<a href="#discovery-lab" onClick={()=>setMenu(false)}>{isUrdu?'جدید فیچرز':'Discovery Lab'}</a><a href="#videos" onClick={()=>setMenu(false)}>{isUrdu?'سائنس ویڈیوز':'Science videos'}</a></motion.div>}</AnimatePresence>
    </header>

    <main>
      <section className="hero cosmic-hero">
        <SceneBoundary><Suspense fallback={<div className="scene-fallback"/>}><SpaceScene paused={paused || !!reduced}/></Suspense></SceneBoundary>
        <button className="motion-toggle" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{isUrdu?(paused?'حرکت چلائیں':'حرکت روکیں'):(paused?'Resume orbit':'Pause orbit')}</button>
        <div className="cosmic-vignette"/>
        <div className="hero-grid shell">
          <motion.div className="hero-copy" initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
            <div className="eyebrow"><Sparkles size={16}/>{t.heroKicker}</div>
            <h1><span className="title-white">{t.heroTitleA}</span><br/><span className="title-gradient">{t.heroTitleB}</span></h1>
            <p>{t.heroBody}</p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={scrollToDemo}>{t.primary}<ArrowRight size={18}/></button>
              <button className="ghost-button" onClick={()=>setVideo(true)}><CirclePlay size={20}/>{t.secondary}</button>
              <a className="lab-hero-link" href="#discovery-lab"><Mic2 size={17}/>{isUrdu?'آواز اور جدید فیچرز آزمائیں':'Try voice & advanced features'}<ArrowRight size={16}/></a>
            </div>
            <div className="trust-line"><div className="avatars"><span>ST</span><span>TE</span><span>SC</span></div><span>{t.trusted}</span></div>
          </motion.div>
          <motion.div className="hero-art cosmic-copy" initial={{opacity:0,scale:.88,x:40}} animate={{opacity:1,scale:1,x:0}} transition={{duration:1,delay:.12}}>
            <div className="cosmos-console" onClick={()=>openAssistant(isUrdu?'نظام شمسی کیسے کام کرتا ہے؟':'How does the Solar System work?')} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAssistant(isUrdu?'نظام شمسی کیسے کام کرتا ہے؟':'How does the Solar System work?')}}} aria-label={isUrdu?'سائنس ڈیمو کھولیں':'Open science explorer demo'}>
              <div className="console-top"><span><i/><i/><i/></span><b>{isUrdu?'سائنس ایکسپلورر':'SCIENCE EXPLORER'}</b><small>{isUrdu?'ڈیمو':'DEMO'}</small></div>
              <div className="console-body">
                <span className="scan-line"/><div className="console-orbit"><Atom/><i/><i/><i/></div>
                <div className="console-data"><small>{isUrdu?'آج کا مشن':'TODAY’S MISSION'}</small><strong>{isUrdu?'نظامِ شمسی دریافت کریں':'Explore the Solar System'}</strong><span>{isUrdu?'اے آئی کے ساتھ سیکھیں':'Learn with your AI tutor'} <b>→</b></span></div>
              </div>
              <div className="console-footer"><span>SKD AI <b>ASK &amp; LISTEN</b></span><span>SCIENCE <b>EXPLORE</b></span></div>
            </div>
            <motion.button type="button" onClick={()=>{window.dispatchEvent(new CustomEvent('skd-open-lab',{detail:'visual'}));document.getElementById('discovery-lab')?.scrollIntoView({behavior:'smooth'})}} className="orbital-badge badge-one" animate={reduced?{}:{y:[0,-10,0],rotate:[-3,2,-3]}} transition={{repeat:Infinity,duration:5}}><FlaskConical/><span>{isUrdu?'تجربات':'Experiments'}</span></motion.button>
            <motion.button type="button" onClick={()=>openAssistant()} className="orbital-badge badge-two" animate={reduced?{}:{y:[0,12,0],rotate:[2,-2,2]}} transition={{repeat:Infinity,duration:6}}><Bot/><span>{isUrdu?'اے آئی استاد':'AI Tutor'}</span></motion.button>
            <motion.button type="button" onClick={()=>openAssistant('','web')} className="orbital-badge badge-three" animate={reduced?{}:{x:[0,9,0],y:[0,-6,0]}} transition={{repeat:Infinity,duration:7}}><Search/><span>{isUrdu?'مستند تحقیق':'Trusted research'}</span></motion.button>
            <button className="planet-callout" onClick={()=>openAssistant(isUrdu?'سیاروں کے بارے میں بتائیں۔':'Tell me about the planets.')}><span>04</span><b>{isUrdu?'سیکھنے کی پوری کائنات':'A universe of learning'}</b><small>{isUrdu?'ہر سیارہ ایک نیا موضوع':'Every planet is a new subject'}</small></button>
          </motion.div>
        </div>
        <div className="stats shell">
          {[['01',t.stat1],['02',t.stat2],['03',t.stat3]].map(([n,label])=><div className="stat" key={n}><b>{n}</b><span>{label}</span></div>)}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div className="shell">
          <div className="section-heading"><span>{t.demoEyebrow}</span><h2>{t.demoTitle}</h2></div>
          <div className="demo-shell">
            <aside className="demo-sidebar">
              <Logo compact/>
              <div className="demo-tabs">
                {tabs.map((item,i)=>{const Icon=[Bot,Orbit,GraduationCap,WandSparkles][i];return <button key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}><Icon size={19}/><span>{t.tabs[i]}</span><ChevronRight size={15}/></button>})}
              </div>
              <div className="progress-card"><div><span>{isUrdu?'سیکھنے کا آغاز':'Start exploring'}</span><b>SKD</b></div><div className="progress"><i/></div><small>{isUrdu?'سوال کریں، جواب سنیں، تحقیق کریں':'Ask, listen and explore evidence'}</small></div>
            </aside>
            <div className="demo-main">
              <header className="tool-chrome"><span>SKD · {isUrdu?'سائنس ورک اسپیس':'SCIENCE WORKSPACE'}</span><a href="#discovery-lab">{isUrdu?'مزید دریافت کریں':'Explore tools'} ↗</a></header>
              <AnimatePresence mode="wait">
                <motion.div key={tab+lang} initial={{opacity:0,x:isUrdu?-18:18}} animate={{opacity:1,x:0}} exit={{opacity:0,x:isUrdu?18:-18}} transition={{duration:.25}}>
                  {tab==='tutor'&&<Tutor isUrdu={isUrdu}/>}
                  {tab==='feed'&&<CommunityFeed isUrdu={isUrdu} compact/>}
                  {tab==='school'&&<SchoolDemo isUrdu={isUrdu}/>}
                  {tab==='studio'&&<StudioDemo isUrdu={isUrdu}/>}
                </motion.div>
              </AnimatePresence>
              <footer className="tool-chrome tool-bottom"><span>{isUrdu?'سوال · تحقیق · دریافت':'QUESTION · INVESTIGATE · DISCOVER'}</span><a href="#community">{isUrdu?'ہماری کمیونٹی':'Our community'} ↗</a></footer>
            </div>
          </div>
        </div>
      </section>

      <DiscoveryLab isUrdu={isUrdu}/>
      <Community isUrdu={isUrdu}/>
      <VideoLibrary isUrdu={isUrdu}/>

      <section id="features" className="features-section shell">
        <div className="section-heading"><span>{t.sectionKicker}</span><h2>{t.sectionTitle}</h2></div>
        <div className="feature-grid">
          {featureCards.map((feature,i)=><motion.article key={feature.en} className={`feature-card ${feature.color}`} whileHover={reduced?{}:{y:-8,rotateX:2}} transition={{type:'spring',stiffness:300,damping:22}}>
            <div className="feature-icon"><feature.icon/></div><small>0{i+1}</small><h3>{isUrdu?feature.ur:feature.en}</h3><p>{isUrdu?feature.urText:feature.enText}</p><button onClick={()=>setDetail(i)} aria-label={`Learn more about ${feature.en}`}><ArrowRight/></button>
          </motion.article>)}
        </div>
      </section>

      <section className="quote-section shell">
        <div className="quote-card"><Globe2 className="quote-globe"/><p lang="ur">“سوال سے علم تک، علم سے شعور تک”</p><span>{isUrdu?'سائنس سمجھو، دنیا بدلو':'Understand science. Change the world.'}</span></div>
      </section>

      <section className="final-cta">
        <div className="shell final-grid"><div><span><Rocket size={17}/>{isUrdu?'اگلا قدم':'THE NEXT STEP'}</span><h2>{t.ctaTitle}</h2><p>{t.ctaBody}</p></div><button onClick={scrollToDemo}>{t.cta}<ArrowRight/></button></div>
      </section>
    </main>

    <UniversalMic isUrdu={isUrdu}/><ScienceAssistant isUrdu={isUrdu}/><footer className="footer shell"><Logo compact/><p lang="ur">سائنس سمجھو، دنیا بدلو</p><nav aria-label="Footer"><a href="#demo">{isUrdu?'سائنس ٹولز':'Science tools'}</a><a href="#videos">{isUrdu?'ویڈیوز':'Videos'}</a><a href="#community">{isUrdu?'کمیونٹی':'Community'}</a></nav><span>SKD · 2026</span></footer>

    {video&&<DetailDialog title={isUrdu?'سوال سے دریافت تک':'Your next discovery, in four steps.'} onClose={()=>setVideo(false)}><ol className="walkthrough"><li>{isUrdu?'اردو یا انگلش منتخب کریں۔':'Choose English or Urdu.'}</li><li>{isUrdu?'اے آئی استاد میں نمونہ سوال آزمائیں۔':'Explore a prepared lesson in the AI Tutor.'}</li><li>{isUrdu?'کمیونٹی کی اصل پوسٹس پڑھیں۔':'Read attributed posts from the science community.'}</li><li>{isUrdu?'اسکول اور تخلیقی اسٹوڈیو کے نمونے دیکھیں۔':'Try the school and creator previews.'}</li></ol><button className="primary-button" onClick={()=>{setVideo(false);scrollToDemo()}}>{isUrdu?'آغاز کریں':'Let’s explore'}<ArrowRight size={18}/></button></DetailDialog>}
    {detail!==null&&<DetailDialog title={isUrdu?featureData[detail].ur:featureData[detail].en} onClose={()=>setDetail(null)}><p>{isUrdu?featureData[detail].urText:featureData[detail].enText}</p><p>{isUrdu?'یہ تصوراتی ڈیمو ہے۔ مکمل سروس مستقبل میں دستیاب ہوگی۔':'This is a concept preview. Full service integration is planned.'}</p><button className="primary-button" onClick={()=>{setDetail(null);setTab(detail===2?'studio':detail===3?'school':detail===4?'feed':'tutor');scrollToDemo()}}>{isUrdu?'متعلقہ ڈیمو دیکھیں':'Explore the related demo'}<ArrowRight size={18}/></button></DetailDialog>}
  </div>
}

function SchoolDemo({isUrdu}:{isUrdu:boolean}) {
 const [chapter,setChapter]=useState(0)
 const subjects=['Matter & Energy','Light','Electricity','Earth & Space'],urdu=['مادہ اور توانائی','روشنی','بجلی','زمین اور خلاء']
 const topic=isUrdu?urdu[chapter]:subjects[chapter]
 return <><div className="demo-top"><div><small>{isUrdu?'جماعت ۸ کے لیے سبق کے ٹولز':'GRADE 8 LESSON TOOLS'}</small><h3>{isUrdu?'اپنا باب منتخب کریں':'Choose a chapter to explore'}</h3></div><BookOpen/></div><div className="school-grid"><div className="chapter-list">{subjects.map((name,i)=><button key={name} onClick={()=>setChapter(i)} aria-pressed={chapter===i}><span>0{i+1}</span>{isUrdu?urdu[i]:name}<ChevronRight/></button>)}</div><div className="class-insight"><h4>{topic}</h4><p>{isUrdu?'منتخب باب کی وضاحت، سوالات یا سبق کا منصوبہ SKD اسسٹنٹ سے بنائیں۔':'Use SKD Assistant to explain this chapter, ask quiz questions or prepare a lesson plan.'}</p><button className="lab-button" onClick={()=>openAssistant(isUrdu?`جماعت ۸ کے لیے ${topic} آسان مثالوں سے سمجھائیں۔`:`Explain ${topic} for grade 8 with everyday examples.`)}>{isUrdu?'سبق سمجھائیں':'Explain lesson'}</button><button className="lab-button" onClick={()=>openAssistant(isUrdu?`${topic} پر جماعت ۸ کے لیے تین سوالات کا کوئز لیں، ایک وقت میں ایک سوال پوچھیں۔`:`Quiz me on ${topic} for grade 8, three questions, one at a time.`)}>{isUrdu?'کوئز شروع کریں':'Start quiz'}</button><button className="lab-button" onClick={()=>openAssistant(isUrdu?`${topic} پر جماعت ۸ کے لیے ۳۰ منٹ کا سبق منصوبہ بنائیں۔`:`Create a 30-minute grade 8 lesson plan on ${topic}.`)}>{isUrdu?'سبق کا منصوبہ':'Lesson plan'}</button></div></div></>
}
function StudioDemo({isUrdu}:{isUrdu:boolean}) { return <CloudTools u={isUrdu}/> }

export default App
