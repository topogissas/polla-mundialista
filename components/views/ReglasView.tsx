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
            ['🎯 Marcador exacto', '#1A6B2F', '5 pts'],
            ['📊 Resultado + diferencia', '#27AE60', '3 pts'],
            ['✅ Solo el ganador/empate', '#9CCC65', '1 pt'],
            ['❌ Fallaste', '#cfd8d2', '0 pts'],
          ].map(([label, color, pts]) => (
            <div key={label as string} style={row}><span>{label}</span><span style={tag(color as string)}>{pts}</span></div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: '.82rem', color: '#5a6b5e' }}><b>Eliminatorias valen doble.</b> Un marcador exacto en la final = 10 pts.</p>
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
          1. Cada amigo entra con su nombre y predice.<br />
          2. <b>Cada partido se cierra solo</b> a su hora de inicio: no se puede pronosticar con el juego empezado.<br />
          3. El admin carga el resultado real tras cada partido.<br />
          4. El ranking se recalcula para todos.<br /><br />
          Horas en <b>hora de Colombia (UTC-5)</b>. Los &quot;Repechaje&quot;/&quot;Por definir&quot; se completan cuando FIFA confirme los equipos.
        </p>
      </div>
    </div>
  );
}
