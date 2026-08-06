"use client";
import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  Plus, Trash2, CheckCircle2, Eye, Lock, Globe2, Loader2, Sparkles
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const TYPES = [
  { value: 'mcq_single',       label: 'MCQ',           hint: 'Single correct'      },
  { value: 'mcq_multi',        label: 'Multi-MCQ',     hint: 'Multiple correct'    },
  { value: 'integer',          label: 'Integer',       hint: 'Numeric answer'      },
  { value: 'assertion_reason', label: 'Assert-Reason', hint: 'A/R format'          },
  { value: 'subjective',       label: 'Subjective',    hint: 'Long answer'         },
];

const DIFFS = [
  { value: 'easy',    label: 'Easy',    color: '#10b981' },
  { value: 'medium',  label: 'Medium',  color: '#3b82f6' },
  { value: 'hard',    label: 'Hard',    color: '#f59e0b' },
  { value: 'extreme', label: 'Extreme', color: '#ef4444' },
];

const BLOOMS = ['remember','understand','apply','analyze','evaluate','create'];
const COMMON_EXAM_TAGS = ['CBSE','ICSE','JEE Main','JEE Advanced','NEET','Olympiad','State Board'];
const COMMON_CLASSES = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];

export default function AddQuestionSheet({ open, onClose, onSaved }: Props) {
  const [filters, setFilters] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [type, setType] = useState('mcq_single');
  const [questionText, setQuestionText] = useState('');
  const [hasLatex, setHasLatex] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [correctMulti, setCorrectMulti] = useState<string[]>([]);
  const [integerAnswer, setIntegerAnswer] = useState('');
  const [solution, setSolution] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [bloomLevel, setBloomLevel] = useState('understand');
  const [examTag, setExamTag] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [marksPositive, setMarksPositive] = useState('4');
  const [marksNegative, setMarksNegative] = useState('1');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (open && !filters) qp.bank.filters().then(setFilters).catch(() => {});
  }, [open, filters]);

  // Auto-detect LaTeX
  useEffect(() => {
    setHasLatex(/\$.*\$/.test(questionText) || /\$.*\$/.test(solution));
  }, [questionText, solution]);

  const reset = () => {
    setType('mcq_single'); setQuestionText(''); setOptions(['','','','']);
    setCorrectAnswer('A'); setCorrectMulti([]); setIntegerAnswer('');
    setSolution(''); setModelAnswer('');
    setDifficulty('medium'); setBloomLevel('understand');
    setExamTag(''); setTargetClass('');
    setSubjectId(''); setChapterId(''); setTopicId('');
    setMarksPositive('4'); setMarksNegative('1');
    setIsPrivate(false); setPreviewMode(false);
  };

  const isMCQ = type === 'mcq_single' || type === 'mcq_multi' || type === 'assertion_reason';
  const filteredChapters = (filters?.chapters || []).filter((c: any) => !subjectId || String(c.subject_id) === String(subjectId));
  const filteredTopics = (filters?.topics || []).filter((t: any) => !chapterId || String(t.chapter_id) === String(chapterId));

  const validate = () => {
    if (!questionText.trim()) return 'Question text is required';
    if (isMCQ) {
      const filled = options.filter(o => o.trim()).length;
      if (filled < 2) return 'At least 2 options required';
      if (type === 'mcq_single' && !correctAnswer) return 'Pick the correct answer';
      if (type === 'mcq_multi' && correctMulti.length === 0) return 'Pick at least one correct option';
    }
    if (type === 'integer' && !integerAnswer.trim()) return 'Integer answer required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { alert(err); return; }
    setSaving(true);
    try {
      const body: any = {
        question_type: type,
        question_text: questionText.trim(),
        has_latex: hasLatex,
        difficulty, bloom_level: bloomLevel,
        exam_tag: examTag || null,
        target_class: targetClass || null,
        subject_id: subjectId ? Number(subjectId) : null,
        chapter_id: chapterId ? Number(chapterId) : null,
        topic_id: topicId ? Number(topicId) : null,
        marks_positive: Number(marksPositive) || 4,
        marks_negative: Number(marksNegative) || 0,
        solution: solution.trim() || null,
        is_private: isPrivate,
      };
      if (isMCQ) {
        body.options = options.filter(o => o.trim());
        body.correct_answer = type === 'mcq_multi' ? correctMulti.join(',') : correctAnswer;
      } else if (type === 'integer') {
        body.correct_answer = integerAnswer.trim();
      } else if (type === 'subjective') {
        body.model_answer = modelAnswer.trim() || null;
      }
      await qp.bank.create(body);
      reset();
      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={previewMode ? 'Preview' : 'New Question'}>
      {previewMode ? (
        <PreviewView
          questionText={questionText} type={type} options={options}
          correctAnswer={correctAnswer} correctMulti={correctMulti}
          integerAnswer={integerAnswer} solution={solution}
          difficulty={difficulty} examTag={examTag}
          onBack={() => setPreviewMode(false)} onSave={handleSave} saving={saving}
        />
      ) : (
        <>
          {/* Question Type tabs */}
          <SectionLabel>Question Type</SectionLabel>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)} style={{
                padding:'8px 12px',borderRadius:10,
                background: type === t.value ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-muted)',
                border: type === t.value ? 'none' : '1px solid var(--border)',
                color: type === t.value ? '#fff' : 'var(--text-secondary)',
                fontSize:12,fontWeight:700,cursor:'pointer',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Question text */}
          <SectionLabel right={hasLatex && <span style={{color:'var(--brand)'}}>LaTeX detected</span>}>Question</SectionLabel>
          <textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="Type your question here. Use $...$ for inline math, $$...$$ for block math."
            rows={3}
            style={inputStyle}
          />
          {questionText && hasLatex && (
            <div style={{padding:'10px 12px',marginTop:8,background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10,fontSize:13.5,color:'var(--text-primary)'}}>
              <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:5}}>Preview</div>
              <MathText text={questionText}/>
            </div>
          )}

          {/* Options for MCQ */}
          {isMCQ && (
            <>
              <SectionLabel>Options</SectionLabel>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect = type === 'mcq_multi' ? correctMulti.includes(letter) : correctAnswer === letter;
                  return (
                    <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                      <button type="button" onClick={() => {
                        if (type === 'mcq_multi') {
                          setCorrectMulti(m => m.includes(letter) ? m.filter(l => l !== letter) : [...m, letter]);
                        } else {
                          setCorrectAnswer(letter);
                        }
                      }} style={{
                        width:34,height:34,borderRadius:10,flexShrink:0,
                        background: isCorrect ? '#10b981' : 'var(--bg-elevated)',
                        color: isCorrect ? '#fff' : 'var(--text-secondary)',
                        border: 'none',cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:13,fontWeight:800,
                      }}>{isCorrect ? <CheckCircle2 size={16}/> : letter}</button>
                      <input
                        value={opt}
                        onChange={e => setOptions(o => o.map((x,j) => j === i ? e.target.value : x))}
                        placeholder={`Option ${letter}`}
                        style={{...inputStyle, marginBottom:0, flex:1, padding:'9px 12px'}}
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => setOptions(o => o.filter((_,j) => j !== i))} style={{
                          padding:'9px 10px',borderRadius:10,background:'var(--bg-muted)',border:'1px solid var(--border)',color:'#ef4444',cursor:'pointer',
                        }}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  );
                })}
                {options.length < 6 && (
                  <button type="button" onClick={() => setOptions(o => [...o, ''])} style={{
                    padding:'10px',borderRadius:10,
                    background:'transparent',border:'1px dashed var(--border)',
                    color:'var(--text-muted)',cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                    fontSize:12,fontWeight:600,
                  }}>
                    <Plus size={13}/> Add option
                  </button>
                )}
                <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:2}}>
                  Tap the letter to mark correct {type === 'mcq_multi' ? '(multiple allowed)' : ''}
                </div>
              </div>
            </>
          )}

          {/* Integer answer */}
          {type === 'integer' && (
            <>
              <SectionLabel>Correct Answer</SectionLabel>
              <input
                value={integerAnswer}
                onChange={e => setIntegerAnswer(e.target.value)}
                placeholder="e.g. 42"
                inputMode="numeric"
                style={inputStyle}
              />
            </>
          )}

          {/* Subjective model answer */}
          {type === 'subjective' && (
            <>
              <SectionLabel>Model Answer (optional)</SectionLabel>
              <textarea
                value={modelAnswer}
                onChange={e => setModelAnswer(e.target.value)}
                placeholder="The expected ideal answer..."
                rows={3}
                style={inputStyle}
              />
            </>
          )}

          {/* Solution */}
          <SectionLabel>Solution / Explanation</SectionLabel>
          <textarea
            value={solution}
            onChange={e => setSolution(e.target.value)}
            placeholder="Step-by-step solution. LaTeX supported."
            rows={3}
            style={inputStyle}
          />

          {/* Subject / Chapter / Topic */}
          <SectionLabel>Categorization</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
            <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(''); setTopicId(''); }} style={selectStyle}>
              <option value="">Subject</option>
              {(filters?.subjects || []).map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={chapterId} onChange={e => { setChapterId(e.target.value); setTopicId(''); }} style={selectStyle} disabled={!subjectId}>
              <option value="">Chapter</option>
              {filteredChapters.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={topicId} onChange={e => setTopicId(e.target.value)} style={selectStyle} disabled={!chapterId}>
              <option value="">Topic</option>
              {filteredTopics.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Difficulty */}
          <SectionLabel>Difficulty</SectionLabel>
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {DIFFS.map(d => (
              <button key={d.value} type="button" onClick={() => setDifficulty(d.value)} style={{
                flex:1,padding:'9px 8px',borderRadius:10,
                background: difficulty === d.value ? d.color : 'var(--bg-muted)',
                border: difficulty === d.value ? 'none' : '1px solid var(--border)',
                color: difficulty === d.value ? '#fff' : 'var(--text-secondary)',
                fontSize:12,fontWeight:700,cursor:'pointer',textTransform:'capitalize',
              }}>{d.label}</button>
            ))}
          </div>

          {/* Tags row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            <div>
              <SectionLabel>Exam Tag</SectionLabel>
              <select value={examTag} onChange={e => setExamTag(e.target.value)} style={selectStyle}>
                <option value="">— None —</option>
                {COMMON_EXAM_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <SectionLabel>Class</SectionLabel>
              <select value={targetClass} onChange={e => setTargetClass(e.target.value)} style={selectStyle}>
                <option value="">— None —</option>
                {COMMON_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Bloom level + Marks */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
            <div>
              <SectionLabel>Bloom</SectionLabel>
              <select value={bloomLevel} onChange={e => setBloomLevel(e.target.value)} style={selectStyle}>
                {BLOOMS.map(b => <option key={b} value={b} style={{textTransform:'capitalize'}}>{b}</option>)}
              </select>
            </div>
            <div>
              <SectionLabel>+ Marks</SectionLabel>
              <input value={marksPositive} onChange={e => setMarksPositive(e.target.value)} type="number" step="0.5" style={inputStyle}/>
            </div>
            <div>
              <SectionLabel>– Marks</SectionLabel>
              <input value={marksNegative} onChange={e => setMarksNegative(e.target.value)} type="number" step="0.5" style={inputStyle}/>
            </div>
          </div>

          {/* Privacy */}
          <button type="button" onClick={() => setIsPrivate(p => !p)} style={{
            width:'100%',padding:'12px 14px',marginBottom:14,
            background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:12,
            display:'flex',alignItems:'center',gap:10,cursor:'pointer',color:'var(--text-primary)',
          }}>
            <div style={{
              width:34,height:34,borderRadius:10,
              background: isPrivate ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: isPrivate ? '#ef4444' : '#10b981',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              {isPrivate ? <Lock size={16}/> : <Globe2 size={16}/>}
            </div>
            <div style={{flex:1,textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:700}}>{isPrivate ? 'Private' : 'Public (Community)'}</div>
              <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:2}}>
                {isPrivate ? 'Only visible to you' : 'Visible to all teachers globally'}
              </div>
            </div>
            <div style={{
              width:36,height:20,borderRadius:99,
              background: isPrivate ? '#ef4444' : '#10b981',
              position:'relative',transition:'background 0.2s',
            }}>
              <div style={{
                position:'absolute',top:2,left: isPrivate ? 18 : 2,
                width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',
              }}/>
            </div>
          </button>

          {/* Action buttons */}
          <div style={{display:'flex',gap:8,marginTop:8,position:'sticky',bottom:0}}>
            <button type="button" onClick={() => setPreviewMode(true)} disabled={!questionText.trim()} style={{
              flex:1,padding:'13px',borderRadius:12,
              background:'var(--bg-muted)',border:'1px solid var(--border)',color:'var(--text-primary)',
              fontSize:13,fontWeight:700,cursor:'pointer',opacity:!questionText.trim()?0.5:1,
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            }}>
              <Eye size={15}/> Preview
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !questionText.trim()} style={{
              flex:2,padding:'13px',borderRadius:12,
              background: saving || !questionText.trim() ? 'var(--bg-muted)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border:'none',color:'#fff',
              fontSize:13.5,fontWeight:700,cursor:'pointer',
              boxShadow: !saving && questionText.trim() ? '0 8px 20px -6px rgba(99,102,241,0.5)' : 'none',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              opacity:!questionText.trim()?0.5:1,
            }}>
              {saving ? <><Loader2 size={15} className="qp-spin"/> Saving</> : <><Sparkles size={15}/> Save Question</>}
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes qp-spin { to { transform: rotate(360deg); } } .qp-spin { animation: qp-spin 0.7s linear infinite; }`}</style>
    </BottomSheet>
  );
}

function SectionLabel({children, right}:{children:React.ReactNode; right?:React.ReactNode}) {
  return (
    <div style={{
      display:'flex',justifyContent:'space-between',alignItems:'center',
      fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',
      textTransform:'uppercase',marginBottom:7,marginTop:2,
    }}>
      <span>{children}</span>
      {right && <span style={{fontSize:10,fontWeight:600,textTransform:'none',letterSpacing:'normal'}}>{right}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:'100%',padding:'11px 12px',
  background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:12,
  color:'var(--text-primary)',fontSize:13.5,fontWeight:500,outline:'none',
  marginBottom:14,fontFamily:'inherit',resize:'vertical',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, marginBottom:0, padding:'10px 10px', cursor:'pointer',
  appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
  backgroundImage:`url("data:image/svg+xml;charset=UTF-8,%3csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1l4 4 4-4' stroke='%236a86ab' stroke-width='1.5' fill='none' stroke-linecap='round'/%3e%3c/svg%3e")`,
  backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',
  paddingRight:28,
};

function PreviewView({questionText, type, options, correctAnswer, correctMulti, integerAnswer, solution, difficulty, examTag, onBack, onSave, saving}:any) {
  const isMCQ = type === 'mcq_single' || type === 'mcq_multi' || type === 'assertion_reason';
  const correctSet = type === 'mcq_multi' ? new Set(correctMulti) : new Set([correctAnswer]);
  return (
    <>
      <div style={{padding:'14px 16px',borderRadius:14,background:'var(--bg-muted)',border:'1px solid var(--border)',marginBottom:14}}>
        <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.5,fontWeight:500}}>
          <MathText text={questionText}/>
        </div>
      </div>
      {isMCQ && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
          {options.filter((o:string) => o.trim()).map((opt:string, i:number) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = correctSet.has(letter);
            return (
              <div key={i} style={{display:'flex',gap:10,padding:'12px 14px',borderRadius:12,
                background: isCorrect ? 'rgba(16,185,129,0.08)' : 'var(--bg-muted)',
                border: isCorrect ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)'}}>
                <div style={{width:26,height:26,borderRadius:8,flexShrink:0,
                  background: isCorrect ? '#10b981' : 'var(--bg-elevated)',
                  color: isCorrect ? '#fff' : 'var(--text-secondary)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{letter}</div>
                <div style={{flex:1,fontSize:13.5,color:'var(--text-primary)',lineHeight:1.45,paddingTop:3}}>
                  <MathText text={opt}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {type === 'integer' && (
        <div style={{padding:'12px 14px',borderRadius:12,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.4)',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:5}}>Answer</div>
          <div style={{fontSize:18,fontWeight:800,color:'var(--text-primary)'}}>{integerAnswer}</div>
        </div>
      )}
      {solution && (
        <div style={{padding:'14px 16px',borderRadius:14,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.25)',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--brand)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>Solution</div>
          <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.5}}>
            <MathText text={solution}/>
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:8,marginTop:14}}>
        <button type="button" onClick={onBack} style={{flex:1,padding:'13px',borderRadius:12,background:'var(--bg-muted)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Back to edit
        </button>
        <button type="button" onClick={onSave} disabled={saving} style={{
          flex:2,padding:'13px',borderRadius:12,
          background:'linear-gradient(135deg, #10b981, #059669)',
          border:'none',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',
          boxShadow:'0 8px 20px -6px rgba(16,185,129,0.5)',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        }}>
          {saving ? <><Loader2 size={15} className="qp-spin"/> Saving</> : <><CheckCircle2 size={15}/> Looks good — Save</>}
        </button>
      </div>
    </>
  );
}
