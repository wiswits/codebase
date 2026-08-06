"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { qp } from "@/lib/api";
import {
  BarChart3, TrendingUp, Award, Target, Users, ClipboardList,
  Library, Activity, AlertTriangle, ChevronRight, Sparkles
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const COLORS = {
  brand: '#6366f1',
  brand2: '#8b5cf6',
  pink: '#ec4899',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

export default function AnalyticsPage() {
  const [view, setView] = useState<'teacher'|'student'>('teacher');
  const [teacher, setTeacher] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingS, setLoadingS] = useState(true);

  useEffect(() => {
    qp.analytics.teacher().then(setTeacher).catch(() => {}).finally(() => setLoadingT(false));
    qp.analytics.student().then(setStudent).catch(() => {}).finally(() => setLoadingS(false));
  }, []);

  // Auto-default to student view if user is a student
  useEffect(() => {
    if (!loadingS && student?.is_student && (!teacher || (teacher?.stats?.total_tests || 0) === 0)) {
      setView('student');
    }
  }, [loadingS, student, teacher]);

  const isStudent = student?.is_student;

  return (
    <>
      <TopBar/>
      <main style={{padding:'16px 16px 100px',maxWidth:760,margin:'0 auto'}}>

        <div className="qp-pill" style={{marginBottom:10}}>
          <BarChart3 size={11}/> Insights
        </div>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',lineHeight:1.1}}>Analytics</h1>
        <p style={{fontSize:12.5,color:'var(--text-muted)',margin:'4px 0 16px',fontWeight:500}}>
          {view === 'teacher' ? 'Performance across your tests' : 'Your test performance'}
        </p>

        {/* View toggle (only show if user can see both) */}
        {isStudent && (
          <div style={{
            display:'flex',padding:4,marginBottom:16,
            background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,
          }}>
            <button type="button" onClick={() => setView('teacher')} style={{
              flex:1,padding:'8px 12px',borderRadius:9,
              background: view === 'teacher' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              border:'none',color: view === 'teacher' ? '#fff' : 'var(--text-secondary)',
              fontSize:12,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5,
            }}>
              <ClipboardList size={13}/> Teacher
            </button>
            <button type="button" onClick={() => setView('student')} style={{
              flex:1,padding:'8px 12px',borderRadius:9,
              background: view === 'student' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              border:'none',color: view === 'student' ? '#fff' : 'var(--text-secondary)',
              fontSize:12,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5,
            }}>
              <Award size={13}/> Student
            </button>
          </div>
        )}

        {view === 'teacher' && (loadingT ? <Loading/> : <TeacherView data={teacher}/>)}
        {view === 'student' && (loadingS ? <Loading/> : isStudent ? <StudentView data={student}/> : <NotStudent/>)}
      </main>
      <BottomNav/>
    </>
  );
}

function Loading() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {[1,2,3].map(i => (
        <div key={i} style={{height:120,borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',animation:'qp-shimmer 1.4s infinite'}}/>
      ))}
      <style>{`@keyframes qp-shimmer { 0%,100% {opacity:1} 50% {opacity:0.5} }`}</style>
    </div>
  );
}

function NotStudent() {
  return (
    <div className="qp-card" style={{padding:'32px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:8,opacity:0.5}}>📊</div>
      <div style={{fontSize:14,fontWeight:700}}>Student view unavailable</div>
      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Your account is not a registered student</div>
    </div>
  );
}

// ─────────── TEACHER VIEW ───────────
function TeacherView({data}: any) {
  const stats = data?.stats || {};
  const activity = data?.activity_14d || [];
  const dist = data?.score_distribution || {};
  const topTests = data?.top_tests || [];
  const weak = data?.weak_questions || [];

  const empty = !stats.total_tests;

  if (empty) {
    return (
      <div className="qp-card" style={{padding:'40px 20px',textAlign:'center'}}>
        <div style={{
          width:60,height:60,borderRadius:18,margin:'0 auto 14px',
          background:'rgba(99,102,241,0.15)',color:'var(--brand)',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          <Sparkles size={28}/>
        </div>
        <div style={{fontSize:15,fontWeight:700}}>No data yet</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6,maxWidth:280,marginInline:'auto',lineHeight:1.45}}>
          Create your first test and watch the analytics light up here. Charts populate after students attempt tests.
        </div>
      </div>
    );
  }

  // Format activity for chart
  const activityData = activity.map((d: any) => ({
    day: new Date(d.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    attempts: Number(d.attempts),
  }));

  // Score distribution as pie
  const distData = [
    { name: '< 40%',  value: Number(dist.b0 || 0), color: COLORS.red },
    { name: '40-60%', value: Number(dist.b1 || 0), color: COLORS.amber },
    { name: '60-75%', value: Number(dist.b2 || 0), color: COLORS.blue },
    { name: '75-90%', value: Number(dist.b3 || 0), color: COLORS.brand },
    { name: '90%+',   value: Number(dist.b4 || 0), color: COLORS.green },
  ].filter(d => d.value > 0);

  return (
    <>
      {/* 4-stat strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
        <BigStat icon={ClipboardList} label="Total Tests" value={stats.total_tests} sub={`${stats.live_tests} live`} color={COLORS.brand}/>
        <BigStat icon={Users} label="Students Reached" value={stats.unique_students} sub={`${stats.total_attempts} attempts`} color={COLORS.brand2}/>
        <BigStat icon={Target} label="Avg Score" value={stats.avg_score != null ? `${stats.avg_score}%` : '—'} sub="across all tests" color={COLORS.green}/>
        <BigStat icon={Library} label="Questions" value={stats.my_questions} sub="in your bank" color={COLORS.amber}/>
      </div>

      {/* Activity chart */}
      {activityData.length > 0 && (
        <ChartCard title="Last 14 Days" icon={Activity} subtitle="Attempts per day">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={activityData} margin={{top:10,right:5,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.4}/>
                  <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="day" stroke="#6a86ab" fontSize={10} tick={{fill:'#6a86ab'}}/>
              <YAxis stroke="#6a86ab" fontSize={10} tick={{fill:'#6a86ab'}} allowDecimals={false}/>
              <Tooltip
                contentStyle={{background:'#0c1424',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}
                labelStyle={{color:'#a0b3d0'}}
              />
              <Line type="monotone" dataKey="attempts" stroke={COLORS.brand} strokeWidth={2.5} dot={{fill:COLORS.brand, r:4}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Score distribution */}
      {distData.length > 0 && (
        <ChartCard title="Score Distribution" icon={BarChart3} subtitle="How students are performing">
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" stroke="none">
                  {distData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#0c1424',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {distData.map(d => (
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11.5}}>
                  <div style={{width:10,height:10,borderRadius:3,background:d.color}}/>
                  <div style={{flex:1,color:'var(--text-secondary)',fontWeight:600}}>{d.name}</div>
                  <div style={{fontWeight:800,color:'var(--text-primary)'}}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      )}

      {/* Top tests */}
      {topTests.length > 0 && (
        <ChartCard title="Top Tests" icon={TrendingUp} subtitle="Most attempted">
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {topTests.map((t: any, i: number) => (
              <div key={t.id} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10,
              }}>
                <div style={{
                  width:28,height:28,borderRadius:8,flexShrink:0,
                  background:`linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brand2})`,color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,
                }}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:1,fontWeight:500}}>
                    {t.subject_name || 'No subject'} · {t.attempt_count} attempts
                  </div>
                </div>
                {t.avg_score != null && (
                  <div style={{
                    padding:'3px 8px',borderRadius:6,fontSize:11,fontWeight:800,
                    background: t.avg_score >= 60 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: t.avg_score >= 60 ? COLORS.green : COLORS.amber,
                  }}>{t.avg_score}%</div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Weak questions */}
      {weak.length > 0 && (
        <ChartCard title="Hardest Questions" icon={AlertTriangle} subtitle="Highest wrong rate (3+ uses)">
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {weak.map((q: any) => (
              <div key={q.id} style={{
                padding:'10px 12px',background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10,
              }}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <span style={{
                    fontSize:10,fontWeight:800,padding:'2px 6px',borderRadius:5,
                    background:'rgba(239,68,68,0.15)',color:COLORS.red,
                  }}>{q.wrong_rate}% wrong</span>
                  <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>{q.times_used} uses</span>
                  {q.subject_name && <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>{q.subject_name}</span>}
                </div>
                <div style={{fontSize:12,color:'var(--text-primary)',lineHeight:1.4,
                  display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                  {q.question_text}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </>
  );
}

// ─────────── STUDENT VIEW ───────────
function StudentView({data}: any) {
  const stats = data?.stats || {};
  const recent = data?.recent_attempts || [];
  const subjects = data?.by_subject || [];
  const trend = data?.score_trend || [];

  const empty = !stats.total_attempts;

  if (empty) {
    return (
      <div className="qp-card" style={{padding:'40px 20px',textAlign:'center'}}>
        <div style={{
          width:60,height:60,borderRadius:18,margin:'0 auto 14px',
          background:'rgba(16,185,129,0.15)',color:COLORS.green,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}><Sparkles size={28}/></div>
        <div style={{fontSize:15,fontWeight:700}}>No attempts yet</div>
        <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6,maxWidth:280,marginInline:'auto',lineHeight:1.45}}>
          Take a test to see your accuracy, score trend, and subject-wise performance here.
        </div>
      </div>
    );
  }

  const totalQ = (Number(stats.total_correct || 0) + Number(stats.total_wrong || 0));
  const accuracy = totalQ > 0 ? Math.round((Number(stats.total_correct) / totalQ) * 100) : 0;

  const trendData = trend.map((t: any, i: number) => ({
    n: `T${i + 1}`,
    score: Number(t.percentage),
    title: t.title,
  }));

  return (
    <>
      {/* Hero — accuracy gauge */}
      <div className="qp-card" style={{
        padding:'20px',marginBottom:14,
        background:`linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))`,
        border:'1px solid rgba(99,102,241,0.25)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{
            width:84,height:84,borderRadius:'50%',flexShrink:0,
            background:`conic-gradient(${COLORS.brand} ${accuracy * 3.6}deg, var(--bg-muted) 0deg)`,
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <div style={{
              width:66,height:66,borderRadius:'50%',background:'var(--bg-base)',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            }}>
              <div style={{fontSize:20,fontWeight:800,color:COLORS.brand,letterSpacing:'-0.03em',lineHeight:1}}>{accuracy}%</div>
              <div style={{fontSize:8,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2}}>Accuracy</div>
            </div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.02em'}}>
              {accuracy >= 75 ? '🔥 On fire!' : accuracy >= 50 ? '👍 Solid progress' : '💪 Keep practising'}
            </div>
            <div style={{fontSize:11.5,color:'var(--text-muted)',marginTop:4,fontWeight:500,lineHeight:1.4}}>
              {Number(stats.total_correct)} correct of {totalQ} questions
            </div>
          </div>
        </div>
      </div>

      {/* 4-stat strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
        <BigStat icon={ClipboardList} label="Attempts" value={stats.total_attempts} sub={`${stats.completed} completed`} color={COLORS.brand}/>
        <BigStat icon={Award} label="Best Score" value={stats.best_score != null ? `${Math.round(Number(stats.best_score))}%` : '—'} sub="personal best" color={COLORS.green}/>
        <BigStat icon={Target} label="Avg Score" value={stats.avg_score != null ? `${stats.avg_score}%` : '—'} sub="overall" color={COLORS.brand2}/>
        <BigStat icon={Activity} label="Streak" value={stats.completed} sub="completed" color={COLORS.amber}/>
      </div>

      {/* Score trend */}
      {trendData.length >= 2 && (
        <ChartCard title="Score Trend" icon={TrendingUp} subtitle={`Last ${trendData.length} attempts`}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{top:10,right:5,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="n" stroke="#6a86ab" fontSize={10} tick={{fill:'#6a86ab'}}/>
              <YAxis domain={[0, 100]} stroke="#6a86ab" fontSize={10} tick={{fill:'#6a86ab'}} unit="%"/>
              <Tooltip
                contentStyle={{background:'#0c1424',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}
                formatter={(v: any) => [`${v}%`, 'Score']}
                labelFormatter={(_, p: any) => p?.[0]?.payload?.title || ''}
              />
              <Line type="monotone" dataKey="score" stroke={COLORS.brand2} strokeWidth={2.5} dot={{fill:COLORS.brand2, r:4}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Subject-wise accuracy */}
      {subjects.length > 0 && (
        <ChartCard title="By Subject" icon={Library} subtitle="Accuracy breakdown">
          <ResponsiveContainer width="100%" height={Math.max(140, subjects.length * 38)}>
            <BarChart data={subjects} layout="vertical" margin={{top:5,right:30,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis type="number" domain={[0, 100]} stroke="#6a86ab" fontSize={10} tick={{fill:'#6a86ab'}} unit="%"/>
              <YAxis type="category" dataKey="subject_name" stroke="#6a86ab" fontSize={11} tick={{fill:'#a0b3d0'}} width={70}/>
              <Tooltip
                contentStyle={{background:'#0c1424',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}}
                formatter={(v: any) => [`${v}%`, 'Accuracy']}
              />
              <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                {subjects.map((s: any, i: number) => (
                  <Cell key={i} fill={s.accuracy >= 75 ? COLORS.green : s.accuracy >= 50 ? COLORS.brand : COLORS.amber}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Recent attempts */}
      {recent.length > 0 && (
        <ChartCard title="Recent Attempts" icon={Activity} subtitle="Last 10">
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {recent.slice(0, 10).map((a: any) => (
              <div key={a.id} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                background:'var(--bg-muted)',border:'1px solid var(--border)',borderRadius:10,
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.test_title}</div>
                  <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:1,fontWeight:500}}>
                    {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : 'in progress'}
                    {a.correct_count != null && ` · ${a.correct_count}/${a.correct_count + a.wrong_count + a.skipped_count}`}
                  </div>
                </div>
                {a.percentage != null && (
                  <div style={{
                    padding:'4px 10px',borderRadius:8,fontSize:13,fontWeight:800,
                    background: a.percentage >= 60 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.percentage >= 60 ? COLORS.green : COLORS.red,
                  }}>{Math.round(Number(a.percentage))}%</div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </>
  );
}

// ─────────── reusable components ───────────
function BigStat({icon:Icon, label, value, sub, color}: any) {
  return (
    <div className="qp-card" style={{padding:'14px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{
          width:30,height:30,borderRadius:9,
          background:`${color}1a`,color,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}><Icon size={15}/></div>
      </div>
      <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.02em',lineHeight:1,color:'var(--text-primary)'}}>{value ?? '—'}</div>
      <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:5,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase'}}>{label}</div>
      {sub && <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:3,fontWeight:500}}>{sub}</div>}
    </div>
  );
}

function ChartCard({title, icon:Icon, subtitle, children}: any) {
  return (
    <div className="qp-card" style={{padding:'14px 14px',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{
          width:28,height:28,borderRadius:8,
          background:'rgba(99,102,241,0.15)',color:COLORS.brand,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}><Icon size={14}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.01em'}}>{title}</div>
          {subtitle && <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:1,fontWeight:500}}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
