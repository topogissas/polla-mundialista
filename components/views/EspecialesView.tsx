'use client';
import { useApp } from '@/context/AppContext';
import { sb } from '@/lib/supabase';
import { SELECCIONES, flag } from '@/lib/matches';

export default function EspecialesView({ toast }: { toast: (m: string) => void }) {
  const { usuario, participanteId, grupoId, especiales, dispatch } = useApp();
  if (!usuario) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Entra primero para elegir tus especiales.</div>;
  if (!grupoId) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Selecciona un grupo para guardar tus especiales.</div>;

  const opts = SELECCIONES.map(s => <option key={s} value={s}>{flag(s)} {s}</option>);

  async function guardar() {
    const campeon = (document.getElementById('esp-campeon') as HTMLSelectElement).value || null;
    const subcampeon = (document.getElementById('esp-subcampeon') as HTMLSelectElement).value || null;
    const goleador = (document.getElementById('esp-goleador') as HTMLSelectElement).value || null;
    const { error } = await sb.from('polla_especiales').upsert(
      { participante_id: participanteId, grupo_id: grupoId, campeon, subcampeon, goleador, actualizado_en: new Date().toISOString() },
      { onConflict: 'participante_id,grupo_id' }
    );
    if (error) { toast('Error: ' + error.message); return; }
    dispatch({ type: 'SET_ESPECIALES', data: { campeon, subcampeon, goleador } });
    toast('✅ Especiales guardados');
  }

  const cardStyle = { background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
  const selectStyle = { width: '100%', padding: 10, border: '2px solid #D5D9EB', borderRadius: 10, fontSize: '.9rem' };

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ ...cardStyle, background: '#EEF0F9' }}>
        <h3 style={{ color: '#2A398D', fontSize: '.95rem', marginBottom: 8 }}>🏆 Pronósticos especiales</h3>
        <p style={{ fontSize: '.82rem', color: '#474A4A' }}>Elige antes de que arranque el Mundial. Cada acierto vale puntos extra al final.</p>
      </div>
      <div style={cardStyle}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '.85rem', marginBottom: 6 }}>🥇 Campeón (10 pts)</label>
        <select id="esp-campeon" defaultValue={especiales.campeon || ''} style={selectStyle}>
          <option value="">— Elige —</option>{opts}
        </select>
      </div>
      <div style={cardStyle}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '.85rem', marginBottom: 6 }}>🥈 Subcampeón (5 pts)</label>
        <select id="esp-subcampeon" defaultValue={especiales.subcampeon || ''} style={selectStyle}>
          <option value="">— Elige —</option>{opts}
        </select>
      </div>
      <div style={cardStyle}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '.85rem', marginBottom: 6 }}>👟 Selección más goleadora (5 pts)</label>
        <select id="esp-goleador" defaultValue={especiales.goleador || ''} style={selectStyle}>
          <option value="">— Elige —</option>{opts}
        </select>
      </div>
      <button onClick={guardar} style={{ display: 'block', width: '100%', padding: 13, background: '#2A398D', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Guardar especiales</button>
    </div>
  );
}
