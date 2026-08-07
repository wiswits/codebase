"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const dragStart = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let el = document.getElementById('qp-sheet-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qp-sheet-root';
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
      document.body.style.overflow = 'hidden';
    } else {
      setShow(false);
      document.body.style.overflow = '';
      const t = setTimeout(() => setMounted(false), 420);
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const onGrabStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
    dragDelta.current = 0;
  };
  const onGrabMove = (e: React.TouchEvent) => {
    if (dragStart.current === null || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragStart.current;
    if (dy > 0) {
      dragDelta.current = dy;
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };
  const onGrabEnd = () => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = '';
    if (dragDelta.current > 160) onClose();
    else sheetRef.current.style.transform = '';
    dragStart.current = null;
    dragDelta.current = 0;
  };

  if (!mounted || !portalEl) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position:'fixed',inset:0,zIndex:2147483000,
          background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(14px)',
          WebkitBackdropFilter:'blur(14px)',
          opacity: show ? 1 : 0,
          pointerEvents: show ? 'auto' : 'none',
          transition:'opacity 0.3s ease',
        }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        style={{
          position:'fixed',left:0,right:0,bottom:0,zIndex:2147483001,
          background:'var(--bg-card)',
          borderTopLeftRadius:24,borderTopRightRadius:24,
          height:'88dvh',display:'flex',flexDirection:'column',
          boxShadow:'0 -24px 60px -8px rgba(0,0,0,0.6)',
          transform: show ? 'translateY(0)' : 'translateY(100%)',
          transition:'transform 0.4s cubic-bezier(.32,.72,.26,1)',
          overflow:'hidden',
        }}
      >
        <div
          onTouchStart={onGrabStart}
          onTouchMove={onGrabMove}
          onTouchEnd={onGrabEnd}
          style={{width:44,height:5,borderRadius:99,background:'var(--border-strong)',margin:'12px auto 0',flexShrink:0,touchAction:'none'}}
        />
        {title && (
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'14px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,
          }}>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.02em'}}>{title}</div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width:34,height:34,borderRadius:10,border:'none',
                background:'var(--bg-muted)',color:'var(--text-muted)',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',padding:0,
              }}
              aria-label="Close"
            >
              <X size={18}/>
            </button>
          </div>
        )}
        <div style={{
          flex:'1 1 auto',overflowY:'auto',overflowX:'hidden',
          WebkitOverflowScrolling:'touch',padding:'18px 20px 40px',
          overscrollBehavior:'contain',
        }}>
          {children}
        </div>
      </div>
    </>,
    portalEl
  );
}
