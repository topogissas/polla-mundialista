'use client';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';

export default function UserMenu({ onSalir }: { onSalir: () => void }) {
  const { usuario, predicciones, resultados } = useApp();

  // Estadísticas del usuario actual, calculadas con lo que ya está en memoria.
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
    <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: '#EDF7EE', borderRadius: 10 }}>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1A6B2F' }}>{val}</div>
      <div style={{ fontSize: '.7rem', color: '#5a6b5e', fontWeight: 600 }}>{label}</div>
    </div>
  );

  const btn = (label: string, onClick: () => void, primary = false) => (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: 13, borderRadius: 12,
        fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginTop: 8,
        background: primary ? '#1A6B2F' : '#fff',
        color: primary ? '#fff' : '#1A6B2F',
        border: primary ? 0 : '1px solid #27AE60',
      }}
    >{label}</button>
  );

  return (
    <div id="userMenu" className="modal"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 4, color: '#1A6B2F' }}>👤 {usuario}</h2>
        <p style={{ fontSize: '.85rem', color: '#5a6b5e', marginBottom: 14 }}>Tu resumen en la polla</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {stat('puntos', total)}
          {stat('exactos', exactos)}
          {stat('jugados', jugados)}
        </div>
        <p style={{ fontSize: '.78rem', color: '#5a6b5e', textAlign: 'center', marginBottom: 8 }}>
          Has pronosticado {hechos} de {ALL_MATCHES.length} partidos.
        </p>

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
