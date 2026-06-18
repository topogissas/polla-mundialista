import type { Match } from './types';

export const FLAGS: Record<string, string> = {
  "México": "🇲🇽", "Corea del Sur": "🇰🇷", "Sudáfrica": "🇿🇦", "Canadá": "🇨🇦",
  "Suiza": "🇨🇭", "Catar": "🇶🇦", "Brasil": "🇧🇷", "Marruecos": "🇲🇦",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Haití": "🇭🇹", "Estados Unidos": "🇺🇸", "Australia": "🇦🇺",
  "Paraguay": "🇵🇾", "Alemania": "🇩🇪", "Ecuador": "🇪🇨", "Costa de Marfil": "🇨🇮",
  "Curazao": "🇨🇼", "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Túnez": "🇹🇳",
  "Bélgica": "🇧🇪", "Irán": "🇮🇷", "Egipto": "🇪🇬", "Nueva Zelanda": "🇳🇿",
  "España": "🇪🇸", "Uruguay": "🇺🇾", "Arabia Saudita": "🇸🇦", "Cabo Verde": "🇨🇻",
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Noruega": "🇳🇴", "Argentina": "🇦🇷",
  "Austria": "🇦🇹", "Argelia": "🇩🇿", "Jordania": "🇯🇴", "Portugal": "🇵🇹",
  "Colombia": "🇨🇴", "Uzbekistán": "🇺🇿", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷",
  "Panamá": "🇵🇦", "Ghana": "🇬🇭",
  // Ganadores de repechaje (marzo 2026)
  "Chequia": "🇨🇿", "Bosnia y Herzegovina": "🇧🇦", "RD Congo": "🇨🇩",
  "Turquía": "🇹🇷", "Irak": "🇮🇶", "Suecia": "🇸🇪",
};

export function flag(t: string): string {
  if (FLAGS[t]) return FLAGS[t];
  if (t?.startsWith('Repechaje')) return '🎟️';
  if (t === 'Por definir') return '❓';
  return '⚽';
}

const DIA_FECHA: Record<string, string> = {
  "Jue 11 Jun": "2026-06-11", "Vie 12 Jun": "2026-06-12", "Sáb 13 Jun": "2026-06-13",
  "Dom 14 Jun": "2026-06-14", "Lun 15 Jun": "2026-06-15", "Mar 16 Jun": "2026-06-16",
  "Mié 17 Jun": "2026-06-17", "Jue 18 Jun": "2026-06-18", "Vie 19 Jun": "2026-06-19",
  "Sáb 20 Jun": "2026-06-20", "Dom 21 Jun": "2026-06-21", "Lun 22 Jun": "2026-06-22",
  "Mar 23 Jun": "2026-06-23", "Mié 24 Jun": "2026-06-24", "Jue 25 Jun": "2026-06-25",
  "Vie 26 Jun": "2026-06-26", "Sáb 27 Jun": "2026-06-27", "Dom 28 Jun": "2026-06-28",
  "Lun 29 Jun": "2026-06-29", "Mar 30 Jun": "2026-06-30", "Mié 01 Jul": "2026-07-01",
  "Jue 02 Jul": "2026-07-02", "Vie 03 Jul": "2026-07-03", "Sáb 04 Jul": "2026-07-04",
  "Dom 05 Jul": "2026-07-05", "Lun 06 Jul": "2026-07-06", "Mar 07 Jul": "2026-07-07",
  "Jue 09 Jul": "2026-07-09", "Vie 10 Jul": "2026-07-10", "Sáb 11 Jul": "2026-07-11",
  "Mar 14 Jul": "2026-07-14", "Mié 15 Jul": "2026-07-15", "Sáb 18 Jul": "2026-07-18",
  "Dom 19 Jul": "2026-07-19",
};

export function inicioPartido(m: Match): Date | null {
  const f = DIA_FECHA[m.dia];
  if (!f) return null;
  const [hh] = m.hora.split(':').map(Number);
  let fecha = f;
  if (hh <= 6) {
    const d = new Date(`${f}T00:00:00-05:00`);
    d.setDate(d.getDate() + 1);
    fecha = d.toISOString().slice(0, 10);
  }
  return new Date(`${fecha}T${m.hora.padStart(5, '0')}:00-05:00`);
}

// Fecha calendario (hora Colombia, YYYY-MM-DD) en que se juega el partido.
export function fechaColPartido(m: Match): string | null {
  const f = DIA_FECHA[m.dia];
  if (!f) return null;
  const [hh] = m.hora.split(':').map(Number);
  if (hh <= 6) {
    const d = new Date(`${f}T00:00:00-05:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return f;
}

// Las apuestas cierran 5 minutos antes del inicio del partido.
export const CIERRE_ANTES_MS = 5 * 60 * 1000;

export function partidoCerrado(m: Match): boolean {
  const ini = inicioPartido(m);
  if (!ini) return false;
  return Date.now() >= ini.getTime() - CIERRE_ANTES_MS;
}

export function formatHora(hora: string, formato: '12h' | '24h'): string {
  if (formato === '24h') return hora;
  const [hStr, mStr] = hora.split(':');
  let h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  else if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

export const FASE_NOMBRE: Record<string, string> = {
  R32: 'Ronda de 32', R16: 'Octavos', CF: 'Cuartos', SF: 'Semifinal',
  '3P': 'Tercer puesto', FN: 'FINAL',
};

const GRUPOS_RAW: [string, string, string, string, string, string, string][] = [
  ["G1","A","Jue 11 Jun","14:00","México","Sudáfrica","Estadio Ciudad de México"],
  ["G2","A","Jue 11 Jun","21:00","Corea del Sur","Chequia","Estadio Guadalajara"],
  ["G3","B","Vie 12 Jun","14:00","Canadá","Bosnia y Herzegovina","Estadio Toronto"],
  ["G4","D","Vie 12 Jun","20:00","Estados Unidos","Paraguay","Estadio Los Ángeles"],
  ["G5","B","Sáb 13 Jun","14:00","Catar","Suiza","Estadio San Francisco"],
  ["G6","C","Sáb 13 Jun","17:00","Brasil","Marruecos","Estadio Nueva York/NJ"],
  ["G7","C","Sáb 13 Jun","20:00","Haití","Escocia","Estadio Boston"],
  ["G8","D","Sáb 13 Jun","23:00","Australia","Turquía","BC Place Vancouver"],
  ["G9","E","Dom 14 Jun","12:00","Alemania","Curazao","Estadio Houston"],
  ["G10","F","Dom 14 Jun","15:00","Países Bajos","Japón","Estadio Dallas"],
  ["G11","E","Dom 14 Jun","18:00","Costa de Marfil","Ecuador","Estadio Filadelfia"],
  ["G12","F","Dom 14 Jun","21:00","Suecia","Túnez","Estadio Monterrey"],
  ["G13","H","Lun 15 Jun","11:00","España","Cabo Verde","Estadio Atlanta"],
  ["G14","G","Lun 15 Jun","14:00","Bélgica","Egipto","BC Place Vancouver"],
  ["G15","H","Lun 15 Jun","17:00","Arabia Saudita","Uruguay","Estadio Miami"],
  ["G16","G","Lun 15 Jun","20:00","Irán","Nueva Zelanda","Estadio Los Ángeles"],
  ["G17","I","Mar 16 Jun","14:00","Francia","Senegal","Estadio Nueva York/NJ"],
  ["G18","I","Mar 16 Jun","17:00","Irak","Noruega","Estadio Boston"],
  ["G19","J","Mar 16 Jun","20:00","Argentina","Argelia","Estadio Kansas City"],
  ["G20","J","Mar 16 Jun","23:00","Austria","Jordania","Estadio San Francisco"],
  ["G21","K","Mié 17 Jun","12:00","Portugal","RD Congo","Estadio Houston"],
  ["G22","L","Mié 17 Jun","15:00","Inglaterra","Croacia","Estadio Dallas"],
  ["G23","L","Mié 17 Jun","18:00","Ghana","Panamá","Estadio Toronto"],
  ["G24","K","Mié 17 Jun","21:00","Uzbekistán","Colombia","Estadio Ciudad de México"],
  ["G25","A","Jue 18 Jun","11:00","Chequia","Sudáfrica","Estadio Atlanta"],
  ["G26","B","Jue 18 Jun","14:00","Suiza","Bosnia y Herzegovina","Estadio Los Ángeles"],
  ["G27","B","Jue 18 Jun","17:00","Canadá","Catar","BC Place Vancouver"],
  ["G28","A","Jue 18 Jun","20:00","México","Corea del Sur","Estadio Guadalajara"],
  ["G29","D","Vie 19 Jun","14:00","Estados Unidos","Australia","Estadio Seattle"],
  ["G30","C","Vie 19 Jun","17:00","Escocia","Marruecos","Estadio Boston"],
  ["G31","C","Vie 19 Jun","20:00","Brasil","Haití","Estadio Filadelfia"],
  ["G32","D","Vie 19 Jun","23:00","Turquía","Paraguay","Estadio San Francisco"],
  ["G33","F","Sáb 20 Jun","14:00","Países Bajos","Suecia","Estadio Houston"],
  ["G34","E","Sáb 20 Jun","15:00","Alemania","Costa de Marfil","Estadio Toronto"],
  ["G35","E","Sáb 20 Jun","19:00","Ecuador","Curazao","Estadio Kansas City"],
  ["G36","F","Sáb 20 Jun","23:00","Túnez","Japón","Estadio Monterrey"],
  ["G37","H","Dom 21 Jun","11:00","España","Arabia Saudita","Estadio Atlanta"],
  ["G38","G","Dom 21 Jun","14:00","Bélgica","Irán","Estadio Los Ángeles"],
  ["G39","H","Dom 21 Jun","17:00","Uruguay","Cabo Verde","Estadio Miami"],
  ["G40","G","Dom 21 Jun","20:00","Nueva Zelanda","Egipto","BC Place Vancouver"],
  ["G41","J","Lun 22 Jun","12:00","Argentina","Austria","Estadio Dallas"],
  ["G42","I","Lun 22 Jun","16:00","Francia","Irak","Estadio Filadelfia"],
  ["G43","I","Lun 22 Jun","19:00","Noruega","Senegal","Estadio Nueva York/NJ"],
  ["G44","J","Lun 22 Jun","22:00","Jordania","Argelia","Estadio San Francisco"],
  ["G45","K","Mar 23 Jun","12:00","Portugal","Uzbekistán","Estadio Houston"],
  ["G46","L","Mar 23 Jun","15:00","Inglaterra","Ghana","Estadio Boston"],
  ["G47","L","Mar 23 Jun","18:00","Panamá","Croacia","Estadio Toronto"],
  ["G48","K","Mar 23 Jun","21:00","Colombia","RD Congo","Estadio Guadalajara"],
  ["G49","B","Mié 24 Jun","14:00","Suiza","Canadá","BC Place Vancouver"],
  ["G50","B","Mié 24 Jun","14:00","Bosnia y Herzegovina","Catar","Estadio Seattle"],
  ["G51","C","Mié 24 Jun","17:00","Escocia","Brasil","Estadio Miami"],
  ["G52","C","Mié 24 Jun","17:00","Marruecos","Haití","Estadio Atlanta"],
  ["G53","A","Mié 24 Jun","20:00","Chequia","México","Estadio Ciudad de México"],
  ["G54","A","Mié 24 Jun","20:00","Sudáfrica","Corea del Sur","Estadio Monterrey"],
  ["G55","E","Jue 25 Jun","15:00","Ecuador","Alemania","Estadio Nueva York/NJ"],
  ["G56","E","Jue 25 Jun","15:00","Curazao","Costa de Marfil","Estadio Filadelfia"],
  ["G57","F","Jue 25 Jun","18:00","Japón","Suecia","Estadio Dallas"],
  ["G58","F","Jue 25 Jun","18:00","Túnez","Países Bajos","Estadio Kansas City"],
  ["G59","D","Jue 25 Jun","21:00","Turquía","Estados Unidos","Estadio Los Ángeles"],
  ["G60","D","Jue 25 Jun","21:00","Paraguay","Australia","Estadio San Francisco"],
  ["G61","I","Vie 26 Jun","14:00","Noruega","Francia","Estadio Boston"],
  ["G62","I","Vie 26 Jun","14:00","Senegal","Irak","Estadio Toronto"],
  ["G63","H","Vie 26 Jun","19:00","Cabo Verde","Arabia Saudita","Estadio Houston"],
  ["G64","H","Vie 26 Jun","19:00","Uruguay","España","Estadio Guadalajara"],
  ["G65","G","Vie 26 Jun","22:00","Egipto","Irán","Estadio Seattle"],
  ["G66","G","Vie 26 Jun","22:00","Nueva Zelanda","Bélgica","BC Place Vancouver"],
  ["G67","L","Sáb 27 Jun","16:00","Panamá","Inglaterra","Estadio Nueva York/NJ"],
  ["G68","L","Sáb 27 Jun","16:00","Croacia","Ghana","Estadio Filadelfia"],
  ["G69","K","Sáb 27 Jun","18:30","Colombia","Portugal","Estadio Miami"],
  ["G70","K","Sáb 27 Jun","18:30","RD Congo","Uzbekistán","Estadio Atlanta"],
  ["G71","J","Sáb 27 Jun","21:00","Argelia","Austria","Estadio Kansas City"],
  ["G72","J","Sáb 27 Jun","21:00","Jordania","Argentina","Estadio Dallas"],
];

const KNOCKOUT_RAW: [string, string, string, string, string, string, string][] = [
  ["K1","R32","Dom 28 Jun","14:00","Por definir","Por definir","Estadio Los Ángeles"],
  ["K2","R32","Lun 29 Jun","12:00","Por definir","Por definir","Estadio Houston"],
  ["K3","R32","Lun 29 Jun","15:30","Por definir","Por definir","Estadio Boston"],
  ["K4","R32","Lun 29 Jun","20:00","Por definir","Por definir","Estadio Monterrey"],
  ["K5","R32","Mar 30 Jun","12:00","Por definir","Por definir","Estadio Dallas"],
  ["K6","R32","Mar 30 Jun","16:00","Por definir","Por definir","Estadio Nueva York/NJ"],
  ["K7","R32","Mar 30 Jun","20:00","Por definir","Por definir","Estadio Ciudad de México"],
  ["K8","R32","Mié 01 Jul","11:00","Por definir","Por definir","Estadio Atlanta"],
  ["K9","R32","Mié 01 Jul","15:00","Por definir","Por definir","Estadio Seattle"],
  ["K10","R32","Mié 01 Jul","19:00","Por definir","Por definir","Estadio San Francisco"],
  ["K11","R32","Jue 02 Jul","14:00","Por definir","Por definir","Estadio Los Ángeles"],
  ["K12","R32","Jue 02 Jul","18:00","Por definir","Por definir","Estadio Toronto"],
  ["K13","R32","Jue 02 Jul","22:00","Por definir","Por definir","BC Place Vancouver"],
  ["K14","R32","Vie 03 Jul","13:00","Por definir","Por definir","Estadio Dallas"],
  ["K15","R32","Vie 03 Jul","17:00","Por definir","Por definir","Estadio Miami"],
  ["K16","R32","Vie 03 Jul","20:30","Por definir","Por definir","Estadio Kansas City"],
  ["K17","R16","Sáb 04 Jul","12:00","Por definir","Por definir","Estadio Houston"],
  ["K18","R16","Sáb 04 Jul","16:00","Por definir","Por definir","Estadio Filadelfia"],
  ["K19","R16","Dom 05 Jul","15:00","Por definir","Por definir","Estadio Nueva York/NJ"],
  ["K20","R16","Dom 05 Jul","19:00","Por definir","Por definir","Estadio Ciudad de México"],
  ["K21","R16","Lun 06 Jul","14:00","Por definir","Por definir","Estadio Dallas"],
  ["K22","R16","Lun 06 Jul","19:00","Por definir","Por definir","Estadio Seattle"],
  ["K23","R16","Mar 07 Jul","11:00","Por definir","Por definir","Estadio Atlanta"],
  ["K24","R16","Mar 07 Jul","15:00","Por definir","Por definir","BC Place Vancouver"],
  ["K25","CF","Jue 09 Jul","15:00","Por definir","Por definir","Estadio Boston"],
  ["K26","CF","Vie 10 Jul","14:00","Por definir","Por definir","Estadio Los Ángeles"],
  ["K27","CF","Sáb 11 Jul","16:00","Por definir","Por definir","Estadio Miami"],
  ["K28","CF","Sáb 11 Jul","20:00","Por definir","Por definir","Estadio Kansas City"],
  ["K29","SF","Mar 14 Jul","14:00","Por definir","Por definir","Estadio Dallas"],
  ["K30","SF","Mié 15 Jul","14:00","Por definir","Por definir","Estadio Atlanta"],
  ["K31","3P","Sáb 18 Jul","16:00","Por definir","Por definir","Estadio Miami"],
  ["K32","FN","Dom 19 Jul","14:00","Por definir","Por definir","Estadio Nueva York/NJ"],
];

export const ALL_MATCHES: Match[] = [
  ...GRUPOS_RAW.map(m => ({
    id: m[0], fase: 'grupo' as const, grupo: m[1],
    dia: m[2], hora: m[3], local: m[4], visitante: m[5], sede: m[6],
  })),
  ...KNOCKOUT_RAW.map(m => ({
    id: m[0], fase: m[1] as Match['fase'], grupo: null,
    dia: m[2], hora: m[3], local: m[4], visitante: m[5], sede: m[6],
  })),
];

export const SELECCIONES = Array.from(new Set(
  GRUPOS_RAW.flatMap(m => [m[4], m[5]])
)).filter(t => !t.startsWith('Repechaje')).sort();

export const GRUPOS_LETRAS = Array.from(new Set(GRUPOS_RAW.map(m => m[1])));
