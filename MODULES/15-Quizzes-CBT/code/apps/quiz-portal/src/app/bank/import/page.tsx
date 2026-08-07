"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import MathText from "@/components/ui/MathText";
import { qp } from "@/lib/api";
import {
  Sparkles, Copy, Check, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2,
  Upload, Bot, Zap, FileJson, Loader2, X
} from "lucide-react";

const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT',     url: 'https://chat.openai.com',     emoji: '🤖', color: '#10a37f' },
  { id: 'gemini',  name: 'Gemini',      url: 'https://gemini.google.com',   emoji: '✨', color: '#4285f4' },
  { id: 'claude',  name: 'Claude',      url: 'https://claude.ai',           emoji: '🟠', color: '#cc785c' },
  { id: 'grok',    name: 'Grok',        url: 'https://grok.com',            emoji: '⚡', color: '#1d9bf0' },
];

const MASTER_PROMPT = `You are a question-extraction assistant. I will give you an image of a textbook page, exam paper, or notes containing one or more questions. Your job is to extract them and return ONLY a valid JSON object in the EXACT format below — no explanation, no markdown fences, no commentary.

FORMAT:
{
  "questions": [
    {
      "question_type": "mcq_single",
      "question_text": "Your question here. Use $...$ for inline LaTeX, $$...$$ for block LaTeX.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "C",
      "solution": "Step-by-step explanation here.",
      "difficulty": "medium",
      "bloom_level": "apply",
      "exam_tag": "JEE Main",
      "target_class": "Class 11",
      "marks_positive": 4,
      "marks_negative": 1
    }
  ]
}

RULES:
1. question_type must be one of: "mcq_single" (one correct), "mcq_multi" (multiple correct), "integer" (numeric), "subjective" (long answer), "assertion_reason"
2. For mcq_multi, correct_answer = comma-separated letters like "A,C"
3. For integer, correct_answer = the numeric string like "42"
4. ALWAYS use LaTeX delimiters for math: $x^2$, $\\sqrt{2}$, $\\frac{a}{b}$, $\\int_0^1 x dx$
5. difficulty: easy / medium / hard / extreme
6. bloom_level: remember / understand / apply / analyze / evaluate / create
7. If a field is unknown, omit it (don't write "unknown" or null)
8. Extract EVERY question visible in the image
9. Return ONLY the JSON object — no \`\`\`json fences, no preamble

Begin extraction now.`;

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<1|2|3|4>(1);
  const [tool, setTool] = useState(AI_TOOLS[0]);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [parsed, setParsed] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const [defaults, setDefaults] = useState<any>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = MASTER_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseJson = () => {
    setParseError('');
    let text = jsonInput.trim();
    // Strip markdown fences if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    if (!text) { setParseError('Paste JSON output first'); return; }
    try {
      const data = JSON.parse(text);
      const qs = Array.isArray(data) ? data : (data.questions || []);
      if (!Array.isArray(qs) || qs.length === 0) {
        setParseError('No questions found. Expected format: { "questions": [...] }');
        return;
      }
      // Validate minimum
      const valid = qs.filter((q: any) => q.question_text && q.question_type);
      if (valid.length === 0) {
        setParseError('Questions missing required fields (question_text, question_type)');
        return;
      }
      setParsed(valid);
      setStep(4);
    } catch (e: any) {
      setParseError('Invalid JSON: ' + e.message);
    }
  };

  const doImport = async () => {
    setImporting(true);
    try {
      const r = await qp.bank.importBulk({ questions: parsed, ...defaults });
      setResult(r);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <TopBar/>
      <main style={{padding:'16px 16px 100px',maxWidth:760,margin:'0 auto'}}>

        {/* Header */}
        <button type="button" onClick={() => router.push('/bank')} style={{
          display:'inline-flex',alignItems:'center',gap:5,padding:'6px 10px',marginBottom:14,
          background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:9,
          color:'var(--text-secondary)',fontSize:11.5,fontWeight:600,cursor:'pointer',
        }}>
          <ArrowLeft size={13}/> Bank
        </button>
        <div className="qp-pill" style={{marginBottom:10}}><Bot size={11}/> AI Import</div>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',lineHeight:1.1}}>
          AI Import Wizard
        </h1>
        <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'4px 0 18px',fontWeight:500}}>
          Convert textbook images to questions using ChatGPT, Gemini, or Claude
        </p>

        {/* Stepper */}
        <div style={{display:'flex',gap:6,marginBottom:22}}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{
              flex:1,height:4,borderRadius:99,
              background: step >= s ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'var(--bg-muted)',
              transition:'background 0.3s',
            }}/>
          ))}
        </div>

        {/* Step 1: Pick AI tool */}
        {step === 1 && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
              Step 1 of 4
            </div>
            <h2 style={{fontSize:20,fontWeight:800,margin:'0 0 14px',letterSpacing:'-0.02em'}}>Pick your AI tool</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:18}}>
              {AI_TOOLS.map(t => (
                <button key={t.id} type="button" onClick={() => setTool(t)} style={{
                  padding:'18px 14px',borderRadius:16,
                  background: tool.id === t.id ? `${t.color}15` : 'var(--bg-card)',
                  border: tool.id === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                  color:'var(--text-primary)',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8,textAlign:'left',
                }}>
                  <div style={{fontSize:32}}>{t.emoji}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,letterSpacing:'-0.01em'}}>{t.name}</div>
                    <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:2,fontWeight:500}}>{t.url.replace('https://','')}</div>
                  </div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)} style={primaryBtn}>
              Continue with {tool.name} <ArrowRight size={15}/>
            </button>
          </>
        )}

        {/* Step 2: Copy prompt */}
        {step === 2 && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
              Step 2 of 4 · Using {tool.name}
            </div>
            <h2 style={{fontSize:20,fontWeight:800,margin:'0 0 6px',letterSpacing:'-0.02em'}}>Copy this prompt</h2>
            <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'0 0 14px',fontWeight:500}}>
              Open {tool.name}, attach your textbook/exam image, paste this prompt, send.
            </p>

            {/* Prompt box */}
            <div style={{position:'relative',marginBottom:14}}>
              <pre style={{
                margin:0,padding:'14px 14px 50px',borderRadius:14,
                background:'var(--bg-card)',border:'1px solid var(--border)',
                fontSize:11,lineHeight:1.55,color:'var(--text-secondary)',
                fontFamily:'ui-monospace, SF Mono, Consolas, monospace',
                whiteSpace:'pre-wrap',wordBreak:'break-word',
                maxHeight:280,overflowY:'auto',
              }}>{MASTER_PROMPT}</pre>
              <button type="button" onClick={copyPrompt} style={{
                position:'absolute',right:10,bottom:10,
                padding:'8px 14px',borderRadius:10,
                background: copied ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color:'#fff',border:'none',cursor:'pointer',
                fontSize:12,fontWeight:700,
                display:'inline-flex',alignItems:'center',gap:5,
                boxShadow: '0 6px 14px -4px rgba(99,102,241,0.5)',
              }}>
                {copied ? <><Check size={13}/> Copied</> : <><Copy size={13}/> Copy prompt</>}
              </button>
            </div>

            {/* Quick steps */}
            <div className="qp-card" style={{padding:14,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>
                Quick steps
              </div>
              {[
                `Open ${tool.name} in another tab`,
                `Attach your image (textbook page, exam, handwritten notes)`,
                `Paste the copied prompt`,
                `Send and wait for the JSON response`,
                `Copy the entire JSON output`,
                `Come back here and paste it in Step 3`,
              ].map((s, i) => (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'5px 0'}}>
                  <div style={{
                    width:18,height:18,borderRadius:'50%',background:'rgba(99,102,241,0.15)',color:'var(--brand)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:800,flexShrink:0,marginTop:1,
                  }}>{i+1}</div>
                  <div style={{fontSize:12.5,color:'var(--text-primary)',lineHeight:1.4}}>{s}</div>
                </div>
              ))}
            </div>

            <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
              <div style={{
                padding:'13px',borderRadius:12,marginBottom:10,
                background:`${tool.color}15`,border:`1px solid ${tool.color}40`,
                color:tool.color,fontSize:13,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',
              }}>
                Open {tool.name} ↗
              </div>
            </a>

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => setStep(1)} style={secondaryBtn}>← Back</button>
              <button type="button" onClick={() => setStep(3)} style={{...primaryBtn,flex:2}}>
                I have the JSON → Next
              </button>
            </div>
          </>
        )}

        {/* Step 3: Paste JSON */}
        {step === 3 && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
              Step 3 of 4
            </div>
            <h2 style={{fontSize:20,fontWeight:800,margin:'0 0 6px',letterSpacing:'-0.02em'}}>Paste the JSON</h2>
            <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'0 0 14px',fontWeight:500}}>
              Paste the entire JSON response from {tool.name}. Markdown fences are auto-stripped.
            </p>

            <textarea
              value={jsonInput}
              onChange={e => { setJsonInput(e.target.value); setParseError(''); }}
              placeholder='{"questions":[{"question_type":"mcq_single","question_text":"...","options":[...],"correct_answer":"C"}]}'
              rows={12}
              style={{
                width:'100%',padding:'12px 14px',
                background:'var(--bg-card)',border:`1px solid ${parseError ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                borderRadius:14,color:'var(--text-primary)',
                fontSize:12,fontFamily:'ui-monospace, SF Mono, Consolas, monospace',
                outline:'none',resize:'vertical',marginBottom:10,
              }}
            />

            {parseError && (
              <div style={{
                padding:'10px 12px',marginBottom:14,borderRadius:10,
                background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
                color:'#ef4444',fontSize:12,fontWeight:600,
                display:'flex',alignItems:'flex-start',gap:7,
              }}>
                <AlertCircle size={14} style={{flexShrink:0,marginTop:1}}/>
                <span>{parseError}</span>
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => setStep(2)} style={secondaryBtn}>← Back</button>
              <button type="button" onClick={parseJson} disabled={!jsonInput.trim()} style={{...primaryBtn,flex:2,opacity:!jsonInput.trim()?0.5:1}}>
                Parse & Preview <ArrowRight size={15}/>
              </button>
            </div>
          </>
        )}

        {/* Step 4: Preview & Import */}
        {step === 4 && !result && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
              Step 4 of 4
            </div>
            <h2 style={{fontSize:20,fontWeight:800,margin:'0 0 4px',letterSpacing:'-0.02em'}}>
              Preview · {parsed.length} questions ready
            </h2>
            <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'0 0 14px',fontWeight:500}}>
              Review then import to community bank
            </p>

            {/* Question preview cards */}
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18,maxHeight:'60vh',overflowY:'auto',paddingRight:4}}>
              {parsed.map((q: any, i: number) => (
                <div key={i} className="qp-card" style={{padding:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:9.5,fontWeight:800,padding:'2px 6px',borderRadius:4,background:'rgba(99,102,241,0.18)',color:'var(--brand)',letterSpacing:'0.04em',textTransform:'uppercase'}}>{q.question_type}</span>
                    <span style={{fontSize:9.5,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'var(--bg-muted)',color:'var(--text-secondary)',textTransform:'uppercase'}}>{q.difficulty || 'medium'}</span>
                    {q.exam_tag && <span style={{fontSize:9.5,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(139,92,246,0.15)',color:'#a78bfa'}}>{q.exam_tag}</span>}
                    <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>#{i+1}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.4,marginBottom:6,
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    <MathText text={q.question_text}/>
                  </div>
                  {q.options && Array.isArray(q.options) && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:6}}>
                      {q.options.slice(0,4).map((o: string, oi: number) => {
                        const letter = String.fromCharCode(65 + oi);
                        const isCorrect = (q.correct_answer || '').toUpperCase().includes(letter);
                        return (
                          <div key={oi} style={{
                            fontSize:10.5,padding:'3px 7px',borderRadius:5,
                            background: isCorrect ? 'rgba(16,185,129,0.15)' : 'var(--bg-muted)',
                            color: isCorrect ? '#10b981' : 'var(--text-muted)',
                            fontWeight: isCorrect ? 700 : 500,
                          }}>
                            {letter}: {o.length > 18 ? o.slice(0,18)+'…' : o}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => setStep(3)} style={secondaryBtn}>← Back</button>
              <button type="button" onClick={doImport} disabled={importing} style={{...primaryBtn,flex:2}}>
                {importing ? <><Loader2 size={15} className="qp-spin"/> Importing…</> : <><Zap size={15}/> Import {parsed.length} questions</>}
              </button>
            </div>
          </>
        )}

        {/* Result screen */}
        {result && (
          <>
            <div style={{textAlign:'center',padding:'30px 20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18}}>
              <div style={{
                width:64,height:64,borderRadius:18,margin:'0 auto 14px',
                background: result.failed === 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow: result.failed === 0 ? '0 12px 28px -8px rgba(16,185,129,0.5)' : '0 12px 28px -8px rgba(245,158,11,0.5)',
              }}>
                {result.failed === 0 ? <CheckCircle2 size={30} color="#fff"/> : <AlertCircle size={30} color="#fff"/>}
              </div>
              <h2 style={{fontSize:22,fontWeight:800,margin:'0 0 6px',letterSpacing:'-0.02em'}}>
                {result.failed === 0 ? 'Import successful!' : 'Partial import'}
              </h2>
              <p style={{fontSize:13,color:'var(--text-muted)',margin:'0 0 18px',fontWeight:500}}>
                <span style={{color:'#10b981',fontWeight:700}}>{result.created} created</span>
                {result.failed > 0 && <> · <span style={{color:'#ef4444',fontWeight:700}}>{result.failed} failed</span></>}
              </p>
              {result.errors && result.errors.length > 0 && (
                <details style={{textAlign:'left',marginTop:14,padding:'10px 12px',background:'var(--bg-muted)',borderRadius:10,fontSize:11.5,color:'var(--text-muted)'}}>
                  <summary style={{cursor:'pointer',fontWeight:700,color:'var(--text-secondary)'}}>View errors</summary>
                  <div style={{marginTop:8,fontFamily:'ui-monospace, SF Mono, monospace',fontSize:10.5,maxHeight:160,overflowY:'auto'}}>
                    {result.errors.map((er: any, i: number) => (
                      <div key={i} style={{padding:'2px 0'}}>#{er.index + 1}: {er.error}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button type="button" onClick={() => { setStep(1); setJsonInput(''); setParsed([]); setResult(null); }} style={secondaryBtn}>
                Import more
              </button>
              <button type="button" onClick={() => router.push('/bank')} style={{...primaryBtn,flex:2}}>
                View bank →
              </button>
            </div>
          </>
        )}

      </main>
      <BottomNav/>
      <style>{`@keyframes qp-spin { to { transform: rotate(360deg); } } .qp-spin { animation: qp-spin 0.7s linear infinite; }`}</style>
    </>
  );
}

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
