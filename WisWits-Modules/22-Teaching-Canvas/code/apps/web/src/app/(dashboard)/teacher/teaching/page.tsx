"use client";
import Link from "next/link";
import { School, GraduationCap, CalendarCheck, Calendar, Video, Beaker, Rocket, BookOpen } from "lucide-react";
import { ModulePage } from "@/components/module-kit/ModulePage";

const tiles = [
  { label:"My Classes",    sub:"All sections",      href:"/teacher/classes",     icon:School,         color:"#0F2147" },
  { label:"My Students",   sub:"Roster & contacts", href:"/teacher/students",    icon:GraduationCap,  color:"#0F2147" },
  { label:"Attendance",    sub:"Mark daily",        href:"/teacher/attendance",  icon:CalendarCheck,  color:"#0F2147" },
  { label:"Timetable",     sub:"Weekly schedule",   href:"/teacher/timetable",   icon:Calendar,       color:"#0F2147" },
  { label:"Teaching Mode", sub:"Live tools",        href:null,                   icon:Rocket,         color:"#0F2147", badge:"SOON" },
  { label:"My Content",    sub:"Videos & files",    href:"/teacher/content",     icon:Video,          color:"#0F2147" },
  { label:"Simulations",   sub:"Science demos",     href:"/teacher/simulations", icon:Beaker,         color:"#0F2147" },
] as { label:string; sub:string; href:string|null; icon:any; color:string; badge?:string }[];

export default function TeachingHub() {
  return (
    <ModulePage
      title="Teaching"
      subtitle="Classes, students, and daily tools"
      icon={BookOpen}
    >
      {/* 2-column tile grid — premium cards with colored accent bars */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
        {tiles.map(t => {
          const Icon = t.icon;
          const card = (
            <div className="ww-card" title={t.href ? undefined : "Coming soon"}
              style={{padding:14,minHeight:116,position:'relative',overflow:'hidden',opacity:t.href?1:0.55,cursor:t.href?'pointer':'not-allowed'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:t.color,borderRadius:'3px 0 0 3px'}}/>
              <div style={{
                width:38,height:38,borderRadius:11,marginBottom:10,
                background:`${t.color}1a`,color:t.color,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <Icon size={18} strokeWidth={2}/>
              </div>
              <div style={{fontSize:13.5,fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.01em',display:'flex',alignItems:'center',gap:6}}>
                {t.label}
                {t.badge && <span style={{fontSize:8.5,fontWeight:800,padding:'2px 5px',borderRadius:5,background:t.color,color:'#fff',letterSpacing:'0.04em'}}>{t.badge}</span>}
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,fontWeight:500}}>{t.sub}</div>
            </div>
          );
          return t.href
            ? <Link key={t.label} href={t.href} style={{textDecoration:'none'}}>{card}</Link>
            : <div key={t.label}>{card}</div>;
        })}
      </div>
    </ModulePage>
  );
}
