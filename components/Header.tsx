'use client';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const { usuario } = useApp();
  return (
    <header style={{ background: 'linear-gradient(135deg,#1A6B2F,#27AE60)', color: '#fff', padding: '22px 14px 18px', textAlign: 'center', position: 'relative' }}>
      <h1 style={{ fontSize: '1.4rem', letterSpacing: '.3px' }}>⚽ Polla Mundial 2026</h1>
      <p style={{ opacity: .92, fontSize: '.85rem', marginTop: 3 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#27AE60', marginRight: 5, verticalAlign: 'middle', border: '2px solid rgba(255,255,255,.5)' }} />
        Predice · Gana puntos · Reta a tus amigos
      </p>
      <button
        style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.18)', border: 0, color: '#fff', padding: '6px 12px', borderRadius: 20, fontSize: '.8rem', cursor: 'pointer', fontWeight: 600 }}
        onClick={() => {
          if (usuario) document.getElementById('userMenu')?.classList.add('show');
          else document.getElementById('loginModal')?.classList.add('show');
        }}
      >
        👤 {usuario || 'Entrar'}
      </button>
    </header>
  );
}
