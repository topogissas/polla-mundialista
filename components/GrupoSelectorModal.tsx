'use client';
import { useApp } from '@/context/AppContext';
import type { Grupo } from '@/lib/types';

interface Props {
  onSeleccionar: (grupo: Grupo) => void;
}

export default function GrupoSelectorModal({ onSeleccionar }: Props) {
  const { grupos } = useApp();
  const activos = grupos.filter(g => (g as any).estado === 'activo');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#2A398D', marginBottom: 6 }}>🏆 ¿En qué grupo vas a jugar?</h2>
        <p style={{ fontSize: '.83rem', color: '#474A4A', marginBottom: 18 }}>Estás en varios grupos. Elige uno para ver su ranking y apostar.</p>
        {activos.map(g => (
          <button
            key={g.id}
            onClick={() => onSeleccionar(g)}
            style={{
              display: 'block', width: '100%', padding: '14px 16px',
              marginBottom: 8, textAlign: 'left',
              background: '#EEF0F9', border: '2px solid #D5D9EB',
              borderRadius: 12, cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, color: '#2A398D', fontSize: '.95rem' }}>{g.nombre}</div>
            {g.descripcion && <div style={{ fontSize: '.75rem', color: '#474A4A', marginTop: 2 }}>{g.descripcion}</div>}
            <div style={{ fontSize: '.72rem', color: '#3CAC3B', marginTop: 2, fontWeight: 600 }}>Código: {g.codigo}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
