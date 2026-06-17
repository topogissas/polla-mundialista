'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, GRUPOS_LETRAS, inicioPartido, flag, partidoCerrado, fechaColPartido, formatHora } from '@/lib/matches';
import MatchCard from '@/components/MatchCard';
import LiveStats from '@/components/LiveStats';
import type { Resultados } from '@/lib/types';

const FASES = [
  ['todos', 'Todos'], ['grupo', 'Grupos'], ['R32', 'Ronda 32'],
  ['R16', 'Octavos'], ['CF', 'Cuartos'], ['SF', 'Semis'], ['FN', 'Final'],
];

function restanteTexto(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m`;
}

function ProximoPartido({ now }: { now: number }) {
  const { formatoHora } = useApp();
  const proximos = ALL_MATCHES
    .map(m => ({ m, ini: inicioPartido(m) }))
    .filter((x): x is { m: typeof x.m; ini: Date } => x.ini !== null && x.ini.getTime() > now)
    .sort((a, b) => a.ini.getTime() - b.ini.getTime());

  if (!proximos.length) {
    return (
      <div style={{ background: '#EEF0F9', borderRadius: 12, padding: '10px 14px', margin: '12px 0 4px', fontSize: '.82rem', color: '#474A4A', textAlign: 'center' }}>
        No quedan partidos por jugar. ¡Revisa el ranking final! 🏆
      </div>
    );
  }

  const sig = proximos[0];
  const cierran24 = proximos.filter(x => x.ini.getTime() - now <= 24 * 3600000).length;
  const restante = restanteTexto(sig.ini.getTime() - now);

  return (
    <div style={{ background: '#EEF0F9', border: '1px solid #C8CCDE', borderRadius: 12, padding: '10px 14px', margin: '12px 0 4px' }}>
      <div style={{ fontSize: '.72rem', color: '#474A4A', fontWeight: 700, marginBottom: 2 }}>
        ⏳ PRÓXIMO PARTIDO · cierra en {restante}
      </div>
      <div style={{ fontSize: '.92rem', fontWeight: 700, color: '#1A1F3A' }}>
        {flag(sig.m.local)} {sig.m.local} <span style={{ color: '#474A4A' }}>vs</span> {sig.m.visitante} {flag(sig.m.visitante)}
      </div>
      <div style={{ fontSize: '.72rem', color: '#474A4A', marginTop: 2 }}>
        {sig.m.dia} · {formatHora(sig.m.hora, formatoHora)} 🇨🇴
        {cierran24 > 1 && <> · <b>{cierran24}</b> partidos cierran en 24 h</>}
      </div>
    </div>
  );
}

function LiveNow({ now, resultados }: { now: number; resultados: Resultados }) {
  const vivos = ALL_MATCHES
    .map(m => ({ m, ini: inicioPartido(m) }))
    .filter((x): x is { m: typeof x.m; ini: Date } => x.ini !== null)
    .filter(({ ini }) => now >= ini.getTime() && now < ini.getTime() + 120 * 60 * 1000);

  if (!vivos.length) return null;

  return (
    <>
      {vivos.map(({ m }) => {
        const real = resultados[m.id] || { l: null, v: null };
        const tieneR = real.l !== null && real.v !== null;
        return (
          <div key={m.id} style={{ background: '#fff5f5', border: '2px solid #e53935', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#e53935', marginBottom: 6, letterSpacing: '.04em' }}>🔴 EN VIVO AHORA</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{flag(m.local)} {m.local}</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1A1F3A', minWidth: 60, textAlign: 'center' }}>
                {tieneR ? `${real.l} — ${real.v}` : '? — ?'}
              </span>
              <span style={{ fontWeight: 700, fontSize: '.9rem', textAlign: 'right' }}>{m.visitante} {flag(m.visitante)}</span>
            </div>
            <LiveStats m={m} enVivo={true} />
          </div>
        );
      })}
    </>
  );
}

export default function PartidosView({ toast }: { toast: (m: string) => void }) {
  const { usuario, esAdmin, filtroFase, resultados, formatoHora, dispatch } = useApp();
  const [now, setNow] = useState<number>(() => Date.now());

  // Refresca cada minuto: mantiene el contador y los candados de "Cerrado" al día.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!usuario) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A', fontSize: '.9rem' }}>👋 Toca <b>&quot;Entrar&quot;</b> arriba a la derecha para empezar.</div>;
  }

  // ── Vista admin: ve TODOS los partidos (los necesita para cargar resultados) ──
  if (esAdmin) {
    let lista = ALL_MATCHES;
    if (filtroFase === 'grupo') lista = lista.filter(m => m.fase === 'grupo');
    else if (filtroFase !== 'todos') lista = lista.filter(m => m.fase === filtroFase);
    return (
      <div>
        <ProximoPartido now={now} />
        <LiveNow now={now} resultados={resultados} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 4px', WebkitOverflowScrolling: 'touch' as any }}>
          {FASES.map(([f, label]) => (
            <button
              key={f}
              onClick={() => dispatch({ type: 'SET_FILTRO', val: f })}
              style={{
                whiteSpace: 'nowrap', padding: '6px 13px',
                border: `1px solid ${filtroFase === f ? '#3CAC3B' : '#D5D9EB'}`,
                background: filtroFase === f ? '#EEF0F9' : '#fff',
                borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
                color: filtroFase === f ? '#2A398D' : '#474A4A', fontWeight: 600,
              }}
            >{label}</button>
          ))}
        </div>
        {filtroFase === 'grupo' ? (
          GRUPOS_LETRAS.map(g => (
            <div key={g}>
              <div style={{ fontWeight: 800, color: '#2A398D', margin: '16px 0 8px', fontSize: '1rem', paddingLeft: 4, borderLeft: '4px solid #3CAC3B' }}>Grupo {g}</div>
              {lista.filter(m => m.grupo === g).map(m => <MatchCard key={m.id} m={m} />)}
            </div>
          ))
        ) : (
          lista.map(m => <MatchCard key={m.id} m={m} />)
        )}
      </div>
    );
  }

  // ── Vista usuario: todos los partidos de hoy; si no hay, los del próximo día con partidos abiertos ──
  const fmt = (ts: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(ts));
  const hoy = fmt(now);
  const manana = fmt(now + 86400000);

  const todosMapeados = ALL_MATCHES
    .map(m => ({ m, ini: inicioPartido(m), fecha: fechaColPartido(m) }))
    .filter((x): x is { m: typeof x.m; ini: Date; fecha: string } => x.ini !== null && x.fecha !== null)
    .sort((a, b) => a.ini.getTime() - b.ini.getTime());

  // Primero intentamos mostrar todos los de hoy (abiertos Y cerrados)
  const delHoy = todosMapeados.filter(x => x.fecha === hoy).map(x => x.m);

  if (delHoy.length) {
    return (
      <div>
        <ProximoPartido now={now} />
        <LiveNow now={now} resultados={resultados} />
        <div style={{ fontWeight: 800, color: '#2A398D', margin: '16px 0 10px', fontSize: '1.02rem', paddingLeft: 6, borderLeft: '4px solid #3CAC3B' }}>
          📅 Partidos de hoy
        </div>
        {delHoy.map(m => <MatchCard key={m.id} m={m} />)}
        <div style={{ textAlign: 'center', fontSize: '.76rem', color: '#474A4A', marginTop: 14 }}>
          Lo que apostaron todos está en <b>Historial</b> 📜
        </div>
      </div>
    );
  }

  // Si no hay partidos hoy, mostramos los del próximo día con partidos abiertos
  const proximoAbierto = todosMapeados.find(x => !partidoCerrado(x.m));
  if (!proximoAbierto) {
    return (
      <div>
        <ProximoPartido now={now} />
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A', fontSize: '.9rem' }}>
          No hay partidos abiertos para apostar ahora. Mira lo que apostaron todos en <b>Historial</b> 📜
        </div>
      </div>
    );
  }

  const targetFecha = proximoAbierto.fecha;
  const delDia = todosMapeados.filter(x => x.fecha === targetFecha).map(x => x.m);
  const titulo = targetFecha === manana ? '📅 Partidos de mañana' : `📅 Partidos · ${delDia[0].dia}`;

  return (
    <div>
      <ProximoPartido now={now} />
      <div style={{ fontWeight: 800, color: '#2A398D', margin: '16px 0 10px', fontSize: '1.02rem', paddingLeft: 6, borderLeft: '4px solid #3CAC3B' }}>
        {titulo}
      </div>
      {delDia.map(m => <MatchCard key={m.id} m={m} />)}
      <div style={{ textAlign: 'center', fontSize: '.76rem', color: '#474A4A', marginTop: 14 }}>
        Lo que apostaron todos está en <b>Historial</b> 📜
      </div>
    </div>
  );
}
