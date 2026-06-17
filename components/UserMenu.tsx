'use client';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';

export default function UserMenu({ onSalir }: { onSalir: () => void }) {
  const { usuario, predicciones, resultados, esAdmin, formatoHora, dispatch } = useApp();

  let total = 0, exactos = 0, jugados = 0, hechos = 0;
  ALL_MATCHES.forEach(m => {
    const pred = predicciones[m.id];
    if (pred && pred.l !== null && pred.v !== null) hechos++;
    const real = resultados[m.id];
    if (real && real.l !== null && real.v !== null && pred && pred.l !== null && pred.v !== null) {
      const pts = calcularPuntos(pred, real, m.fase);
      if (pts !== null) {
        total += pts;
        jugados++;
        const mult = m.fase === 'grupo' ? 1 : 2;
        if (pts >= 5 * mult) exactos++;
      }
    }
  });

  function cerrar() {
    document.getElementById('userMenu')!.classList.remove('show');
  }

  const stat = (label: string, val: number | string) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: '#EEF0F9', borderRadius: 10 }}>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#2A398D' }}>{val}</div>
      <div style={{ fontSize: '.7rem', color: '#474A4A', fontWeight: 600 }}>{label}</div>
    </div>
  );

  const btn = (label: string, onClick: () => void, primary = false, danger = false) => (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: 13, borderRadius: 12,
        fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginTop: 8,
        background: danger ? '#fff0f0' : primary ? '#2A398D' : '#fff',
        color: danger ? '#c0392b' : primary ? '#fff' : '#2A398D',
        border: danger ? '1px solid #f5a5a5' : primary ? 'none' : '1px solid #3CAC3B',
      }}
    >{label}</button>
  );

  return (
    <div id="userMenu" className="modal"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 4, color: '#2A398D' }}>👤 {usuario}</h2>
        <p style={{ fontSize: '.85rem', color: '#474A4A', marginBottom: 14 }}>Tu resumen en la polla</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {stat('puntos', total)}
          {stat('exactos', exactos)}
          {stat('jugados', jugados)}
        </div>
        <p style={{ fontSize: '.78rem', color: '#474A4A', textAlign: 'center', marginBottom: 14 }}>
          Has pronosticado {hechos} de {ALL_MATCHES.length} partidos.
        </p>

        {/* Formato de hora */}
        <div style={{ background: '#F4F6FB', borderRadius: 12, padding: '10px 14px', marginBottom: 4 }}>
          <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#474A4A', marginBottom: 8 }}>🕐 Formato de hora</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['24h', '12h'] as const).map(f => (
              <button
                key={f}
                onClick={() => dispatch({ type: 'SET_FORMATO_HORA', val: f })}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontWeight: 700, fontSize: '.88rem',
                  cursor: 'pointer',
                  background: formatoHora === f ? '#2A398D' : '#fff',
                  color: formatoHora === f ? '#fff' : '#474A4A',
                  border: formatoHora === f ? 'none' : '1px solid #D5D9EB',
                }}
              >{f === '24h' ? '24h (15:00)' : '12h (3:00 PM)'}</button>
            ))}
          </div>
        </div>

        {/* Administrador */}
        {esAdmin
          ? btn('✅ Admin ACTIVO — desactivar', () => {
              cerrar();
              dispatch({ type: 'SET_ADMIN', val: false });
            }, false, true)
          : btn('🔧 Modo administrador', () => {
              cerrar();
              document.getElementById('adminModal')?.classList.add('show');
            })
        }

        {btn('🔄 Cambiar de usuario', () => {
          cerrar();
          const inp = document.getElementById('nameInput') as HTMLInputElement | null;
          if (inp) inp.value = usuario || '';
          document.getElementById('loginModal')!.classList.add('show');
        })}
        {btn('🚪 Salir', () => { cerrar(); onSalir(); })}
        {btn('Cerrar', cerrar, true)}
      </div>
      <style>{`.modal.show { display: flex !important; }`}</style>
    </div>
  );
}
