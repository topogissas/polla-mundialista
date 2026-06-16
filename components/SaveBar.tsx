'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SaveBar({ onGuardar }: { onGuardar: () => void }) {
  const { cambios, esAdmin, usuario } = useApp();
  const [confirmar, setConfirmar] = useState(false);
  const [nombre, setNombre] = useState('');
  if (!cambios) return null;

  const nombreOk = nombre.trim().toLowerCase() === (usuario || '').trim().toLowerCase();

  function guardarYcerrar() {
    onGuardar();
    setConfirmar(false);
    setNombre('');
  }

  return (
    <>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #dfe8e1', padding: '12px 14px', zIndex: 40, boxShadow: '0 -2px 10px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: '.78rem', color: '#5a6b5e' }}>
            {esAdmin ? 'Cambios en resultados sin guardar' : 'Tienes apuestas sin guardar'}
          </span>
          <button
            onClick={() => (esAdmin ? onGuardar() : setConfirmar(true))}
            style={{ padding: '11px 22px', background: '#1A6B2F', color: '#fff', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
          >Guardar</button>
        </div>
      </div>

      {confirmar && !esAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 120 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#1A6B2F', marginBottom: 8 }}>Confirmar apuestas</h2>
            <p style={{ fontSize: '.86rem', color: '#5a6b5e', marginBottom: 14 }}>
              Al guardar, tus apuestas quedan <b>bloqueadas</b> y <b>no podrás modificarlas</b>. Escribe tu nombre <b>({usuario})</b> para confirmar:
            </p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && nombreOk && guardarYcerrar()}
              style={{ width: '100%', padding: 12, border: '2px solid #dfe8e1', borderRadius: 10, fontSize: '.95rem', marginBottom: 12, outline: 'none' }}
            />
            <button
              onClick={guardarYcerrar}
              disabled={!nombreOk}
              style={{ display: 'block', width: '100%', padding: 13, background: nombreOk ? '#1A6B2F' : '#b8c7bd', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: nombreOk ? 'pointer' : 'not-allowed', marginBottom: 8 }}
            >Guardar y bloquear</button>
            <button
              onClick={() => { setConfirmar(false); setNombre(''); }}
              style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}
