#!/usr/bin/env node
// Actualizador automático de marcadores de la Polla Mundial 2026.
// Corre en GitHub Actions cada ~15 min. Lee thesportsdb.com (gratis) y
// escribe los goles en Supabase vía REST con la anon key (pública por diseño).
//
// No requiere dependencias: usa fetch nativo de Node 18+.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hhrwtgkmkxpyjujbqlue.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_92EJ92ayz-tQZR2AAd5E0w_vBsCoU2K';
const TSDB = 'https://www.thesportsdb.com/api/v1/json/3';

// ── Calendario de la fase de grupos: [match_id, equipoLocalEN, equipoVisitanteEN] ──
const FIXTURES = [
  ['G1','Mexico','South Africa'], ['G2','South Korea','Czech Republic'], ['G3','Canada','Bosnia-Herzegovina'],
  ['G4','USA','Paraguay'], ['G5','Qatar','Switzerland'], ['G6','Brazil','Morocco'],
  ['G7','Haiti','Scotland'], ['G8','Australia','Turkey'], ['G9','Germany','Curaçao'],
  ['G10','Netherlands','Japan'], ['G11','Ivory Coast','Ecuador'], ['G12','Sweden','Tunisia'],
  ['G13','Spain','Cape Verde'], ['G14','Belgium','Egypt'], ['G15','Saudi Arabia','Uruguay'],
  ['G16','Iran','New Zealand'], ['G17','France','Senegal'], ['G18','Iraq','Norway'],
  ['G19','Argentina','Algeria'], ['G20','Austria','Jordan'], ['G21','Portugal','DR Congo'],
  ['G22','England','Croatia'], ['G23','Ghana','Panama'], ['G24','Uzbekistan','Colombia'],
  ['G25','Czech Republic','South Africa'], ['G26','Switzerland','Bosnia-Herzegovina'], ['G27','Canada','Qatar'],
  ['G28','Mexico','South Korea'], ['G29','USA','Australia'], ['G30','Scotland','Morocco'],
  ['G31','Brazil','Haiti'], ['G32','Turkey','Paraguay'], ['G33','Netherlands','Sweden'],
  ['G34','Germany','Ivory Coast'], ['G35','Ecuador','Curaçao'], ['G36','Tunisia','Japan'],
  ['G37','Spain','Saudi Arabia'], ['G38','Belgium','Iran'], ['G39','Uruguay','Cape Verde'],
  ['G40','New Zealand','Egypt'], ['G41','Argentina','Austria'], ['G42','France','Iraq'],
  ['G43','Norway','Senegal'], ['G44','Jordan','Algeria'], ['G45','Portugal','Uzbekistan'],
  ['G46','England','Ghana'], ['G47','Panama','Croatia'], ['G48','Colombia','DR Congo'],
  ['G49','Switzerland','Canada'], ['G50','Bosnia-Herzegovina','Qatar'], ['G51','Scotland','Brazil'],
  ['G52','Morocco','Haiti'], ['G53','Czech Republic','Mexico'], ['G54','South Africa','South Korea'],
  ['G55','Ecuador','Germany'], ['G56','Curaçao','Ivory Coast'], ['G57','Japan','Sweden'],
  ['G58','Tunisia','Netherlands'], ['G59','Turkey','USA'], ['G60','Paraguay','Australia'],
  ['G61','Norway','France'], ['G62','Senegal','Iraq'], ['G63','Cape Verde','Saudi Arabia'],
  ['G64','Uruguay','Spain'], ['G65','Egypt','Iran'], ['G66','New Zealand','Belgium'],
  ['G67','Panama','England'], ['G68','Croatia','Ghana'], ['G69','Colombia','Portugal'],
  ['G70','DR Congo','Uzbekistan'], ['G71','Algeria','Austria'], ['G72','Jordan','Argentina'],
];

// Alias para tolerar variantes de nombre que use thesportsdb.
const ALIASES = {
  'USA': ['United States', 'United States of America'],
  'Czech Republic': ['Czechia'],
  'Bosnia-Herzegovina': ['Bosnia and Herzegovina', 'Bosnia y Herzegovina', 'Bosnia'],
  'Curaçao': ['Curacao', 'Curazao'],
  'Ivory Coast': ["Cote d'Ivoire", 'Côte d’Ivoire', 'Cote dIvoire'],
  'DR Congo': ['Congo DR', 'Congo D.R.', 'DR Congo', 'Democratic Republic of Congo', 'RD Congo'],
  'Turkey': ['Türkiye', 'Turkiye'],
  'South Korea': ['Korea Republic', 'Republic of Korea'],
  'Cape Verde': ['Cabo Verde'],
  'Qatar': ['Catar'],
};

// Normaliza: minúsculas, sin acentos, solo alfanuméricos.
const norm = (s) => (s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  .toLowerCase().replace(/[^a-z0-9]/g, '');

// norm(nombre) -> nombre canónico
const canonByNorm = {};
for (const [, home, away] of FIXTURES) {
  for (const team of [home, away]) canonByNorm[norm(team)] = team;
}
for (const [canon, alts] of Object.entries(ALIASES)) {
  canonByNorm[norm(canon)] = canon;
  for (const a of alts) canonByNorm[norm(a)] = canon;
}

// "local|visitante" canónico -> match_id
const pairToId = {};
for (const [id, home, away] of FIXTURES) pairToId[home + '|' + away] = id;

const toCanon = (raw) => canonByNorm[norm(raw)] || null;

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchDay(dateStr) {
  const r = await fetch(`${TSDB}/eventsday.php?d=${dateStr}&s=Soccer`);
  if (!r.ok) return [];
  const data = await r.json();
  return (data.events || []).filter((e) => e.strLeague === 'FIFA World Cup');
}

async function main() {
  // Ventana de fechas UTC: ayer, hoy, mañana (cubre partidos en vivo y recién terminados).
  const now = new Date();
  const dias = [-1, 0, 1].map((off) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + off);
    return ymd(d);
  });

  const eventos = [];
  for (const dia of dias) {
    try {
      eventos.push(...(await fetchDay(dia)));
    } catch (e) {
      console.error('Error consultando', dia, e.message);
    }
  }

  const filas = [];
  const vistos = new Set();
  for (const ev of eventos) {
    if (ev.intHomeScore == null || ev.intAwayScore == null) continue;
    const home = toCanon(ev.strHomeTeam);
    const away = toCanon(ev.strAwayTeam);
    if (!home || !away) continue;

    let id = pairToId[home + '|' + away];
    let gl = parseInt(ev.intHomeScore, 10);
    let gv = parseInt(ev.intAwayScore, 10);

    // Si viene con local/visitante invertidos, intentamos el orden contrario.
    if (!id) {
      id = pairToId[away + '|' + home];
      if (id) { const t = gl; gl = gv; gv = t; }
    }
    if (!id || Number.isNaN(gl) || Number.isNaN(gv)) continue;
    if (vistos.has(id)) continue;
    vistos.add(id);

    filas.push({ match_id: id, goles_local: gl, goles_visitante: gv, actualizado_en: new Date().toISOString() });
    console.log(`${id}: ${ev.strHomeTeam} ${gl}-${gv} ${ev.strAwayTeam} (${ev.strStatus || ''})`);
  }

  if (!filas.length) {
    console.log('Sin marcadores para actualizar en esta corrida.');
    return;
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/polla_resultados?on_conflict=match_id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(filas),
  });

  if (!r.ok) {
    console.error('Error escribiendo en Supabase:', r.status, await r.text());
    process.exit(1);
  }
  console.log(`✅ ${filas.length} marcador(es) actualizado(s) en Supabase.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
