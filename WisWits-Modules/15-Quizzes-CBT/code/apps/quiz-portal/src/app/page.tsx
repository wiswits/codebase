"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Sparkles, Zap, BookOpen, Users, TrendingUp, ArrowUpRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { qp } from "@/lib/api";

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    qp.bank.stats().then(setStats).catch(() => setStats({}));
  }, []);
  return (
    <>
      <TopBar/>
      <main style={{ padding: '20px 16px 100px', maxWidth: 720, margin: '0 auto' }}>

        <div className="qp-pill" style={{ marginBottom: 12 }}>
          <Sparkles size={11}/> Welcome
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Quiz Portal
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 18px', fontWeight: 500 }}>
          Build tests in seconds. Powered by your question bank.
        </p>

        {/* Big CTA */}
        <Link href="/assessment/create" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="qp-tap" style={{
            borderRadius: 20, padding: '20px 22px', marginBottom: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #ec4899 130%)',
            color: '#fff', boxShadow: '0 14px 36px -10px rgba(99,102,241,0.55)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
            <div style={{ position: 'absolute', right: 30, bottom: -40, fontSize: 80, opacity: 0.12 }}>⚡</div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
                <Zap size={12}/> 10-second build
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                Create Test in Seconds
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4, fontWeight: 500 }}>
                Pick subject, chapter, difficulty → done
              </div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                Get started <ArrowUpRight size={14}/>
              </div>
            </div>
          </div>
        </Link>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: "All Questions", v: stats?.questions ?? '—', icon: BookOpen,    color: '#3b82f6' },
            { label: "My Questions", v: stats?.my_questions ?? '—', icon: ClipboardList, color: '#8b5cf6' },
            { label: "Bookmarks",   v: stats?.bookmarks ?? '—', icon: Users,       color: '#f59e0b' },
            { label: "Attempts",    v: stats?.attempts ?? '—', icon: TrendingUp, color: '#10b981' },
          ].map((s,i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="qp-card" style={{ padding: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${s.color}1a`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} strokeWidth={2.2}/>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, padding: '0 2px' }}>
          Quick Start
        </div>
        <div className="qp-card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { label: 'Browse Question Bank', sub: 'Search & filter your questions', href: '/bank' },
            { label: 'Create New Test',      sub: 'Manual or auto-generate',        href: '/assessment/create' },
            { label: 'AI Import Wizard',     sub: 'Convert images via ChatGPT/Gemini', href: '/bank/import' },
            { label: 'View Analytics',       sub: 'Performance insights',           href: '/analytics' },
          ].map((q,i,arr) => (
            <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
              <div className="qp-tap" style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{q.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{q.sub}</div>
                </div>
                <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }}/>
              </div>
            </Link>
          ))}
        </div>

      </main>
      <BottomNav/>
    </>
  );
}
