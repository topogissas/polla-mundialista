'use client';
import { ALL_MATCHES, inicioPartido, flag } from '@/lib/matches';
import type { Match } from '@/lib/types';

const POLLA_URL = process.env.NEXT_PUBLIC_POLLA_URL || '';

function partidosEnVentana(desdeH: number, hastaH: number) {
  const ahora = Date.now();
  return ALL_MATCHES
    .map(m => ({ m, ini: inicioPartido(m) }))
    .filter(x => x.ini !== null)
    .filter(x => { const diff = (x.ini!.getTime() - ahora) / 3600000; return diff >= desdeH && diff <= hastaH; })
    .sort((a, b) => a.ini!.getTime() - b.ini!.getTime());
}

function armarMensaje(titulo: string, arr: { m: Match }[]) {
  const lista = arr.map(x => `• ${x.m.hora} — ${flag(x.m.local)} ${x.m.local} vs ${x.m.visitante} ${flag(x.m.visitante)}`).join('\n');
  let txt = `⚽ *POLLA MUNDIAL 2026* ⚽\n\n${titulo}\n\n${lista}\n\n👉 No olvides hacer tus pronósticos antes de que empiece cada partido.`;
  if (POLLA_URL) txt += `\n\n🔗 ${POLLA_URL}`;
  txt += '\n\n_(horas en hora de Colombia)_';
  return txt;
}

function Bloque({ titulo, arr, etiqueta }: { titulo: string; arr: { m: Match }[]; etiqueta: string }) {
  const msg = armarMensaje(etiqueta, arr);
  if (!arr.length) return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <h3 style={{ color: '#1A6B2F', fontSize: '.95rem', marginBottom: 8 }}>{titulo}</h3>
      <p style={{ color: '#5a6b5e', fontSize: '.85rem' }}>No hay partidos en esta ventana.</p>
    </div>
  );
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <h3 style={{ color: '#1A6B2F', fontSize: '.95rem', marginBottom: 8 }}>{titulo}</h3>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '.82rem', background: '#EDF7EE', padding: 10, borderRadius: 8, color: '#16271c', marginBottom: 10 }}>{msg}</pre>
      <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')}
        style={{ display: 'block', width: '100%', padding: 13, background: '#1A6B2F', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
        📲 Abrir WhatsApp con este mensaje
      </button>
      <button onClick={() => navigator.clipboard.writeText(msg).catch(() => {})}
        style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}>
        📋 Copiar mensaje
      </button>
    </div>
  );
}

export default function AvisosView() {
  const prox3 = partidosEnVentana(0, 3);
  const hoy = partidosEnVentana(0, 12);
  const manana = partidosEnVentana(12, 36);
  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ background: '#EDF7EE', borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <h3 style={{ color: '#1A6B2F', fontSize: '.95rem', marginBottom: 8 }}>📣 Recordatorios por WhatsApp</h3>
        <p style={{ fontSize: '.82rem', color: '#5a6b5e' }}>
          Elige una franja, toca <b>Abrir WhatsApp</b>, selecciona tu grupo y envía.
          {!POLLA_URL && <><br /><br />⚠️ <b>Tip:</b> cuando subas la polla, pon el link en la variable <code>NEXT_PUBLIC_POLLA_URL</code> para que se incluya en los avisos.</>}
        </p>
      </div>
      <Bloque titulo="⏰ Próximas 3 horas" arr={prox3} etiqueta="Partidos en las próximas horas:" />
      <Bloque titulo="📅 Hoy (próximas 12 h)" arr={hoy} etiqueta="Partidos de hoy:" />
      <Bloque titulo="🗓️ Mañana" arr={manana} etiqueta="Partidos de mañana:" />
    </div>
  );
}
