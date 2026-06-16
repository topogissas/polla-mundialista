'use client';
import { useRef } from 'react';
import { useApp } from '@/context/AppContext';

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'topogis2026';

export default function AdminModal({ toast }: { toast: (m: string) => void }) {
  const passRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useApp();
  function validar() {
    if (passRef.current?.value === ADMIN_PASS) {
      dispatch({ type: 'SET_ADMIN', val: true });
      document.getElementById('adminModal')!.classList.remove('show');
      toast('Modo administrador activo');
    } else {
      toast('Clave incorrecta');
    }
  }
  return (
    <div id="adminModal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}
      className="modal">
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 6, color: '#1A6B2F' }}>Modo administrador</h2>
        <p style={{ fontSize: '.85rem', color: '#5a6b5e', marginBottom: 14 }}>Escribe la clave para cargar los resultados reales.</p>
        <input
          ref={passRef}
          type="password"
          placeholder="Clave de administrador"
          style={{ width: '100%', padding: 12, border: '2px solid #dfe8e1', borderRadius: 10, fontSize: '.95rem', marginBottom: 10, outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && validar()}
        />
        <button onClick={validar} style={{ display: 'block', width: '100%', padding: 13, background: '#1A6B2F', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Activar</button>
        <button onClick={() => { document.getElementById('adminModal')!.classList.remove('show'); }} style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
      </div>
      <style>{`.modal.show { display: flex !important; }`}</style>
    </div>
  );
}
