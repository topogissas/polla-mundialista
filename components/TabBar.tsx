'use client';
import { useApp } from '@/context/AppContext';
import type { Vista } from '@/lib/types';

const TABS: [Vista, string][] = [
  ['partidos', 'Pronósticos'], ['ranking', 'Ranking'],
  ['especiales', 'Especiales'], ['reglas', 'Reglas'],
];

export default function TabBar() {
  const { vista, esAdmin, dispatch } = useApp();
  return (
    <div style={{ display: 'flex', gap: 6, position: 'sticky', top: 0, zIndex: 30, background: '#f4f8f5', padding: '10px 0', borderBottom: '1px solid #dfe8e1' }}>
      {TABS.map(([v, label]) => (
        <button
          key={v}
          onClick={() => dispatch({ type: 'SET_VISTA', val: v })}
          style={{
            flex: 1, padding: '9px 4px', border: 0,
            background: vista === v ? '#1A6B2F' : '#fff',
            color: vista === v ? '#fff' : '#5a6b5e',
            borderRadius: 10, fontWeight: 600, fontSize: '.82rem', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          }}
        >{label}</button>
      ))}
      {esAdmin && (
        <button
          onClick={() => dispatch({ type: 'SET_VISTA', val: 'avisos' })}
          style={{
            flex: 1, padding: '9px 4px', border: 0,
            background: vista === 'avisos' ? '#1A6B2F' : '#fff',
            color: vista === 'avisos' ? '#fff' : '#5a6b5e',
            borderRadius: 10, fontWeight: 600, fontSize: '.82rem', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          }}
        >Avisos</button>
      )}
    </div>
  );
}
