"use client";
import { Bell, Sparkles, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { qp } from "@/lib/api";

export default function TopBar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(qp.auth.user()); }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const initials = user ? (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase() : '?';

  return (
    <header style={{
      position:'sticky',top:0,zIndex:50,
      background:'rgba(7,11,20,0.85)',
      backdropFilter:'blur(16px)',
      WebkitBackdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--border)',
      padding:'12px 16px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
    }}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
        <div style={{
          width:36,height:36,borderRadius:11,
          background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 6px 14px -4px rgba(99,102,241,0.5)',
        }}>
          <Sparkles size={18} color="#fff"/>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.01em'}}>WISWITS Quiz</div>
          <div style={{fontSize:9.5,color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:-1}}>Portal</div>
        </div>
      </Link>

      <div style={{display:'flex',alignItems:'center',gap:8}} ref={menuRef}>
        <button type="button" style={{
          width:38,height:38,borderRadius:11,
          background:'var(--bg-card)',border:'1px solid var(--border)',
          color:'var(--text-secondary)',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          <Bell size={17}/>
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display:'flex',alignItems:'center',gap:5,padding:'4px 8px 4px 4px',
            background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11,
            cursor:'pointer',color:'var(--text-primary)',
          }}
        >
          <div style={{
            width:30,height:30,borderRadius:9,
            background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:12,fontWeight:800,color:'#fff',
          }}>{initials}</div>
          <ChevronDown size={13} style={{color:'var(--text-muted)'}}/>
        </button>

        {menuOpen && user && (
          <div style={{
            position:'absolute',top:60,right:16,
            background:'var(--bg-card)',border:'1px solid var(--border)',
            borderRadius:14,minWidth:240,
            boxShadow:'0 16px 40px -8px rgba(0,0,0,0.6)',
            overflow:'hidden',zIndex:60,
          }}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:13,fontWeight:700}}>{user.first_name} {user.last_name || ''}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{user.email}</div>
              <div style={{
                marginTop:6,fontSize:9.5,fontWeight:700,padding:'2px 7px',borderRadius:5,
                background: user.role_slug === 'super_admin' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                color: user.role_slug === 'super_admin' ? '#f59e0b' : '#8b5cf6',
                display:'inline-block',letterSpacing:'0.04em',textTransform:'uppercase',
              }}>{user.role_slug}</div>
            </div>
            <button
              type="button"
              onClick={qp.auth.logout}
              style={{
                width:'100%',padding:'12px 14px',background:'transparent',border:'none',
                color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:8,
                fontSize:13,fontWeight:600,
              }}
              onMouseEnter={el => (el.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14}/> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
