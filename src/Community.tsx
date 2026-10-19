import VoiceReader from './VoiceReader'
import { useState, useEffect, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Bookmark, Check, Globe2, Users, Search, Radio, Sparkles } from 'lucide-react'

export const groupUrl = 'https://www.facebook.com/groups/ScienceKiDuniya'
export const posts = [
  { id: '3736694019832440', category: 'Talks', categoryUr: 'لیکچر', author: 'Qadeer Qureshi · speaker', authorUr: 'قدیر قریشی · مقرر', title: 'What science actually says about evolution', titleUr: 'ارتقاء کے بارے میں سائنس کیا کہتی ہے؟', text: 'A featured recording from The Black Hole, Islamabad: a conversation about common misconceptions around evolution. Lecture held on 15 October 2026.', textUr: 'دی بلیک ہول، اسلام آباد میں قدیر قریشی کا لیکچر: ارتقاء سے متعلق عام غلط فہمیوں پر گفتگو۔ لیکچر ۱۵ اکتوبر ۲۰۲۶ کو ہوا۔', style: 'lecture', icon: Radio },
  { id: '3733905270111315', category: 'Our mission', categoryUr: 'ہمارا مقصد', author: 'Science Ki Duniya · featured post', authorUr: 'سائنس کی دنیا · نمایاں پوسٹ', title: 'Science in every child’s own language', titleUr: 'ہر بچے کے لیے اپنی زبان میں سائنس', text: 'The group’s app proposal imagines students asking science questions at their own level, with local-language answers and support from schools and teachers.', textUr: 'گروپ کی ایپ تجویز کا مقصد ہے کہ بچے اپنی تعلیمی سطح کے مطابق سوال کریں، اپنی زبان میں جواب پائیں اور اساتذہ کے ساتھ سائنس سمجھیں۔', style: 'mission', icon: Sparkles },
  { id: '3737173746451134', category: 'Questions', categoryUr: 'سوالات', author: 'Tariq Hussain · community member', authorUr: 'طارق حسین · کمیونٹی ممبر', title: 'Why are Andromeda and the Milky Way approaching?', titleUr: 'ملکی وے اور اینڈرومیڈا قریب کیوں آ رہی ہیں؟', text: 'A question from the community: if the universe is expanding, why can two galaxies move toward each other? Follow the original discussion and explore the question.', textUr: 'کمیونٹی کا سوال: اگر کائنات پھیل رہی ہے تو دو کہکشائیں ایک دوسرے کے قریب کیسے آ سکتی ہیں؟ اصل گفتگو پڑھیں اور سوال کو مزید دریافت کریں۔', style: 'galaxies', icon: Globe2 },
]

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0), y = useMotionValue(0)
  const rotateX = useSpring(x, { stiffness: 180, damping: 24 })
  const rotateY = useSpring(y, { stiffness: 180, damping: 24 })
  return <motion.div className={`tilt-card ${className}`} style={{ rotateX, rotateY, transformPerspective: 1000 }} onPointerMove={e => {
    if (reduced || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(-((e.clientY - rect.top) / rect.height - .5) * 7)
    y.set(((e.clientX - rect.left) / rect.width - .5) * 9)
    e.currentTarget.style.setProperty('--pointer-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--pointer-y', `${e.clientY - rect.top}px`)
  }} onPointerLeave={() => { x.set(0); y.set(0) }}>{children}</motion.div>
}

const savedPostsKey = 'skd-saved-community-posts'
function readSavedPosts(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(savedPostsKey) || '[]')
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && posts.some(p => p.id === id)))] : []
  } catch { return [] }
}

export function CommunityFeed({ isUrdu, compact = false }: { isUrdu: boolean; compact?: boolean }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<string[]>(readSavedPosts)
  useEffect(() => {
    const sync = () => setSaved(readSavedPosts())
    window.addEventListener('storage', sync)
    window.addEventListener('skd-saved-posts', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('skd-saved-posts', sync)
    }
  }, [])
  const toggleSaved = (id: string) => {
    const current = saved
    const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id]
    setSaved(next)
    try {
      window.localStorage.setItem(savedPostsKey, JSON.stringify(next))
      window.dispatchEvent(new Event('skd-saved-posts'))
    } catch { /* Keep this view usable when browser storage is unavailable. */ }
  }
  const categories = ['All', 'Talks', 'Our mission', 'Questions', 'Saved']
  const labels = ['سبھی', 'لیکچر', 'ہمارا مقصد', 'سوالات', 'محفوظ']
  const filtered = posts.filter(p => (filter === 'All' || (filter === 'Saved' ? saved.includes(p.id) : p.category === filter)) && `${p.title} ${p.titleUr} ${p.author} ${p.authorUr} ${p.text} ${p.textUr}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className={compact ? 'community-feed compact-feed' : 'community-feed'}>
    <div className="feed-toolbar"><div className="filter-chips" aria-label={isUrdu ? 'موضوع منتخب کریں' : 'Filter posts'}>{categories.map((c,i) => <button key={c} aria-pressed={filter===c} className={filter===c?'selected':''} onClick={()=>setFilter(c)}>{isUrdu?labels[i]:c}{c==='Saved'&&saved.length>0?` (${saved.length})`:''}</button>)}</div><label className="post-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={isUrdu?'پوسٹس تلاش کریں':'Search discoveries'} aria-label={isUrdu?'پوسٹس تلاش کریں':'Search community posts'}/></label></div>
    <div className="community-posts">{filtered.map(p=><TiltCard key={p.id} className="post-card"><div className={`post-art ${p.style}`} aria-hidden="true"><div className="art-orbit"/><p.icon/><span>{p.category==='Talks'?'THE BLACK HOLE':p.category==='Questions'?'A QUESTION WORTH ASKING':'SCIENCE FOR EVERYONE'}</span><b>{p.category==='Talks'?'15 / 10 / 2026':p.category==='Questions'?'02 GALAXIES':'01 SHARED MISSION'}</b></div><div className="post-content"><div className="post-meta"><span>{isUrdu?p.categoryUr:p.category}</span><button className={saved.includes(p.id)?'saved':''} aria-label={`${saved.includes(p.id)?'Unsave':'Save'} ${p.title}`} aria-pressed={saved.includes(p.id)} onClick={()=>toggleSaved(p.id)}>{saved.includes(p.id)?<Check size={18}/>:<Bookmark size={18}/>}</button></div><h3>{isUrdu?p.titleUr:p.title}</h3><p>{isUrdu?p.textUr:p.text}</p><VoiceReader text={isUrdu?p.textUr:p.text} isUrdu={isUrdu}/><div className="post-byline">{isUrdu?p.authorUr:p.author}</div><a href={`${groupUrl}/permalink/${p.id}/`} target="_blank" rel="noreferrer">{isUrdu?'اصل پوسٹ پڑھیں':'Read original post'}<ArrowUpRight size={17}/></a></div></TiltCard>)}</div>
    {filtered.length===0&&<p className="empty-feed" role="status">{isUrdu?'کوئی پوسٹ نہیں ملی۔ فلٹر بدلیں یا پوسٹ محفوظ کریں۔':'No posts here yet. Try another filter or save a discovery.'}</p>}
    <p className="source-note">{isUrdu?'گروپ کی اصل پوسٹس کے خلاصے · ۱۹ اکتوبر ۲۰۲۶ · تصویری خاکے اس ڈیمو کے لیے بنائے گئے ہیں':'Summaries of original group posts · 19 October 2026 · Illustrations created for this demo'}</p>
  </div>
}

export default function Community({ isUrdu }: { isUrdu: boolean }) {
  return <section id="community" className="community-section shell"><div className="community-heading"><div className="section-heading"><span>{isUrdu?'ہماری کمیونٹی سے':'ROOTED IN A REAL COMMUNITY'}</span><h2>{isUrdu?'تجسس مشترک ہے۔\nدریافت بھی ہو۔':'Curiosity is better\nwhen it’s shared.'}</h2></div><a className="community-link" href={groupUrl} target="_blank" rel="noreferrer">{isUrdu?'فیس بک گروپ دیکھیں':'Meet the community'}<ArrowUpRight size={18}/></a></div>
    <div className="community-intro"><div className="community-count"><Users/><strong dir="ltr">1.0M</strong><span>{isUrdu?'فیس بک پر دکھائے گئے ممبران':'members displayed on Facebook'}</span></div><div><h3>{isUrdu?'سیکھنے والوں کی اپنی دنیا':'A world built by people who love to learn.'}</h3><p>{isUrdu?'سائنس کی دنیا ایک عوامی علمی فورم ہے۔ گروپ کے تعارف کے مطابق، منتظمین بھی طالب علم ہیں: مقصد ایک دوستانہ ماحول میں ایک دوسرے سے سیکھنا اور علم بانٹنا ہے۔':'Science Ki Duniya is a public, knowledge-focused forum. Its introduction describes the admins as learners too: people bringing a curious community together to learn from one another in a friendly environment.'}</p></div><a href={`${groupUrl}/members/`} target="_blank" rel="noreferrer" className="team-link"><Users size={23}/><span>{isUrdu?'منتظمین اور ممبران':'Admins & members'}</span><ArrowUpRight size={18}/></a></div>
    <CommunityFeed isUrdu={isUrdu}/>
    <aside className="community-intro"><div><h3>{isUrdu?'عوامی تلاش سے ملی گروپ پوسٹ':'Group post found in public search'}</h3><p>{isUrdu?'کلاؤڈ برسٹ کیا ہے؟ — عوامی تلاش میں پوسٹ کا عنوان ملا ہے۔ مکمل متن، مصنف اور تبصرے دستیاب نہیں تھے۔':'What is a cloudburst? — The post title is visible in public search. Its full text, author and comments were not accessible.'}</p><a className="community-link" href={`${groupUrl}/posts/3212061398962374/`} target="_blank" rel="noreferrer">{isUrdu?'گروپ میں پوسٹ کھولیں':'Open group post'}<ArrowUpRight size={17}/></a></div></aside>
  </section>
}
