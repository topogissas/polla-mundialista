'use client';
import { useApp } from '@/context/AppContext';

export default function SaveBar({ onGuardar }: { onGuardar: () => void }) {
  const { cambios, esAdmin } = useApp();
  if (!cambios) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #dfe8e1', padding: '12px 14px', zIndex: 40, boxShadow: '0 -2px 10px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ flex: 1, fontSize: '.78rem', color: '#5a6b5e' }}>
          {esAdmin ? 'Cambios en resultados sin guardar' : 'Tienes cambios sin guardar'}
        </span>
        <button
          onClick={onGuardar}
          style={{ padding: '11px 22px', background: '#1A6B2F', color: '#fff', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
        >Guardar</button>
      </div>
    </div>
  );
}
