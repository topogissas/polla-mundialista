'use client';
import { useEffect, useState } from 'react';
import type { Match } from '@/lib/types';
import { inicioPartido } from '@/lib/matches';

const ES_EN: Record<string, string> = {
  'Argelia': 'Algeria', 'Francia': 'France', 'Noruega': 'Norway', 'Irak': 'Iraq',
  'Jordania': 'Jordan', 'Panamá': 'Panama', 'Uzbekistán': 'Uzbekistan',
  'México': 'Mexico', 'Sudáfrica': 'South Africa', 'Corea del Sur': 'South Korea',
  'Canadá': 'Canada', 'Catar': 'Qatar', 'Suiza': 'Switzerland', 'Brasil': 'Brazil',
  'Marruecos': 'Morocco', 'Escocia': 'Scotland', 'Haití': 'Haiti',
  'Países Bajos': 'Netherlands', 'Japón': 'Japan', 'Túnez': 'Tunisia',
  'Bélgica': 'Belgium', 'Irán': 'Iran', 'Egipto': 'Egypt', 'España': 'Spain',
  'Arabia Saudita': 'Saudi Arabia', 'Cabo Verde': 'Cape Verde',
  'Alemania': 'Germany', 'Curazao': 'Curacao', 'Ecuador': 'Ecuador',
  'Costa de Marfil': 'Ivory Coast', 'Nueva Zelanda': 'New Zealand',
  'Bosnia y Herzegovina': 'Bosnia', 'Chequia': 'Czech Republic',
  'Turquía': 'Turkey', 'Suecia': 'Sweden', 'RD Congo': 'DR Congo',
};

const STAT_ES: Record<string, string> = {
  'Ball Possession': 'Posesión %', 'Shots on Goal': 'Al arco',
  'Total Shots': 'Tiros', 'Yellow Cards': 'Amarillas',
  'Red Cards': 'Rojas', 'Fouls': 'Faltas', 'Corners': 'Córneres',
  'Offsides': 'Fuera de lugar', 'Saves': 'Atajadas',
};

const KEY_STATS = ['Ball Possession', 'Shots on Goal', 'Total Shots', 'Yellow Cards', 'Red Cards', 'Fouls', 'Corners'];

interface Stat { strStat: string; intHome: string; intAway: string; }

export default function LiveStats({ m, enVivo }: { m: Match; enVivo: boolean }) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const ini = inicioPartido(m);
        if (!ini) return;
        const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ini);
        const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${d}&s=Soccer`);
        const dayData = await r.json();
        const events: any[] = dayData.events || [];

        const homeEn = ES_EN[m.local] || m.local;
        const awayEn = ES_EN[m.visitante] || m.visitante;
        const ev = events.find(e =>
          e.strLeague === 'FIFA World Cup' && (
            (e.strHomeTeam === homeEn && e.strAwayTeam === awayEn) ||
            (e.strHomeTeam === m.local && e.strAwayTeam === m.visitante)
          )
        );

        if (!ev || cancelled) return;
        const sr = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupeventstats.php?id=${ev.idEvent}`);
        const sd = await sr.json();
        if (!cancelled) setStats(sd.eventstats || []);
      } catch { } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    if (!enVivo) return;
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [m, enVivo, open]);

  const filtered = stats.filter(s => KEY_STATS.includes(s.strStat));

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', background: 'none', border: '1px solid #dfe8e1', borderRadius: 8, padding: '5px 0', fontSize: '.7rem', color: '#5a6b5e', fontWeight: 600, cursor: 'pointer' }}
      >
        {open ? '▲' : '▼'} Estadísticas
      </button>
      {open && (
        <div style={{ padding: '8px 2px 4px' }}>
          {loading && <p style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', margin: 4 }}>Cargando…</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', margin: 4 }}>Sin estadísticas disponibles aún</p>
          )}
          {filtered.map(s => {
            const label = STAT_ES[s.strStat] || s.strStat;
            const hv = parseInt(s.intHome) || 0;
            const av = parseInt(s.intAway) || 0;
            const isPct = s.strStat === 'Ball Possession';
            const hPct = isPct ? hv : Math.round((hv / (hv + av || 1)) * 100);
            return (
              <div key={s.strStat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', marginBottom: 3 }}>
                  <b style={{ color: '#1A6B2F' }}>{hv}{isPct ? '%' : ''}</b>
                  <span style={{ color: '#5a6b5e' }}>{label}</span>
                  <b style={{ color: '#e53935' }}>{av}{isPct ? '%' : ''}</b>
                </div>
                <div style={{ height: 5, background: '#dfe8e1', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${hPct}%`, background: '#27AE60' }} />
                  <div style={{ flex: 1, background: '#e53935' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
