'use client';
import { useRef } from 'react';

export default function LoginModal({ onEntrar }: { onEntrar: (nombre: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div id="loginModal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}
      className="modal">
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 6, color: '#2A398D' }}>¡Bienvenido a la Polla!</h2>
        <p style={{ fontSize: '.85rem', color: '#474A4A', marginBottom: 14 }}>
          Escribe tu nombre para empezar. Si ya entraste antes, usa el mismo nombre para recuperar tus pronósticos.
        </p>
        <input
          ref={inputRef}
          id="nameInput"
          placeholder="Tu nombre (ej. Javier)"
          maxLength={20}
          style={{ width: '100%', padding: 12, border: '2px solid #D5D9EB', borderRadius: 10, fontSize: '.95rem', marginBottom: 10, outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && onEntrar(inputRef.current?.value.trim() || '')}
        />
        <button
          onClick={() => {
            onEntrar(inputRef.current?.value.trim() || '');
            document.getElementById('loginModal')!.classList.remove('show');
          }}
          style={{ display: 'block', width: '100%', padding: 13, background: '#2A398D', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
        >Entrar a la polla</button>
      </div>
      <style>{`.modal.show { display: flex !important; }`}</style>
    </div>
  );
}
