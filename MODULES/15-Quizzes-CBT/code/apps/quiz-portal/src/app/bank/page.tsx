"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/ui/BottomSheet";
import AddQuestionSheet from "@/components/AddQuestionSheet";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  Search, SlidersHorizontal, Plus, Library, BookOpen, Tag, Heart, Bookmark, Trash2, Bot,
  CheckCircle2, XCircle, AlertCircle, Sparkles, ChevronDown, X, User
} from "lucide-react";

const DIFF_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#3b82f6',
  hard: '#f59e0b',
  extreme: '#ef4444',
};

const TYPE_LABELS: Record<string, string> = {
  mcq_single: 'MCQ',
  mcq_multi: 'Multi-MCQ',
  integer: 'Integer',
  assertion_reason: 'Assertion-Reason',
  match_column: 'Match',
  subjective: 'Subjective',
};

function Skel({h=84}:{h?:number}) {
  return <div style={{height:h,borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',animation:'qp-shimmer 1.4s infinite'}}/>;
}

export default function BankPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load filter options once
  useEffect(() => {
    qp.bank.filters().then(setFilters).catch(() => setFilters({}));
  }, []);

  // Reset & reload when filters/search change
  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true);
  }, [search, JSON.stringify(activeFilters)]);

  // Fetch page
  const fetchPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params: any = { page, limit: 20, ...activeFilters };
      if (search) params.search = search;
      const res = await qp.bank.list(params);
      const newItems = res.data || res.items || [];
      const meta = res.meta || res.pagination || res;
      const totalPages = meta.pages || Math.ceil((meta.total || 0) / (meta.limit || 20));
      setItems(prev => page === 1 ? newItems : [...prev, ...newItems]);
      if (page >= totalPages || newItems.length === 0) setHasMore(false);
    } catch (e) {
      console.error('fetch:', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, search, JSON.stringify(activeFilters), hasMore, loading]);

  useEffect(() => { fetchPage(); }, [page, search, JSON.stringify(activeFilters)]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(es => {
      if (es[0].isIntersecting && !loading) setPage(p => p + 1);
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  const handleSearch = () => setSearch(searchInput.trim());

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <>
      <TopBar/>
      <main style={{padding:'16px 16px 100px',maxWidth:720,margin:'0 auto'}}>

        <div className="qp-pill" style={{marginBottom:10}}>
          <Library size={11}/> Question Bank
        </div>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',lineHeight:1.1}}>
          Bank
        </h1>
        <div style={{position:'absolute',right:16,top:60}}>
          <a href="/bank/import" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5,padding:'7px 11px',background:'linear-gradient(135deg, #6366f1, #8b5cf6)',color:'#fff',borderRadius:10,fontSize:11.5,fontWeight:700,boxShadow:'0 6px 14px -4px rgba(99,102,241,0.5)'}}><Bot size={12}/> AI Import</a>
        </div>
        <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'4px 0 14px',fontWeight:500}}>
          Browse, filter, and manage your questions
        </p>

        {/* Search + Filter row */}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <div style={{flex:1,position:'relative'}}>
            <Search size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onBlur={handleSearch}
              placeholder="Search questions..."
              style={{
                width:'100%',padding:'11px 12px 11px 36px',
                background:'var(--bg-card)',border:'1px solid var(--border)',
                borderRadius:12,color:'var(--text-primary)',
                fontSize:13.5,fontWeight:500,outline:'none',
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            style={{
              padding:'0 14px',borderRadius:12,
              background: activeFilterCount > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-card)',
              border: activeFilterCount > 0 ? 'none' : '1px solid var(--border)',
              color: activeFilterCount > 0 ? '#fff' : 'var(--text-primary)',
              cursor:'pointer',display:'flex',alignItems:'center',gap:6,
              fontSize:13,fontWeight:700,
              boxShadow: activeFilterCount > 0 ? '0 6px 14px -4px rgba(99,102,241,0.5)' : 'none',
            }}
          >
            <SlidersHorizontal size={14}/>
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {Object.entries(activeFilters).map(([k, v]) => v ? (
              <button
                key={k}
                type="button"
                onClick={() => setActiveFilters((af:any) => ({ ...af, [k]: undefined }))}
                style={{
                  display:'inline-flex',alignItems:'center',gap:5,
                  padding:'4px 10px',borderRadius:99,
                  background:'rgba(99,102,241,0.15)',color:'var(--brand)',
                  border:'1px solid rgba(99,102,241,0.3)',
                  fontSize:11,fontWeight:600,cursor:'pointer',
                }}
              >
                {labelFor(k, v as string, filters)}
                <X size={11}/>
              </button>
            ) : null)}
            <button
              type="button"
              onClick={() => setActiveFilters({})}
              style={{padding:'4px 10px',background:'transparent',border:'none',color:'var(--text-muted)',fontSize:11,fontWeight:600,cursor:'pointer'}}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Question list */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(q => {
            const dColor = DIFF_COLORS[q.difficulty] || '#6366f1';
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelected(q)}
                className="qp-tap"
                style={{
                  all:'unset',cursor:'pointer',display:'block',
                  background:'var(--bg-card)',border:'1px solid var(--border)',
                  borderRadius:14,padding:'14px 14px 12px',
                }}
              >
                {/* Top row: badges */}
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                  <span style={{
                    fontSize:9.5,fontWeight:800,padding:'3px 7px',borderRadius:5,
                    background:`${dColor}22`,color:dColor,letterSpacing:'0.04em',textTransform:'uppercase',
                  }}>{q.difficulty || 'medium'}</span>
                  <span style={{
                    fontSize:9.5,fontWeight:700,padding:'3px 7px',borderRadius:5,
                    background:'var(--bg-muted)',color:'var(--text-secondary)',letterSpacing:'0.04em',
                  }}>{TYPE_LABELS[q.question_type] || q.question_type}</span>
                  {q.exam_tag && (
                    <span style={{
                      fontSize:9.5,fontWeight:700,padding:'3px 7px',borderRadius:5,
                      background:'rgba(139,92,246,0.15)',color:'#a78bfa',letterSpacing:'0.04em',
                    }}>{q.exam_tag}</span>
                  )}
                  {q.subject_name && (
                    <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>· {q.subject_name}</span>
                  )}
                </div>

                {/* Question text (with KaTeX) */}
                <div style={{fontSize:13.5,color:'var(--text-primary)',lineHeight:1.45,letterSpacing:'-0.005em',
                  display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                  <MathText text={q.question_text}/>
                </div>

                {/* Bottom: meta */}
                <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,fontSize:10.5,color:'var(--text-muted)',fontWeight:500}}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:3}}>
                    <Tag size={9}/> #{q.id}
                  </span>
                  <span>· Used {q.times_used || 0}x</span>
                  {q.times_used > 0 && (
                    <span style={{color:'#10b981'}}>· {Math.round(((q.times_correct || 0) / q.times_used) * 100)}% correct</span>
                  )}
                </div>
              </button>
            );
          })}

          {loading && [1,2,3].map(i => <Skel key={`s${i}`}/>)}

          {!loading && items.length === 0 && (
            <div style={{padding:'40px 20px',textAlign:'center',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14}}>
              <div style={{fontSize:42,marginBottom:8,opacity:0.5}}>📚</div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>No questions found</div>
              <div style={{fontSize:11.5,color:'var(--text-muted)',marginTop:4}}>
                {activeFilterCount > 0 || search ? 'Try adjusting filters' : 'Add your first question to get started'}
              </div>
            </div>
          )}

          <div ref={sentinelRef} style={{height:1}}/>
        </div>

      </main>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        style={{
          position:'fixed',right:18,bottom:90,zIndex:50,
          width:56,height:56,borderRadius:18,
          background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border:'none',color:'#fff',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 10px 24px -6px rgba(99,102,241,0.6)',
        }}
        aria-label="Add question"
      >
        <Plus size={26} strokeWidth={2.4}/>
      </button>

      {/* Filters sheet */}
      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        {!filters ? (
          <div style={{padding:'40px 0',textAlign:'center',color:'var(--text-muted)'}}>Loading…</div>
        ) : (
          <>
            <FilterSection
              label="Difficulty"
              options={['easy','medium','hard','extreme'].map(v => ({value:v,label:v}))}
              value={activeFilters.difficulty}
              onChange={v => setActiveFilters((af:any) => ({...af, difficulty: v}))}
              colorMap={DIFF_COLORS}
            />
            <FilterSection
              label="Question Type"
              options={(filters.question_types || []).map((v:string) => ({value:v,label:TYPE_LABELS[v] || v}))}
              value={activeFilters.question_type}
              onChange={v => setActiveFilters((af:any) => ({...af, question_type: v}))}
            />
            {filters.exam_tags?.length > 0 && (
              <FilterSection
                label="Exam Tag"
                options={filters.exam_tags.map((v:string) => ({value:v,label:v}))}
                value={activeFilters.exam_tag}
                onChange={v => setActiveFilters((af:any) => ({...af, exam_tag: v}))}
              />
            )}
            {filters.classes?.length > 0 && (
              <FilterSection
                label="Class"
                options={filters.classes.map((v:string) => ({value:v,label:v}))}
                value={activeFilters.target_class}
                onChange={v => setActiveFilters((af:any) => ({...af, target_class: v}))}
              />
            )}
            {filters.subjects?.length > 0 && (
              <FilterSection
                label="Subject"
                options={filters.subjects.map((s:any) => ({value:s.id,label:s.name}))}
                value={activeFilters.subject_id}
                onChange={v => setActiveFilters((af:any) => ({...af, subject_id: v}))}
              />
            )}

            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              style={{
                width:'100%',marginTop:18,padding:'14px',
                background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color:'#fff',border:'none',borderRadius:14,
                fontSize:14,fontWeight:700,cursor:'pointer',
                boxShadow:'0 8px 20px -6px rgba(99,102,241,0.5)',
              }}
            >
              Apply
            </button>
          </>
        )}
      </BottomSheet>

      {/* Question detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Question">
        {selected && (
          <QuestionDetail q={selected} onDeleted={() => { setSelected(null); setItems([]); setPage(1); setHasMore(true); }}/>
        )}
      </BottomSheet>

      <AddQuestionSheet open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setItems([]); setPage(1); setHasMore(true); }}/>
      <BottomNav/>

      <style>{`@keyframes qp-shimmer { 0%,100% {opacity:1} 50% {opacity:0.5} }`}</style>
    </>
  );
}

function FilterSection({label, options, value, onChange, colorMap}:{label:string;options:{value:any;label:string}[];value:any;onChange:(v:any)=>void;colorMap?:Record<string,string>}) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>{label}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {options.map(o => {
          const active = value === o.value;
          const col = colorMap?.[o.value] || '#6366f1';
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(active ? undefined : o.value)}
              style={{
                padding:'7px 12px',borderRadius:99,
                background: active ? col : 'var(--bg-muted)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border)',
                fontSize:12,fontWeight:600,cursor:'pointer',
                textTransform: colorMap ? 'capitalize' : 'none',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionDetail({q, onChanged, onDeleted}:{q:any; onChanged?:()=>void; onDeleted?:()=>void}) {
  const [liked, setLiked] = useState(!!q.i_liked);
  const [bookmarked, setBookmarked] = useState(!!q.i_bookmarked);
  const [likes, setLikes] = useState(q.likes_count || 0);
  const dColor = DIFF_COLORS[q.difficulty] || '#6366f1';
  const options = q.options || [];
  const correctLetter = (q.correct_answer || '').toUpperCase();

  const toggleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((l:number) => l + (wasLiked ? -1 : 1));
    try { await qp.bank.like(q.id); } catch { setLiked(wasLiked); setLikes((l:number) => l + (wasLiked ? 1 : -1)); }
  };
  const toggleBookmark = async () => {
    const was = bookmarked;
    setBookmarked(!was);
    try { await qp.bank.bookmark(q.id); } catch { setBookmarked(was); }
  };
  const handleDelete = async () => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try { await qp.bank.delete(q.id); onDeleted?.(); } catch (e:any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:14}}>
        <span style={{fontSize:10,fontWeight:800,padding:'4px 8px',borderRadius:6,background:`${dColor}22`,color:dColor,letterSpacing:'0.04em',textTransform:'uppercase'}}>{q.difficulty}</span>
        <span style={{fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:6,background:'var(--bg-muted)',color:'var(--text-secondary)'}}>{TYPE_LABELS[q.question_type] || q.question_type}</span>
        {q.exam_tag && <span style={{fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:6,background:'rgba(139,92,246,0.15)',color:'#a78bfa'}}>{q.exam_tag}</span>}
        {q.target_class && <span style={{fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:6,background:'rgba(59,130,246,0.15)',color:'#60a5fa'}}>{q.target_class}</span>}
        {q.is_private ? <span style={{fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:6,background:'rgba(239,68,68,0.15)',color:'#f87171'}}>PRIVATE</span> : null}
      </div>

      {/* Creator */}
      {(q.creator_first_name || q.creator_org_name) && (
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'8px 10px',background:'var(--bg-muted)',borderRadius:10,border:'1px solid var(--border)'}}>
          <div style={{width:26,height:26,borderRadius:8,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>
            {(q.creator_first_name?.[0] || '?').toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0,fontSize:11.5,color:'var(--text-secondary)'}}>
            <span style={{fontWeight:700,color:'var(--text-primary)'}}>{q.creator_first_name} {q.creator_last_name || ''}</span>
            {q.creator_org_name && <span style={{color:'var(--text-muted)'}}> · {q.creator_org_name}</span>}
          </div>
        </div>
      )}

      <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.55,marginBottom:18,fontWeight:500}}>
        <MathText text={q.question_text}/>
      </div>

      {Array.isArray(options) && options.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
          {options.map((opt:string, i:number) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = letter === correctLetter || (q.correct_answer || '').includes(letter);
            return (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',borderRadius:12,
                background: isCorrect ? 'rgba(16,185,129,0.08)' : 'var(--bg-muted)',
                border: isCorrect ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)'}}>
                <div style={{width:26,height:26,borderRadius:8,flexShrink:0,
                  background: isCorrect ? '#10b981' : 'var(--bg-elevated)',
                  color: isCorrect ? '#fff' : 'var(--text-secondary)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{letter}</div>
                <div style={{flex:1,fontSize:13.5,color:'var(--text-primary)',lineHeight:1.45,paddingTop:3}}>
                  <MathText text={opt}/>
                </div>
                {isCorrect && <CheckCircle2 size={16} style={{color:'#10b981',flexShrink:0,marginTop:5}}/>}
              </div>
            );
          })}
        </div>
      )}

      {q.solution && (
        <div style={{padding:'14px 16px',borderRadius:14,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.25)',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--brand)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
            <Sparkles size={11}/> Solution
          </div>
          <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.5}}>
            <MathText text={q.solution}/>
          </div>
        </div>
      )}

      {/* Action bar: like + bookmark + delete */}
      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:8}}>
        <button type="button" onClick={toggleLike} style={{
          flex:1,padding:'10px 12px',borderRadius:12,
          background: liked ? 'rgba(236,72,153,0.15)' : 'var(--bg-muted)',
          border: liked ? '1px solid rgba(236,72,153,0.4)' : '1px solid var(--border)',
          color: liked ? '#ec4899' : 'var(--text-secondary)',
          fontSize:13,fontWeight:700,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        }}>
          <Heart size={15} fill={liked ? '#ec4899' : 'none'}/> {likes}
        </button>
        <button type="button" onClick={toggleBookmark} style={{
          flex:1,padding:'10px 12px',borderRadius:12,
          background: bookmarked ? 'rgba(245,158,11,0.15)' : 'var(--bg-muted)',
          border: bookmarked ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
          color: bookmarked ? '#f59e0b' : 'var(--text-secondary)',
          fontSize:13,fontWeight:700,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        }}>
          <Bookmark size={15} fill={bookmarked ? '#f59e0b' : 'none'}/> {bookmarked ? 'Saved' : 'Save'}
        </button>
        {q.can_delete && (
          <button type="button" onClick={handleDelete} style={{
            padding:'10px 12px',borderRadius:12,
            background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
            color:'#ef4444',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <Trash2 size={15}/>
          </button>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:8}}>
        {[
          {label:'Used',  v: q.times_used    || 0, color:'#3b82f6'},
          {label:'Correct',v: q.times_correct || 0, color:'#10b981'},
          {label:'Wrong', v: q.times_wrong   || 0, color:'#ef4444'},
        ].map(s => (
          <div key={s.label} style={{padding:'10px 8px',borderRadius:10,background:'var(--bg-muted)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:800,color:s.color,letterSpacing:'-0.02em',lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase'}}>{s.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
function labelFor(key: string, value: string, filters: any): string {
  if (key === 'subject_id' && filters?.subjects) {
    const s = filters.subjects.find((x:any) => String(x.id) === String(value));
    return s ? s.name : value;
  }
  if (key === 'question_type') return TYPE_LABELS[value] || value;
  return String(value);
}
