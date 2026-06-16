export default function ReglasView() {
  const card = { background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', fontSize: '.85rem' } as React.CSSProperties;
  const h3 = { color: '#1A6B2F', fontSize: '.95rem', marginBottom: 8 } as React.CSSProperties;
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #dfe8e1' } as React.CSSProperties;
  const tag = (bg: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 6, color: '#fff', fontSize: '.72rem', fontWeight: 700, background: bg }) as React.CSSProperties;
  return (
    <div style={{ paddingTop: 12 }}>
      <div style={card}>
        <h3 style={h3}>📋 Cómo se gana puntos</h3>
        <div>
          {[
            ['🎯 Marcador exacto', '#1A6B2F', '25 pts'],
            ['✅ Acertaste el ganador (o empate)', '#27AE60', '15 pts'],
            ['❌ Fallaste', '#cfd8d2', '0 pts'],
          ].map(([label, color, pts]) => (
            <div key={label as string} style={row}><span>{label}</span><span style={tag(color as string)}>{pts}</span></div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: '.82rem', color: '#5a6b5e' }}>Mismo puntaje en <b>todas las fases</b>.</p>
      </div>
      <div style={card}>
        <h3 style={h3}>⭐ Especiales (al final)</h3>
        <div>
          {[['🥇 Campeón', '#D4A017', '10 pts'], ['🥈 Subcampeón', '#D4A017', '5 pts'], ['👟 Más goleadora', '#D4A017', '5 pts']].map(([l, c, p]) => (
            <div key={l as string} style={row}><span>{l}</span><span style={tag(c as string)}>{p}</span></div>
          ))}
        </div>
      </div>
      <div style={card}>
        <h3 style={h3}>ℹ️ Cómo funciona</h3>
        <p style={{ fontSize: '.85rem', color: '#5a6b5e' }}>
          1. Cada amigo entra con su nombre y apuesta.<br />
          2. Al <b>Guardar</b> confirmas con tu nombre y tus apuestas quedan <b>bloqueadas</b> (una sola apuesta por partido, sin cambios).<br />
          3. Puedes apostar hasta <b>30 minutos antes</b> de cada partido; luego se cierra.<br />
          4. El admin carga el resultado real tras cada partido y el ranking se recalcula para todos.<br /><br />
          Horas en <b>hora de Colombia (UTC-5)</b>. Los &quot;Repechaje&quot;/&quot;Por definir&quot; se completan cuando FIFA confirme los equipos.
        </p>
      </div>
    </div>
  );
}
