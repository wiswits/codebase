"use client";
import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  Clock, Flag, ChevronLeft, ChevronRight, Grid3x3, X, CheckCircle2,
  AlertCircle, Loader2, Sparkles, Send
} from "lucide-react";

const DIFF_COLORS: Record<string,string> = {
  easy: '#10b981', medium: '#3b82f6', hard: '#f59e0b', extreme: '#ef4444',
};

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

export default function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testIdStr } = use(params);
  const testId = Number(testIdStr);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [test, setTest] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [secLeft, setSecLeft] = useState<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const lastQuestionTimeRef = useRef<number>(Date.now());

  // Init
  useEffect(() => {
    qp.attempts.init(testId).then(d => {
      setTest(d.test);
      setConfig(d.config || {});
      setQuestions(d.questions || []);
      setAttemptId(d.attempt.id);
      // Compute remaining time
      if (d.test?.duration_minutes && d.attempt?.started_at) {
        const startedMs = new Date(d.attempt.started_at).getTime();
        const totalSec = d.test.duration_minutes * 60;
        const elapsed = Math.floor((Date.now() - startedMs) / 1000);
        setSecLeft(Math.max(0, totalSec - elapsed));
      }
      setLoading(false);
    }).catch(e => {
      setError(e?.response?.data?.message || 'Failed to load test');
      setLoading(false);
    });
  }, [testId]);

  // Timer
  useEffect(() => {
    if (secLeft == null || result) return;
    if (secLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setSecLeft(s => (s != null ? s - 1 : null)), 1000);
    return () => clearInterval(t);
  }, [secLeft, result]);

  // Hide bottom nav when in attempt
  useEffect(() => {
    document.body.style.background = 'var(--bg-base)';
    return () => {};
  }, []);

  const q = questions[current];

  const saveAnswer = async (qid: number, value: string) => {
    setAnswers(a => ({ ...a, [qid]: value }));
    if (!attemptId) return;
    const timeSpent = Math.floor((Date.now() - lastQuestionTimeRef.current) / 1000);
    try {
      await qp.attempts.answer(attemptId, { question_id: qid, answer: value, time_spent_seconds: timeSpent });
    } catch {}
  };

  const toggleFlag = async (qid: number) => {
    setFlagged(f => {
      const s = new Set(f);
      if (s.has(qid)) s.delete(qid); else s.add(qid);
      return s;
    });
    if (!attemptId) return;
    try { await qp.attempts.flag(attemptId, qid); } catch {}
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    lastQuestionTimeRef.current = Date.now();
    setCurrent(idx);
    setNavOpen(false);
  };

  const handleSubmit = async (auto = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const r = await qp.attempts.submit(attemptId, { auto_submitted: auto });
      setResult(r);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  };

  // Counts
  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)]?.trim()).length;
  const flaggedCount = flagged.size;
  const skippedCount = questions.length - answeredCount;

  if (loading) {
    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Loader2 size={26} className="qp-spin" style={{color:'var(--brand)'}}/>
    </div>;
  }

  if (error) {
    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{textAlign:'center',maxWidth:360}}>
        <div style={{width:60,height:60,borderRadius:18,margin:'0 auto 14px',background:'rgba(239,68,68,0.15)',color:'#ef4444',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <AlertCircle size={28}/>
        </div>
        <h1 style={{fontSize:20,fontWeight:800,margin:'0 0 6px'}}>Cannot start test</h1>
        <p style={{fontSize:13,color:'var(--text-muted)',margin:'0 0 18px'}}>{error}</p>
        <button type="button" onClick={() => router.push('/assessment')} style={primaryBtn}>Back to tests</button>
      </div>
    </div>;
  }

  // RESULT VIEW
  if (result) {
    return <ResultView result={result} test={test} attemptId={attemptId!} onClose={() => router.push('/assessment')}/>;
  }

  // ATTEMPT VIEW
  return (
    <>
      {/* Header — sticky timer */}
      <header style={{
        position:'sticky',top:0,zIndex:50,
        background:'rgba(7,11,20,0.95)',
        backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--border)',
        padding:'10px 14px',
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,
      }}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{test?.title}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1,fontWeight:500}}>
            Q {current + 1} of {questions.length} · {answeredCount} answered
          </div>
        </div>
        {secLeft != null && (
          <div style={{
            display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:10,
            background: secLeft < 300 ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)',
            border: `1px solid ${secLeft < 300 ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
            color: secLeft < 300 ? '#ef4444' : 'var(--text-primary)',
            fontSize:13,fontWeight:800,fontVariantNumeric:'tabular-nums',
            animation: secLeft < 60 ? 'qp-pulse 1s infinite' : 'none',
          }}>
            <Clock size={13}/>
            {fmtTime(secLeft)}
          </div>
        )}
        <button type="button" onClick={() => setNavOpen(true)} style={iconBtn}>
          <Grid3x3 size={17}/>
        </button>
      </header>

      {/* Question card */}
      <main style={{padding:'18px 16px 110px',maxWidth:760,margin:'0 auto'}}>
        {q && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,flexWrap:'wrap'}}>
              <span style={{fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:5,background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)',letterSpacing:'0.04em'}}>
                Q{current + 1}
              </span>
              <span style={{
                fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:5,
                background:`${DIFF_COLORS[q.difficulty] || '#6366f1'}1a`,color:DIFF_COLORS[q.difficulty] || '#6366f1',
                letterSpacing:'0.04em',textTransform:'uppercase',
              }}>{q.difficulty || 'medium'}</span>
              <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,marginLeft:'auto'}}>
                +{Number(q.marks_positive)} {Number(q.marks_negative) > 0 ? `· −${Number(q.marks_negative)}` : ''}
              </span>
              <button type="button" onClick={() => toggleFlag(q.id)} style={{
                padding:'5px 9px',borderRadius:8,
                background: flagged.has(q.id) ? 'rgba(245,158,11,0.18)' : 'var(--bg-card)',
                border: `1px solid ${flagged.has(q.id) ? 'rgba(245,158,11,0.45)' : 'var(--border)'}`,
                color: flagged.has(q.id) ? '#f59e0b' : 'var(--text-muted)',
                cursor:'pointer',fontSize:10.5,fontWeight:700,
                display:'inline-flex',alignItems:'center',gap:4,
              }}>
                <Flag size={11} fill={flagged.has(q.id) ? '#f59e0b' : 'none'}/>
                {flagged.has(q.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question text */}
            <div style={{
              padding:'18px 18px',borderRadius:16,
              background:'var(--bg-card)',border:'1px solid var(--border)',
              marginBottom:14,
            }}>
              <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.55,fontWeight:500}}>
                <MathText text={q.question_text}/>
              </div>
              {q.image_url && (
                <img src={q.image_url} alt="" style={{maxWidth:'100%',marginTop:12,borderRadius:10}}/>
              )}
            </div>

            {/* Answer area */}
            {(q.question_type === 'mcq_single' || q.question_type === 'assertion_reason') && Array.isArray(q.options) && (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {q.options.map((opt: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  const selected = answers[q.id] === letter;
                  return (
                    <button key={i} type="button" onClick={() => saveAnswer(q.id, letter)} style={{
                      all:'unset',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12,
                      padding:'14px 16px',borderRadius:14,
                      background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                      border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                      transition:'all 0.15s',
                    }}>
                      <div style={{
                        width:30,height:30,borderRadius:10,flexShrink:0,
                        background: selected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-elevated)',
                        color: selected ? '#fff' : 'var(--text-secondary)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:12,fontWeight:800,
                      }}>{letter}</div>
                      <div style={{flex:1,minWidth:0,fontSize:14,color:'var(--text-primary)',lineHeight:1.45,paddingTop:5}}>
                        <MathText text={opt}/>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {q.question_type === 'mcq_multi' && Array.isArray(q.options) && (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {q.options.map((opt: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  const current = (answers[q.id] || '').split(',').filter(Boolean);
                  const selected = current.includes(letter);
                  return (
                    <button key={i} type="button" onClick={() => {
                      const next = selected ? current.filter(l => l !== letter) : [...current, letter];
                      saveAnswer(q.id, next.sort().join(','));
                    }} style={{
                      all:'unset',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12,
                      padding:'14px 16px',borderRadius:14,
                      background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                      border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                    }}>
                      <div style={{
                        width:24,height:24,borderRadius:6,flexShrink:0,
                        background: selected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-elevated)',
                        border: selected ? 'none' : '1px solid var(--border-strong)',
                        display:'flex',alignItems:'center',justifyContent:'center',marginTop:3,
                      }}>{selected && <CheckCircle2 size={14} color="#fff"/>}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',marginBottom:3}}>{letter}</div>
                        <div style={{fontSize:14,color:'var(--text-primary)',lineHeight:1.45}}>
                          <MathText text={opt}/>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div style={{fontSize:10.5,color:'var(--text-muted)',padding:'2px 6px'}}>
                  Multiple correct allowed
                </div>
              </div>
            )}

            {q.question_type === 'integer' && (
              <input
                type="text"
                inputMode="numeric"
                value={answers[q.id] || ''}
                onChange={e => saveAnswer(q.id, e.target.value)}
                placeholder="Enter your numeric answer"
                style={{
                  width:'100%',padding:'16px 18px',
                  background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,
                  color:'var(--text-primary)',fontSize:18,fontWeight:700,outline:'none',
                  marginBottom:14,fontFamily:'inherit',textAlign:'center',
                  letterSpacing:'0.05em',
                }}
              />
            )}

            {q.question_type === 'subjective' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={e => saveAnswer(q.id, e.target.value)}
                placeholder="Write your answer here..."
                rows={6}
                style={{
                  width:'100%',padding:'14px 16px',
                  background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,
                  color:'var(--text-primary)',fontSize:14,outline:'none',
                  marginBottom:14,fontFamily:'inherit',resize:'vertical',
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer nav */}
      <footer style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:40,
        background:'rgba(7,11,20,0.95)',backdropFilter:'blur(16px)',
        borderTop:'1px solid var(--border)',
        padding:'10px 14px calc(10px + env(safe-area-inset-bottom))',
        display:'flex',alignItems:'center',gap:8,
      }}>
        <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} style={{
          padding:'10px 14px',borderRadius:11,
          background:'var(--bg-card)',border:'1px solid var(--border)',
          color:'var(--text-primary)',cursor:'pointer',
          opacity: current === 0 ? 0.4 : 1,
          display:'flex',alignItems:'center',gap:5,fontSize:13,fontWeight:700,
        }}>
          <ChevronLeft size={16}/>
        </button>

        {current < questions.length - 1 ? (
          <button type="button" onClick={() => goTo(current + 1)} style={{
            flex:1,padding:'12px',borderRadius:11,
            background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border:'none',color:'#fff',cursor:'pointer',
            fontSize:13.5,fontWeight:700,
            display:'flex',alignItems:'center',justifyContent:'center',gap:5,
            boxShadow:'0 6px 14px -4px rgba(99,102,241,0.5)',
          }}>
            Next <ChevronRight size={16}/>
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmSubmit(true)} style={{
            flex:1,padding:'12px',borderRadius:11,
            background:'linear-gradient(135deg, #10b981, #059669)',
            border:'none',color:'#fff',cursor:'pointer',
            fontSize:13.5,fontWeight:700,
            display:'flex',alignItems:'center',justifyContent:'center',gap:5,
            boxShadow:'0 6px 14px -4px rgba(16,185,129,0.5)',
          }}>
            Submit <Send size={15}/>
          </button>
        )}
      </footer>

      {/* Question navigator drawer */}
      {navOpen && (
        <div onClick={() => setNavOpen(false)} style={{
          position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(10px)',
          display:'flex',alignItems:'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:'100%',background:'var(--bg-card)',
            borderTopLeftRadius:24,borderTopRightRadius:24,
            padding:'14px 18px 28px calc(18px + env(safe-area-inset-bottom))',
            maxHeight:'70vh',overflowY:'auto',
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:16,fontWeight:800}}>Questions</div>
              <button type="button" onClick={() => setNavOpen(false)} style={{padding:6,background:'var(--bg-muted)',border:'none',borderRadius:8,color:'var(--text-muted)',cursor:'pointer',display:'flex'}}>
                <X size={16}/>
              </button>
            </div>

            <div style={{display:'flex',gap:10,marginBottom:14,fontSize:11,fontWeight:600,color:'var(--text-muted)',flexWrap:'wrap'}}>
              <Legend color="#10b981" label={`Answered ${answeredCount}`}/>
              <Legend color="#f59e0b" label={`Flagged ${flaggedCount}`}/>
              <Legend color="var(--bg-elevated)" label={`Skipped ${skippedCount}`}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:8}}>
              {questions.map((qq, i) => {
                const ans = answers[qq.id]?.trim();
                const isFlagged = flagged.has(qq.id);
                const isCurrent = i === current;
                let bg = 'var(--bg-elevated)', col = 'var(--text-secondary)';
                if (ans) { bg = 'rgba(16,185,129,0.2)'; col = '#10b981'; }
                if (isFlagged) { bg = 'rgba(245,158,11,0.2)'; col = '#f59e0b'; }
                if (isCurrent) { bg = 'linear-gradient(135deg, #6366f1, #8b5cf6)'; col = '#fff'; }
                return (
                  <button key={qq.id} type="button" onClick={() => goTo(i)} style={{
                    aspectRatio:'1',borderRadius:10,
                    background:bg,border:'none',color:col,cursor:'pointer',
                    fontSize:13,fontWeight:800,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    position:'relative',
                  }}>
                    {i + 1}
                    {isFlagged && !isCurrent && <Flag size={9} fill="#f59e0b" style={{position:'absolute',top:3,right:3,color:'#f59e0b'}}/>}
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={() => { setNavOpen(false); setConfirmSubmit(true); }} style={{
              width:'100%',marginTop:18,padding:'13px',borderRadius:12,
              background:'linear-gradient(135deg, #10b981, #059669)',
              border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              boxShadow:'0 8px 20px -6px rgba(16,185,129,0.5)',
            }}>
              <Send size={15}/> Submit test
            </button>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {confirmSubmit && (
        <div onClick={() => setConfirmSubmit(false)} style={{
          position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(10px)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'var(--bg-card)',border:'1px solid var(--border)',
            borderRadius:18,maxWidth:380,width:'100%',padding:24,textAlign:'center',
            boxShadow:'0 20px 60px -10px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              width:54,height:54,borderRadius:16,margin:'0 auto 12px',
              background:'rgba(245,158,11,0.15)',color:'#f59e0b',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}><Send size={26}/></div>
            <h2 style={{fontSize:18,fontWeight:800,margin:'0 0 6px'}}>Submit test?</h2>
            <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'0 0 14px',fontWeight:500}}>You can't change answers after submitting.</p>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:18}}>
              <Stat label="Answered" v={answeredCount} color="#10b981"/>
              <Stat label="Skipped" v={skippedCount} color="#6b7280"/>
              <Stat label="Flagged" v={flaggedCount} color="#f59e0b"/>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => setConfirmSubmit(false)} style={{
                flex:1,padding:'12px',borderRadius:11,background:'var(--bg-muted)',border:'1px solid var(--border)',
                color:'var(--text-primary)',fontSize:13,fontWeight:700,cursor:'pointer',
              }}>Keep editing</button>
              <button type="button" onClick={() => handleSubmit(false)} disabled={submitting} style={{
                flex:2,padding:'12px',borderRadius:11,
                background:'linear-gradient(135deg, #10b981, #059669)',
                border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',
                boxShadow:'0 8px 20px -6px rgba(16,185,129,0.5)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}>
                {submitting ? <><Loader2 size={15} className="qp-spin"/> Submitting</> : <><CheckCircle2 size={15}/> Yes, submit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes qp-spin { to { transform: rotate(360deg); } }
        .qp-spin { animation: qp-spin 0.7s linear infinite; }
        @keyframes qp-pulse { 50% { opacity: 0.6; } }
      `}</style>
    </>
  );
}

function ResultView({result, test, attemptId, onClose}: any) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const pct = Number(result.percentage || 0);
  const grade = pct >= 90 ? {l:'A+',c:'#10b981'} : pct >= 75 ? {l:'A',c:'#10b981'} : pct >= 60 ? {l:'B',c:'#3b82f6'} : pct >= 40 ? {l:'C',c:'#f59e0b'} : {l:'F',c:'#ef4444'};

  const loadReview = async () => {
    if (reviewData) { setReviewing(true); return; }
    try {
      const d = await qp.attempts.result(attemptId);
      setReviewData(d);
      setReviewing(true);
    } catch (e:any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  if (reviewing && reviewData) {
    return <ReviewView data={reviewData} onClose={() => setReviewing(false)}/>;
  }

  return (
    <main style={{minHeight:'100vh',padding:'40px 20px',maxWidth:520,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{
          width:120,height:120,borderRadius:'50%',margin:'0 auto 18px',
          background:`conic-gradient(${grade.c} ${pct * 3.6}deg, var(--bg-muted) 0deg)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 16px 40px -10px ${grade.c}66`,
        }}>
          <div style={{
            width:96,height:96,borderRadius:'50%',background:'var(--bg-base)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          }}>
            <div style={{fontSize:30,fontWeight:800,color:grade.c,letterSpacing:'-0.03em',lineHeight:1}}>{pct}%</div>
            <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2}}>{grade.l}</div>
          </div>
        </div>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px',letterSpacing:'-0.02em'}}>
          {pct >= 60 ? 'Great work! 🎉' : pct >= 40 ? 'Good try! 👍' : 'Keep practising 💪'}
        </h1>
        <p style={{fontSize:13,color:'var(--text-muted)',margin:0,fontWeight:500}}>{test?.title}</p>
      </div>

      <div style={{
        background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,
        padding:18,marginBottom:14,
      }}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
          <div style={{padding:'12px 14px',background:'rgba(16,185,129,0.1)',borderRadius:12,border:'1px solid rgba(16,185,129,0.3)'}}>
            <div style={{fontSize:24,fontWeight:800,color:'#10b981',letterSpacing:'-0.02em',lineHeight:1}}>{result.correct_count}</div>
            <div style={{fontSize:10.5,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:4}}>Correct</div>
          </div>
          <div style={{padding:'12px 14px',background:'rgba(239,68,68,0.1)',borderRadius:12,border:'1px solid rgba(239,68,68,0.3)'}}>
            <div style={{fontSize:24,fontWeight:800,color:'#ef4444',letterSpacing:'-0.02em',lineHeight:1}}>{result.wrong_count}</div>
            <div style={{fontSize:10.5,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:4}}>Wrong</div>
          </div>
          <div style={{padding:'12px 14px',background:'var(--bg-muted)',borderRadius:12,border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:'var(--text-secondary)',letterSpacing:'-0.02em',lineHeight:1}}>{result.skipped_count}</div>
            <div style={{fontSize:10.5,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:4}}>Skipped</div>
          </div>
          <div style={{padding:'12px 14px',background:'rgba(99,102,241,0.1)',borderRadius:12,border:'1px solid rgba(99,102,241,0.3)'}}>
            <div style={{fontSize:24,fontWeight:800,color:'var(--brand)',letterSpacing:'-0.02em',lineHeight:1}}>{Number(result.score)}/{Number(result.total_marks)}</div>
            <div style={{fontSize:10.5,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:4}}>Score</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:8}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:'13px',borderRadius:12,background:'var(--bg-muted)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Back to tests
        </button>
        <button type="button" onClick={loadReview} style={{flex:2,padding:'13px',borderRadius:12,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',boxShadow:'0 8px 20px -6px rgba(99,102,241,0.5)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <Sparkles size={14}/> Review answers
        </button>
      </div>
    </main>
  );
}

function ReviewView({data, onClose}: any) {
  const [idx, setIdx] = useState(0);
  const q = data.questions[idx];
  const correctSet = new Set((q.correct_answer || '').split(',').map((s:string) => s.trim().toUpperCase()));
  const studentSet = new Set((q.student_answer || '').split(',').map((s:string) => s.trim().toUpperCase()));

  return (
    <>
      <header style={{
        position:'sticky',top:0,zIndex:50,
        background:'rgba(7,11,20,0.95)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--border)',
        padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <button type="button" onClick={onClose} style={iconBtn}><ChevronLeft size={17}/></button>
        <div style={{fontSize:12,fontWeight:700}}>Review · Q{idx + 1} of {data.questions.length}</div>
        <div style={{
          padding:'4px 10px',borderRadius:8,
          background: q.is_correct === 1 ? 'rgba(16,185,129,0.15)' : q.is_correct === 0 ? 'rgba(239,68,68,0.15)' : 'var(--bg-muted)',
          color: q.is_correct === 1 ? '#10b981' : q.is_correct === 0 ? '#ef4444' : 'var(--text-muted)',
          fontSize:11,fontWeight:800,letterSpacing:'0.04em',
        }}>
          {q.is_correct === 1 ? 'CORRECT' : q.is_correct === 0 ? 'WRONG' : 'SKIPPED'}
        </div>
      </header>

      <main style={{padding:'18px 16px 100px',maxWidth:760,margin:'0 auto'}}>
        <div style={{padding:'18px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,marginBottom:14}}>
          <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.55,fontWeight:500}}>
            <MathText text={q.question_text}/>
          </div>
        </div>

        {Array.isArray(q.options) && q.options.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
            {q.options.map((opt: string, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = correctSet.has(letter);
              const wasSelected = studentSet.has(letter);
              return (
                <div key={i} style={{
                  display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',borderRadius:14,
                  background: isCorrect ? 'rgba(16,185,129,0.08)' : wasSelected ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
                  border: isCorrect ? '1px solid rgba(16,185,129,0.4)' : wasSelected ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
                }}>
                  <div style={{
                    width:30,height:30,borderRadius:10,flexShrink:0,
                    background: isCorrect ? '#10b981' : wasSelected ? '#ef4444' : 'var(--bg-elevated)',
                    color: (isCorrect || wasSelected) ? '#fff' : 'var(--text-secondary)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,
                  }}>{letter}</div>
                  <div style={{flex:1,minWidth:0,fontSize:14,color:'var(--text-primary)',lineHeight:1.45,paddingTop:5}}>
                    <MathText text={opt}/>
                    {wasSelected && <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:6,fontWeight:600}}>· Your choice</span>}
                    {isCorrect && <span style={{fontSize:10,color:'#10b981',marginLeft:6,fontWeight:700}}>· Correct</span>}
                  </div>
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
      </main>

      <footer style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:40,
        background:'rgba(7,11,20,0.95)',backdropFilter:'blur(16px)',
        borderTop:'1px solid var(--border)',
        padding:'10px 14px calc(10px + env(safe-area-inset-bottom))',
        display:'flex',gap:8,
      }}>
        <button type="button" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{
          flex:1,padding:'12px',borderRadius:11,background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:13,fontWeight:700,cursor:'pointer',opacity:idx===0?0.4:1,
          display:'flex',alignItems:'center',justifyContent:'center',gap:5,
        }}>
          <ChevronLeft size={15}/> Prev
        </button>
        <button type="button" onClick={() => setIdx(i => Math.min(data.questions.length - 1, i + 1))} disabled={idx === data.questions.length - 1} style={{
          flex:1,padding:'12px',borderRadius:11,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',opacity:idx===data.questions.length-1?0.4:1,
          display:'flex',alignItems:'center',justifyContent:'center',gap:5,
        }}>
          Next <ChevronRight size={15}/>
        </button>
      </footer>
    </>
  );
}

function Stat({label, v, color}: any) {
  return (
    <div style={{padding:'10px 6px',background:'var(--bg-muted)',borderRadius:10,textAlign:'center'}}>
      <div style={{fontSize:18,fontWeight:800,color,letterSpacing:'-0.02em',lineHeight:1}}>{v}</div>
      <div style={{fontSize:9.5,color:'var(--text-muted)',marginTop:3,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase'}}>{label}</div>
    </div>
  );
}

function Legend({color, label}: any) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:5}}>
      <div style={{width:10,height:10,borderRadius:3,background:color}}/>
      {label}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding:'13px 20px',borderRadius:12,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',
  boxShadow:'0 8px 20px -6px rgba(99,102,241,0.5)',
};
const iconBtn: React.CSSProperties = {
  width:38,height:38,borderRadius:11,
  background:'var(--bg-card)',border:'1px solid var(--border)',
  color:'var(--text-secondary)',cursor:'pointer',
  display:'flex',alignItems:'center',justifyContent:'center',
};
