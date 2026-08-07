"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  ArrowLeft, ArrowRight, Sparkles, Zap, CheckCircle2, AlertCircle,
  Loader2, Clock, Shuffle, Eye, EyeOff, Calendar, Target
} from "lucide-react";

const COMMON_CLASSES = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const COMMON_EXAM_TAGS = ['CBSE','ICSE','JEE Main','JEE Advanced','NEET','Olympiad','State Board'];

const DIFF_COLORS: Record<string,string> = {
  easy: '#10b981', medium: '#3b82f6', hard: '#f59e0b', extreme: '#ef4444',
};

export default function CreateTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<1|2|3|4>(1);

  // Step 1
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [testType, setTestType] = useState<any>(null);
  const [title, setTitle] = useState('');

  // Step 2
  const [filters, setFilters] = useState<any>(null);
  const [subjectId, setSubjectId] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [targetClass, setTargetClass] = useState('');
  const [examTag, setExamTag] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [diffMix, setDiffMix] = useState({ easy: 30, medium: 50, hard: 20, extreme: 0 });

  // Step 3
  const [duration, setDuration] = useState(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [showResultImmediately, setShowResultImmediately] = useState(true);

  // Step 4 (preview)
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<any>(null);

  useEffect(() => {
    qp.assessment.types().then(d => setTestTypes(d.test_types || [])).catch(() => {});
    qp.bank.filters().then(setFilters).catch(() => {});
  }, []);

  // Auto-set defaults when test type is picked
  useEffect(() => {
    if (testType?.value === 'jee_mock') { setTotalQuestions(90); setDuration(180); }
    else if (testType?.value === 'neet_mock') { setTotalQuestions(180); setDuration(200); }
    else if (testType?.value === 'final_exam') { setTotalQuestions(50); setDuration(180); }
    else if (testType?.value === 'half_yearly') { setTotalQuestions(40); setDuration(150); }
    else if (testType?.value === 'unit_test') { setTotalQuestions(20); setDuration(60); }
    else if (testType?.value === 'dpp') { setTotalQuestions(15); setDuration(45); }
    else if (testType?.value === 'worksheet') { setTotalQuestions(20); setDuration(0); }
    else if (testType?.value === 'mock_test') { setTotalQuestions(30); setDuration(90); }
    else { setTotalQuestions(10); setDuration(30); }
  }, [testType]);

  const filteredChapters = useMemo(
    () => (filters?.chapters || []).filter((c:any) => !subjectId || String(c.subject_id) === String(subjectId)),
    [filters, subjectId]
  );

  const diffSum = diffMix.easy + diffMix.medium + diffMix.hard + diffMix.extreme;

  const goToPreview = async () => {
    setPreviewing(true); setPreviewError(''); setPreview(null);
    try {
      const d = await qp.assessment.preview({
        subject_id: subjectId ? Number(subjectId) : null,
        chapter_ids: selectedChapters,
        target_class: targetClass || null,
        exam_tag: examTag || null,
        total: totalQuestions,
        difficulty_mix: diffMix,
      });
      setPreview(d);
      setStep(4);
    } catch (e:any) {
      setPreviewError(e?.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const doPublish = async () => {
    if (!preview?.questions?.length) return;
    setPublishing(true);
    try {
      const r = await qp.assessment.publish({
        title,
        description: `${testType.label} · ${preview.questions.length} questions`,
        test_type: testType.value,
        subject_id: subjectId ? Number(subjectId) : null,
        duration_minutes: duration,
        total_marks: preview.stats.total_marks,
        negative_marking: negativeMarking,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_result_immediately: showResultImmediately,
        question_ids: preview.questions.map((q:any) => q.id),
      });
      setPublished(r);
    } catch (e:any) {
      alert(e?.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const adjustDiff = (key: keyof typeof diffMix, delta: number) => {
    setDiffMix(m => {
      const v = Math.max(0, Math.min(100, m[key] + delta));
      return { ...m, [key]: v };
    });
  };

  return (
    <>
      <TopBar/>
      <main style={{padding:'16px 16px 100px',maxWidth:760,margin:'0 auto'}}>

        <button type="button" onClick={() => router.back()} style={{
          display:'inline-flex',alignItems:'center',gap:5,padding:'6px 10px',marginBottom:14,
          background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:9,
          color:'var(--text-secondary)',fontSize:11.5,fontWeight:600,cursor:'pointer',
        }}>
          <ArrowLeft size={13}/> Back
        </button>
        <div className="qp-pill" style={{marginBottom:10}}><Zap size={11}/> 10-Second Build</div>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',lineHeight:1.1}}>
          Create Test
        </h1>
        <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'4px 0 18px',fontWeight:500}}>
          Auto-generate from your community question bank
        </p>

        {/* Stepper */}
        <div style={{display:'flex',gap:6,marginBottom:22}}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{flex:1,height:4,borderRadius:99,
              background: step >= s ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'var(--bg-muted)',
              transition:'background 0.3s'}}/>
          ))}
        </div>

        {/* STEP 1: Pick test type */}
        {step === 1 && (
          <>
            <StepHeader n={1} title="Pick test type"/>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Test title (e.g. Math Chapter 5 — Unit Test)"
              style={inputStyle}
            />

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:18}}>
              {testTypes.map(t => (
                <button key={t.value} type="button" onClick={() => setTestType(t)} style={{
                  padding:'14px 12px',borderRadius:14,
                  background: testType?.value === t.value ? `${t.color}15` : 'var(--bg-card)',
                  border: testType?.value === t.value ? `2px solid ${t.color}` : '1px solid var(--border)',
                  color:'var(--text-primary)',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6,textAlign:'left',
                }}>
                  <div style={{fontSize:24}}>{t.emoji}</div>
                  <div>
                    <div style={{fontSize:13.5,fontWeight:800,letterSpacing:'-0.01em'}}>{t.label}</div>
                    <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:2,fontWeight:500,lineHeight:1.3}}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setStep(2)} disabled={!testType || !title.trim()} style={{...primaryBtn, opacity: (!testType || !title.trim()) ? 0.5 : 1}}>
              Continue <ArrowRight size={15}/>
            </button>
          </>
        )}

        {/* STEP 2: Configure */}
        {step === 2 && (
          <>
            <StepHeader n={2} title="Configure questions"/>

            <SectionLabel>Subject</SectionLabel>
            <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setSelectedChapters([]); }} style={selectStyle}>
              <option value="">— Any subject —</option>
              {(filters?.subjects || []).map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {subjectId && filteredChapters.length > 0 && (
              <>
                <SectionLabel right={<span>{selectedChapters.length} selected</span>}>Chapters (optional · multi-select)</SectionLabel>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14,maxHeight:140,overflowY:'auto',padding:4,background:'var(--bg-muted)',borderRadius:10}}>
                  {filteredChapters.map((c:any) => {
                    const active = selectedChapters.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => {
                        setSelectedChapters(s => active ? s.filter(x => x !== c.id) : [...s, c.id]);
                      }} style={{
                        padding:'5px 10px',borderRadius:8,
                        background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-card)',
                        border: active ? 'none' : '1px solid var(--border)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        fontSize:11,fontWeight:600,cursor:'pointer',
                      }}>{c.name}</button>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              <div>
                <SectionLabel>Class</SectionLabel>
                <select value={targetClass} onChange={e => setTargetClass(e.target.value)} style={selectStyle}>
                  <option value="">— Any —</option>
                  {COMMON_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <SectionLabel>Exam Tag</SectionLabel>
                <select value={examTag} onChange={e => setExamTag(e.target.value)} style={selectStyle}>
                  <option value="">— Any —</option>
                  {COMMON_EXAM_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <SectionLabel right={<span>{totalQuestions} questions</span>}>Total Questions</SectionLabel>
            <input
              type="range" min="5" max="100" step="5"
              value={totalQuestions}
              onChange={e => setTotalQuestions(Number(e.target.value))}
              style={{width:'100%',accentColor:'var(--brand)',marginBottom:18}}
            />

            <SectionLabel right={<span style={{color: diffSum === 100 ? '#10b981' : '#f59e0b'}}>Sum: {diffSum}%</span>}>Difficulty Mix</SectionLabel>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
              {(['easy','medium','hard','extreme'] as const).map(k => (
                <div key={k} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--bg-muted)',borderRadius:10,border:'1px solid var(--border)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:DIFF_COLORS[k]}}/>
                  <div style={{flex:1,fontSize:12.5,fontWeight:600,color:'var(--text-primary)',textTransform:'capitalize'}}>{k}</div>
                  <button type="button" onClick={() => adjustDiff(k, -10)} style={pillBtn}>−</button>
                  <div style={{width:50,textAlign:'center',fontSize:14,fontWeight:800,color:DIFF_COLORS[k]}}>{diffMix[k]}%</div>
                  <button type="button" onClick={() => adjustDiff(k, +10)} style={pillBtn}>+</button>
                </div>
              ))}
              <div style={{fontSize:10.5,color:'var(--text-muted)',padding:'2px 6px'}}>
                Tip: Sum should be 100%. Picker will round to fit total.
              </div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => setStep(1)} style={secondaryBtn}>← Back</button>
              <button type="button" onClick={() => setStep(3)} style={{...primaryBtn,flex:2}}>
                Continue <ArrowRight size={15}/>
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Schedule + rules */}
        {step === 3 && (
          <>
            <StepHeader n={3} title="Test settings"/>

            <SectionLabel right={<span>{duration} min</span>}>Duration</SectionLabel>
            <input
              type="range" min="0" max="240" step="5"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{width:'100%',accentColor:'var(--brand)',marginBottom:6}}
            />
            <div style={{fontSize:10.5,color:'var(--text-muted)',marginBottom:18}}>
              {duration === 0 ? 'No time limit (worksheet/practice)' : `${Math.floor(duration/60)}h ${duration%60}m`}
            </div>

            <ToggleRow icon={Shuffle} label="Shuffle questions" sub="Different order per student" value={shuffleQuestions} onToggle={() => setShuffleQuestions(v => !v)}/>
            <ToggleRow icon={Shuffle} label="Shuffle options" sub="Reorder MCQ options" value={shuffleOptions} onToggle={() => setShuffleOptions(v => !v)}/>
            <ToggleRow icon={Target} label="Negative marking" sub={`Deduct marks for wrong answers`} value={negativeMarking} onToggle={() => setNegativeMarking(v => !v)} color="#ef4444"/>
            <ToggleRow icon={Eye} label="Show result immediately" sub="vs after window closes" value={showResultImmediately} onToggle={() => setShowResultImmediately(v => !v)} color="#10b981"/>

            {previewError && (
              <div style={{padding:'10px 12px',marginTop:14,marginBottom:14,borderRadius:10,
                background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
                color:'#ef4444',fontSize:12,fontWeight:600,display:'flex',alignItems:'flex-start',gap:7}}>
                <AlertCircle size={14} style={{flexShrink:0,marginTop:1}}/>
                <span>{previewError}</span>
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:18}}>
              <button type="button" onClick={() => setStep(2)} style={secondaryBtn}>← Back</button>
              <button type="button" onClick={goToPreview} disabled={previewing} style={{...primaryBtn,flex:2}}>
                {previewing ? <><Loader2 size={15} className="qp-spin"/> Building…</> : <><Sparkles size={15}/> Generate Test</>}
              </button>
            </div>
          </>
        )}

        {/* STEP 4: Preview + publish OR result */}
        {step === 4 && !published && preview && (
          <>
            <StepHeader n={4} title={`Preview · ${preview.stats.total_questions} questions · ${preview.stats.total_marks} marks`}/>

            {/* Quick stats */}
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {Object.entries(preview.stats.by_difficulty || {}).map(([d, n]:any) => (
                <span key={d} style={{
                  fontSize:10.5,fontWeight:700,padding:'4px 9px',borderRadius:6,
                  background: `${DIFF_COLORS[d]}1a`, color: DIFF_COLORS[d],
                  textTransform:'capitalize',letterSpacing:'0.04em',
                }}>{n} {d}</span>
              ))}
              <span style={{
                fontSize:10.5,fontWeight:700,padding:'4px 9px',borderRadius:6,
                background:'var(--bg-muted)',color:'var(--text-secondary)',
              }}>{duration > 0 ? `${duration} min` : 'No timer'}</span>
              {negativeMarking && (
                <span style={{
                  fontSize:10.5,fontWeight:700,padding:'4px 9px',borderRadius:6,
                  background:'rgba(239,68,68,0.15)',color:'#ef4444',
                }}>Negative marking</span>
              )}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18,maxHeight:'55vh',overflowY:'auto',paddingRight:4}}>
              {preview.questions.map((q:any, i:number) => (
                <div key={q.id} className="qp-card" style={{padding:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                    <span style={{fontSize:9.5,fontWeight:800,padding:'2px 6px',borderRadius:4,background:`${DIFF_COLORS[q.difficulty]}22`,color:DIFF_COLORS[q.difficulty],letterSpacing:'0.04em',textTransform:'uppercase'}}>{q.difficulty}</span>
                    <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>Q{i+1} · {q.marks_positive}M</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.4,
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    <MathText text={q.question_text}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => { setStep(3); setPreview(null); }} style={secondaryBtn}>← Tweak</button>
              <button type="button" onClick={doPublish} disabled={publishing} style={{...primaryBtn,flex:2,background:'linear-gradient(135deg, #10b981, #059669)',boxShadow:'0 8px 20px -6px rgba(16,185,129,0.5)'}}>
                {publishing ? <><Loader2 size={15} className="qp-spin"/> Publishing…</> : <><CheckCircle2 size={15}/> Publish Test</>}
              </button>
            </div>
          </>
        )}

        {/* Result */}
        {published && (
          <div style={{textAlign:'center',padding:'30px 20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18}}>
            <div style={{
              width:64,height:64,borderRadius:18,margin:'0 auto 14px',
              background:'linear-gradient(135deg, #10b981, #059669)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 12px 28px -8px rgba(16,185,129,0.5)',
            }}>
              <CheckCircle2 size={30} color="#fff"/>
            </div>
            <h2 style={{fontSize:22,fontWeight:800,margin:'0 0 6px',letterSpacing:'-0.02em'}}>Test published! 🎉</h2>
            <p style={{fontSize:13,color:'var(--text-muted)',margin:'0 0 18px',fontWeight:500}}>
              <strong style={{color:'var(--text-primary)'}}>{title}</strong>
              <br/>
              {published.question_count} questions · {published.total_marks} marks
            </p>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button type="button" onClick={() => router.push('/assessment')} style={secondaryBtn}>
                View tests
              </button>
              <button type="button" onClick={() => { router.push('/assessment/create'); setTimeout(() => window.location.reload(), 100); }} style={{...primaryBtn,flex:2}}>
                Create another
              </button>
            </div>
          </div>
        )}

      </main>
      <BottomNav/>
      <style>{`@keyframes qp-spin { to { transform: rotate(360deg); } } .qp-spin { animation: qp-spin 0.7s linear infinite; }`}</style>
    </>
  );
}

function StepHeader({n, title}:{n:number; title:string}) {
  return (
    <>
      <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
        Step {n} of 4
      </div>
      <h2 style={{fontSize:20,fontWeight:800,margin:'0 0 14px',letterSpacing:'-0.02em'}}>{title}</h2>
    </>
  );
}

function SectionLabel({children, right}:{children:React.ReactNode; right?:React.ReactNode}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',
      textTransform:'uppercase',marginBottom:7,marginTop:2}}>
      <span>{children}</span>
      {right && <span style={{fontSize:10,fontWeight:700,textTransform:'none',letterSpacing:'normal'}}>{right}</span>}
    </div>
  );
}

function ToggleRow({icon:Icon, label, sub, value, onToggle, color = '#6366f1'}:any) {
  return (
    <button type="button" onClick={onToggle} style={{
      width:'100%',padding:'12px 14px',marginBottom:8,
      background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:12,
      display:'flex',alignItems:'center',gap:10,cursor:'pointer',color:'var(--text-primary)',
    }}>
      <div style={{width:32,height:32,borderRadius:9,background: value ? `${color}20` : 'var(--bg-elevated)',color: value ? color : 'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon size={15}/>
      </div>
      <div style={{flex:1,textAlign:'left',minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700}}>{label}</div>
        <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:2}}>{sub}</div>
      </div>
      <div style={{width:36,height:20,borderRadius:99,background: value ? color : 'var(--bg-elevated)',position:'relative',transition:'background 0.2s'}}>
        <div style={{position:'absolute',top:2,left: value ? 18 : 2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
      </div>
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width:'100%',padding:'12px 14px',
  background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,
  color:'var(--text-primary)',fontSize:14,fontWeight:500,outline:'none',
  marginBottom:14,fontFamily:'inherit',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, padding:'10px 12px', cursor:'pointer',
  appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
  backgroundImage:`url("data:image/svg+xml;charset=UTF-8,%3csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1l4 4 4-4' stroke='%236a86ab' stroke-width='1.5' fill='none' stroke-linecap='round'/%3e%3c/svg%3e")`,
  backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',
  paddingRight:32,marginBottom:14,
};
const primaryBtn: React.CSSProperties = {
  flex:1,padding:'13px',borderRadius:12,
  background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',
  boxShadow:'0 8px 20px -6px rgba(99,102,241,0.5)',
  display:'flex',alignItems:'center',justifyContent:'center',gap:6,
};
const secondaryBtn: React.CSSProperties = {
  flex:1,padding:'13px',borderRadius:12,
  background:'var(--bg-muted)',border:'1px solid var(--border)',color:'var(--text-secondary)',
  fontSize:13,fontWeight:700,cursor:'pointer',
  display:'flex',alignItems:'center',justifyContent:'center',gap:6,
};
const pillBtn: React.CSSProperties = {
  width:28,height:28,borderRadius:8,background:'var(--bg-card)',border:'1px solid var(--border)',
  color:'var(--text-primary)',fontSize:14,fontWeight:700,cursor:'pointer',
  display:'flex',alignItems:'center',justifyContent:'center',
};
