'use client';
import { useApp } from '@/context/AppContext';
import type { Vista } from '@/lib/types';

const TABS: [Vista, string][] = [
  ['partidos', 'Hoy'], ['calendario', 'Todos'], ['ranking', 'Ranking'],
  ['apuestas', 'Historial'], ['reglas', 'Reglas'], ['avisos', 'Avisos'],
];

export default function TabBar() {
  const { vista, dispatch } = useApp();
  return (
    <div style={{ display: 'flex', gap: 4, position: 'sticky', top: 0, zIndex: 30, background: '#F4F6FB', padding: '10px 0', borderBottom: '1px solid #D5D9EB' }}>
      {TABS.map(([v, label]) => (
        <button
          key={v}
          onClick={() => dispatch({ type: 'SET_VISTA', val: v })}
          style={{
            flex: 1, padding: '9px 1px', border: 0,
            background: vista === v ? '#2A398D' : '#fff',
            color: vista === v ? '#fff' : '#474A4A',
            borderRadius: 9, fontWeight: 600, fontSize: '.68rem', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          }}
        >{label}</button>
      ))}
    </div>
  );
}
