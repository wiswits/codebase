"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogIn, Search, Building2 } from "lucide-react";

export default function LoginPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/dev-login/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setFiltered(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = search.toLowerCase().trim();
    if (!s) setFiltered(users);
    else setFiltered(users.filter(u =>
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.org_name || '').toLowerCase().includes(s) ||
      (u.role_slug || '').toLowerCase().includes(s)
    ));
  }, [search, users]);

  const signIn = async (uid: number) => {
    setSigningIn(uid);
    try {
      const r = await fetch('/api/dev-login/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid }),
      });
      const d = await r.json();
      if (d.token) {
        localStorage.setItem('wiswits_token', d.token);
        localStorage.setItem('wiswits_user', JSON.stringify(d.user));
        router.push('/');
      } else {
        alert('Login failed');
        setSigningIn(null);
      }
    } catch (e) {
      alert('Network error');
      setSigningIn(null);
    }
  };

  // Group users by org
  const grouped: Record<string, any[]> = {};
  filtered.forEach(u => {
    const k = u.org_name || 'Unknown';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(u);
  });

  return (
    <main style={{minHeight:'100vh',display:'flex',flexDirection:'column',padding:'40px 20px 60px',maxWidth:520,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:30}}>
        <div style={{
          width:64,height:64,borderRadius:18,margin:'0 auto 16px',
          background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 12px 32px -8px rgba(99,102,241,0.6)',
        }}>
          <Sparkles size={28} color="#fff"/>
        </div>
        <h1 style={{fontSize:30,fontWeight:800,margin:0,letterSpacing:'-0.03em'}}>Welcome back</h1>
        <p style={{fontSize:13.5,color:'var(--text-muted)',margin:'6px 0 0',fontWeight:500}}>Sign in to WISWITS Quiz Portal</p>
      </div>

      <div style={{position:'relative',marginBottom:18}}>
        <Search size={15} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or school..."
          style={{
            width:'100%',padding:'13px 14px 13px 38px',
            background:'var(--bg-card)',border:'1px solid var(--border)',
            borderRadius:14,color:'var(--text-primary)',
            fontSize:14,fontWeight:500,outline:'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'var(--text-muted)',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16}}>
          No users found
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {Object.entries(grouped).map(([org, list]) => (
            <div key={org}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,padding:'0 4px',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.06em',textTransform:'uppercase'}}>
                <Building2 size={11}/> {org}
              </div>
              <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
                {list.map((u, i) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={signingIn !== null}
                    onClick={() => signIn(u.id)}
                    style={{
                      width:'100%',padding:'12px 14px',background:'transparent',border:'none',
                      borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
                      color:'var(--text-primary)',cursor:signingIn === null ? 'pointer' : 'wait',
                      display:'flex',alignItems:'center',gap:12,textAlign:'left',
                      opacity: signingIn !== null && signingIn !== u.id ? 0.4 : 1,
                      transition:'background 0.15s, opacity 0.2s',
                    }}
                    onMouseEnter={el => (el.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width:38,height:38,borderRadius:12,flexShrink:0,
                      background: u.role_slug === 'super_admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:800,color:'#fff',
                    }}>
                      {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {u.first_name} {u.last_name || ''}
                        <span style={{
                          fontSize:9.5,fontWeight:700,marginLeft:8,padding:'2px 7px',borderRadius:5,
                          background: u.role_slug === 'super_admin' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                          color: u.role_slug === 'super_admin' ? '#f59e0b' : '#8b5cf6',
                          letterSpacing:'0.04em',textTransform:'uppercase',
                        }}>{u.role_slug}</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {u.email}
                      </div>
                    </div>
                    {signingIn === u.id ? (
                      <div style={{fontSize:11,color:'var(--brand)',fontWeight:700}}>Signing in…</div>
                    ) : (
                      <LogIn size={15} style={{color:'var(--text-muted)',flexShrink:0,opacity:0.6}}/>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{textAlign:'center',marginTop:30,fontSize:11,color:'var(--text-muted)',fontWeight:500}}>
        🔐 Pre-launch testing mode · Real auth coming soon
      </div>
    </main>
  );
}
