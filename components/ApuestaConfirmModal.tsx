'use client';
import { useEffect, useMemo } from 'react';
import { flag } from '@/lib/matches';

export interface ApuestaGuardada {
  mid: string;
  local: string;
  visitante: string;
  l: number;
  v: number;
}

const CONFETTI_COLORS = ['#2A398D', '#3CAC3B', '#F2C200', '#e53935', '#4FA3F7', '#FF7A00'];

export default function ApuestaConfirmModal({ apuestas, onClose }: { apuestas: ApuestaGuardada[]; onClose: () => void }) {
  // Auto-cierre a los 6 s (además del botón y el toque fuera del recuadro).
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  // Piezas de confeti generadas una sola vez (solo en cliente, sin riesgo de hidratación).
  const confeti = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
      round: Math.random() < 0.3,
    })),
    []
  );

  const varias = apuestas.length > 1;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200, animation: 'fadeIn .2s ease', overflow: 'hidden' }}
    >
      {/* Lluvia de confeti (no intercepta clics) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 210, overflow: 'hidden' }}>
        {confeti.map((c, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${c.left}%`,
              width: c.w,
              height: c.h,
              background: c.color,
              borderRadius: c.round ? '50%' : 2,
              animation: `confettiFall ${c.duration}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 220, background: '#fff', borderRadius: 20, padding: '26px 22px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,.32)', animation: 'popIn .38s cubic-bezier(.18,.89,.32,1.28)' }}
      >
        <div style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: 6 }}>🎉</div>
        <h2 style={{ fontSize: '1.18rem', color: '#2A398D', fontWeight: 800, margin: '0 0 4px' }}>¡Apuesta registrada!</h2>
        <p style={{ fontSize: '.78rem', color: '#6b7280', margin: '0 0 16px' }}>
          {varias ? `${apuestas.length} marcadores guardados y bloqueados 🔒` : 'Tu marcador quedó guardado y bloqueado 🔒'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, maxHeight: 320, overflowY: 'auto' }}>
          {apuestas.map(a => (
            <div key={a.mid} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#EEF0F9,#f7f8fd)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '.82rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{flag(a.local)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.local}</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.18rem', color: '#2A398D', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                {a.l} <span style={{ color: '#b8c0e0' }}>-</span> {a.v}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '.82rem', flexDirection: 'row-reverse', minWidth: 0 }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{flag(a.visitante)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.visitante}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', padding: 13, background: '#2A398D', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
        >¡Listo! 🔒</button>
      </div>
    </div>
  );
}
