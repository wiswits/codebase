"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/ui/BottomSheet";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  Zap, Plus, Search, ClipboardList, Clock, Users, BarChart3,
  ArrowUpRight, MoreVertical, Copy, Trash2, ExternalLink, Loader2,
  CheckCircle2, AlertCircle, Eye, Calendar, Award
} from "lucide-react";

const STATUS_COLORS: Record<string,string> = {
  published: '#10b981',
  draft: '#f59e0b',
  closed: '#6b7280',
};
const DIFF_COLORS: Record<string,string> = {
  easy: '#10b981', medium: '#3b82f6', hard: '#f59e0b', extreme: '#ef4444',
};

function Skel({h=84}:{h?:number}) {
  return <div style={{height:h,borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',animation:'qp-shimmer 1.4s infinite'}}/>;
}

export default function AssessmentPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [mineOnly, setMineOnly] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (mineOnly) params.mine = 'true';
      const d = await qp.assessment.tests(params);
      setTests(d.tests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter, mineOnly]);

  useEffect(() => { load(); }, [load]);

  // Stats
  const counts = {
    total: tests.length,
    published: tests.filter(t => t.status === 'published').length,
    draft: tests.filter(t => t.status === 'draft').length,
    attempts: tests.reduce((s,t) => s + (t.attempt_count || 0), 0),
  };

  return (
    <>
      <TopBar/>
      <main style={{padding:'16px 16px 100px',maxWidth:760,margin:'0 auto'}}>

        <div className="qp-pill" style={{marginBottom:10}}>
          <ClipboardList size={11}/> Assessments
        </div>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',lineHeight:1.1}}>Tests</h1>
        <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'4px 0 16px',fontWeight:500}}>
          Build, schedule, and track tests
        </p>

        {/* Big CTA */}
        <Link href="/assessment/create" style={{textDecoration:'none',display:'block',marginBottom:14}}>
          <div className="qp-tap" style={{
            borderRadius:18,padding:'16px 18px',
            background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #ec4899 130%)',
            color:'#fff',boxShadow:'0 12px 28px -8px rgba(99,102,241,0.5)',
            display:'flex',alignItems:'center',gap:14,position:'relative',overflow:'hidden',
          }}>
            <div style={{position:'absolute',right:-15,bottom:-25,fontSize:64,opacity:0.15}}>⚡</div>
            <div style={{
              width:46,height:46,borderRadius:13,background:'rgba(255,255,255,0.22)',
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
            }}><Zap size={22} strokeWidth={2.2}/></div>
            <div style={{flex:1,minWidth:0,position:'relative'}}>
              <div style={{fontSize:15,fontWeight:800,letterSpacing:'-0.015em'}}>Create Test in Seconds</div>
              <div style={{fontSize:11.5,opacity:0.9,marginTop:2,fontWeight:500}}>Pick subject → done</div>
            </div>
            <ArrowUpRight size={18} style={{position:'relative'}}/>
          </div>
        </Link>

        {/* 4-stat strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
          {[
            { label:'Total',     v: counts.total,     color:'var(--text-primary)' },
            { label:'Live',      v: counts.published, color:'#10b981' },
            { label:'Draft',     v: counts.draft,     color:'#f59e0b' },
            { label:'Attempts',  v: counts.attempts,  color:'#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="qp-card" style={{padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:800,color:s.color,letterSpacing:'-0.02em',lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + filter row */}
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <div style={{flex:1,position:'relative'}}>
            <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(searchInput.trim())}
              onBlur={() => setSearch(searchInput.trim())}
              placeholder="Search tests..."
              style={{width:'100%',padding:'10px 12px 10px 34px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11,color:'var(--text-primary)',fontSize:13,outline:'none'}}
            />
          </div>
          <button type="button" onClick={() => setMineOnly(m => !m)} style={{
            padding:'0 12px',borderRadius:11,
            background: mineOnly ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-card)',
            border: mineOnly ? 'none' : '1px solid var(--border)',
            color: mineOnly ? '#fff' : 'var(--text-secondary)',
            fontSize:12,fontWeight:700,cursor:'pointer',
          }}>Mine</button>
        </div>

        {/* Status pills */}
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {[
            { v:'',          label:'All' },
            { v:'published', label:'Live' },
            { v:'draft',     label:'Draft' },
            { v:'closed',    label:'Closed' },
          ].map(s => (
            <button key={s.v} type="button" onClick={() => setStatusFilter(s.v)} style={{
              padding:'5px 11px',borderRadius:99,
              background: statusFilter === s.v ? 'var(--brand)' : 'var(--bg-muted)',
              color: statusFilter === s.v ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              fontSize:11.5,fontWeight:700,cursor:'pointer',
            }}>{s.label}</button>
          ))}
        </div>

        {/* Test list */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {loading ? [1,2,3].map(i => <Skel key={i}/>) : tests.length === 0 ? (
            <div className="qp-card" style={{padding:'40px 20px',textAlign:'center'}}>
              <div style={{fontSize:42,marginBottom:8,opacity:0.5}}>📋</div>
              <div style={{fontSize:14,fontWeight:700}}>No tests yet</div>
              <div style={{fontSize:11.5,color:'var(--text-muted)',marginTop:4}}>
                {search || statusFilter || mineOnly ? 'Try clearing filters' : 'Create your first test above'}
              </div>
            </div>
          ) : tests.map(t => (
            <button key={t.id} type="button" onClick={() => setSelected(t)} className="qp-tap" style={{
              all:'unset',cursor:'pointer',display:'block',
              background:'var(--bg-card)',border:'1px solid var(--border)',
              borderRadius:14,padding:'14px',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                <span style={{
                  fontSize:9.5,fontWeight:800,padding:'3px 7px',borderRadius:5,
                  background:`${STATUS_COLORS[t.status]}22`,color:STATUS_COLORS[t.status],
                  letterSpacing:'0.04em',textTransform:'uppercase',
                }}>{t.status}</span>
                {t.subject_name && (
                  <span style={{fontSize:9.5,fontWeight:700,padding:'3px 7px',borderRadius:5,background:'var(--bg-muted)',color:'var(--text-secondary)'}}>
                    {t.subject_name}
                  </span>
                )}
                <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>
                  {new Date(t.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                </span>
              </div>

              <div style={{fontSize:14.5,fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.01em',lineHeight:1.3,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>

              <div style={{display:'flex',alignItems:'center',gap:14,marginTop:8,fontSize:11,color:'var(--text-muted)',fontWeight:500,flexWrap:'wrap'}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                  <ClipboardList size={11}/> {t.question_count}
                </span>
                <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                  <Award size={11}/> {Number(t.total_marks || 0)}M
                </span>
                {t.duration_minutes ? (
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                    <Clock size={11}/> {t.duration_minutes}m
                  </span>
                ) : null}
                <span style={{display:'inline-flex',alignItems:'center',gap:4,color: t.attempt_count > 0 ? '#8b5cf6' : 'var(--text-muted)'}}>
                  <Users size={11}/> {t.attempt_count}
                </span>
                {t.avg_score != null && (
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,color:'#10b981',fontWeight:700}}>
                    <BarChart3 size={11}/> {t.avg_score}%
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* FAB */}
      <Link href="/assessment/create" style={{
        position:'fixed',right:18,bottom:90,zIndex:50,
        width:56,height:56,borderRadius:18,
        background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color:'#fff',textDecoration:'none',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 10px 24px -6px rgba(99,102,241,0.6)',
      }} aria-label="Create test">
        <Plus size={26} strokeWidth={2.4}/>
      </Link>

      {/* Detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Test Details">
        {selected && <TestDetail testId={selected.id} onAction={() => { setSelected(null); load(); }}/>}
      </BottomSheet>

      <BottomNav/>
      <style>{`@keyframes qp-shimmer { 0%,100% {opacity:1} 50% {opacity:0.5} }`}</style>
    </>
  );
}

function TestDetail({testId, onAction}:{testId:number; onAction:()=>void}) {
  const [data, setData] = useState<any>(null);
  const [working, setWorking] = useState<string|null>(null);

  useEffect(() => {
    qp.assessment.test(testId).then(setData).catch(() => {});
  }, [testId]);

  if (!data) return <div style={{padding:30,textAlign:'center',color:'var(--text-muted)'}}><Loader2 size={20} className="qp-spin"/></div>;
  const { test, stats, recent_attempts, questions } = data;

  const canDelete = test.created_by === qp.auth.user()?.id || qp.auth.user()?.role_slug === 'super_admin';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/test/${test.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => alert(url));
  };

  const handleDuplicate = async () => {
    setWorking('duplicate');
    try {
      const r = await qp.assessment.duplicate(test.id);
      alert('Duplicated! New test id: ' + r.id);
      onAction();
    } catch (e:any) {
      alert(e?.response?.data?.message || 'Failed');
    } finally { setWorking(null); }
  };

  const handleDelete = async () => {
    if (!confirm('Close this test? Students will no longer see it.')) return;
    setWorking('delete');
    try {
      await qp.assessment.deleteTest(test.id);
      onAction();
    } catch (e:any) {
      alert(e?.response?.data?.message || 'Failed');
    } finally { setWorking(null); }
  };

  return (
    <>
      {/* Hero */}
      <div style={{
        borderRadius:16,padding:'16px 18px',marginBottom:14,
        background:'linear-gradient(135deg, #6366f1, #8b5cf6)',color:'#fff',
        boxShadow:'0 10px 24px -6px rgba(99,102,241,0.45)',
      }}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',opacity:0.85,marginBottom:4}}>
          {test.status}
        </div>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.02em',lineHeight:1.2}}>{test.title}</div>
        {test.description && <div style={{fontSize:11.5,opacity:0.9,marginTop:5,fontWeight:500}}>{test.description}</div>}
        <div style={{display:'flex',gap:14,marginTop:10,fontSize:11,opacity:0.95,fontWeight:600}}>
          <span>{stats.total_questions} Q</span>
          <span>{Number(test.total_marks || 0)} marks</span>
          {test.duration_minutes ? <span>{test.duration_minutes} min</span> : null}
        </div>
      </div>

      {/* Difficulty breakdown */}
      {Object.keys(stats.by_difficulty || {}).length > 0 && (
        <>
          <SectionLabel>Question mix</SectionLabel>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
            {Object.entries(stats.by_difficulty).map(([d, n]:any) => (
              <span key={d} style={{
                fontSize:11,fontWeight:700,padding:'4px 9px',borderRadius:6,
                background:`${DIFF_COLORS[d] || '#6366f1'}1a`,color:DIFF_COLORS[d] || '#6366f1',
                textTransform:'capitalize',letterSpacing:'0.04em',
              }}>{n} {d}</span>
            ))}
          </div>
        </>
      )}

      {/* Recent attempts */}
      {recent_attempts.length > 0 && (
        <>
          <SectionLabel right={<span>{test.attempt_count || recent_attempts.length} total</span>}>Recent attempts</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
            {recent_attempts.map((a:any) => (
              <div key={a.id} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10,
              }}>
                <div style={{
                  width:30,height:30,borderRadius:9,flexShrink:0,
                  background:'linear-gradient(135deg, #6366f1, #8b5cf6)',color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:11,fontWeight:800,
                }}>{(a.first_name?.[0] || '?').toUpperCase()}</div>
                <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>
                  {a.first_name} {a.last_name || ''}
                  <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1,fontWeight:500}}>
                    {a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'in progress'}
                  </div>
                </div>
                {a.percentage != null && (
                  <div style={{
                    fontSize:13,fontWeight:800,padding:'3px 8px',borderRadius:6,
                    background: a.percentage >= 60 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.percentage >= 60 ? '#10b981' : '#ef4444',
                  }}>{Number(a.percentage)}%</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Question list (compact) */}
      <SectionLabel>Questions</SectionLabel>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:18,maxHeight:200,overflowY:'auto',paddingRight:4}}>
        {questions.map((q:any, i:number) => (
          <div key={q.id} style={{padding:'10px 12px',background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:DIFF_COLORS[q.difficulty] || '#6366f1',textTransform:'uppercase'}}>{q.difficulty}</span>
              <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>Q{i+1} · {q.marks_positive}M</span>
            </div>
            <div style={{fontSize:12.5,color:'var(--text-primary)',lineHeight:1.4,
              display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
              <MathText text={q.question_text}/>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
        <ActionBtn icon={ExternalLink} label="Copy share link" onClick={handleCopyLink}/>
        <ActionBtn icon={Copy} label="Duplicate" onClick={handleDuplicate} loading={working === 'duplicate'}/>
        {canDelete && (
          <ActionBtn icon={Trash2} label="Close test" onClick={handleDelete} loading={working === 'delete'} danger/>
        )}
        <ActionBtn icon={Eye} label="Preview as student" onClick={() => window.location.href = `/attempt/${test.id}`}/>
      </div>
      <style>{`@keyframes qp-spin { to { transform: rotate(360deg); } } .qp-spin { animation: qp-spin 0.7s linear infinite; }`}</style>
    </>
  );
}

function SectionLabel({children, right}:{children:React.ReactNode; right?:React.ReactNode}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      fontSize:10.5,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',
      textTransform:'uppercase',marginBottom:7,marginTop:4}}>
      <span>{children}</span>
      {right && <span style={{fontSize:10,fontWeight:700,textTransform:'none',letterSpacing:'normal'}}>{right}</span>}
    </div>
  );
}

function ActionBtn({icon:Icon, label, onClick, loading, danger}:any) {
  return (
    <button type="button" onClick={onClick} disabled={loading} style={{
      padding:'12px 10px',borderRadius:11,
      background: danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-muted)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
      color: danger ? '#ef4444' : 'var(--text-primary)',
      fontSize:12,fontWeight:700,cursor:'pointer',
      display:'flex',alignItems:'center',justifyContent:'center',gap:6,
      opacity: loading ? 0.6 : 1,
    }}>
      {loading ? <Loader2 size={14} className="qp-spin"/> : <Icon size={14}/>}
      {label}
    </button>
  );
}
