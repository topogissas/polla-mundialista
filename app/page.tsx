'use client';
import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { sb } from '@/lib/supabase';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import LoginModal from '@/components/LoginModal';
import AdminModal from '@/components/AdminModal';
import UserMenu from '@/components/UserMenu';
import Toast from '@/components/Toast';
import SaveBar from '@/components/SaveBar';
import PartidosView from '@/components/views/PartidosView';
import RankingView from '@/components/views/RankingView';
import ApuestasView from '@/components/views/ApuestasView';
import CalendarioView from '@/components/views/CalendarioView';
import ReglasView from '@/components/views/ReglasView';
import AvisosView from '@/components/views/AvisosView';
import { ALL_MATCHES, partidoCerrado } from '@/lib/matches';
import type { Predicciones, Resultados } from '@/lib/types';

export default function Home() {
  const { usuario, participanteId, esAdmin, vista, cambios, predicciones, resultados, guardados, dispatch } = useApp();
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toast(msg: string) {
    dispatch({ type: 'TOAST', msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => dispatch({ type: 'TOAST', msg: null }), 2400);
  }

  async function cargarResultados() {
    const { data } = await sb.from('polla_resultados').select('*');
    const res: Resultados = {};
    (data || []).forEach((r: any) => { res[r.match_id] = { l: r.goles_local, v: r.goles_visitante }; });
    dispatch({ type: 'SET_RESULTADOS', data: res });
  }

  async function cargarMisPredicciones(pid: string) {
    const { data } = await sb.from('polla_pronosticos').select('*').eq('participante_id', pid);
    const preds: Predicciones = {};
    (data || []).forEach((p: any) => { preds[p.match_id] = { l: p.goles_local, v: p.goles_visitante }; });
    dispatch({ type: 'SET_PREDICCIONES', data: preds });
    // Todo lo ya guardado queda BLOQUEADO (una sola apuesta por partido).
    dispatch({ type: 'SET_GUARDADOS', ids: Object.keys(preds) });
    const { data: esp } = await sb.from('polla_especiales').select('*').eq('participante_id', pid).maybeSingle();
    dispatch({ type: 'SET_ESPECIALES', data: esp ? { campeon: esp.campeon, subcampeon: esp.subcampeon, goleador: esp.goleador } : { campeon: null, subcampeon: null, goleador: null } });
  }

  async function registrarParticipante(nombre: string): Promise<string | null> {
    const key = nombre.toLowerCase().trim();
    const { data: exist } = await sb.from('polla_participantes').select('*').eq('nombre_key', key).maybeSingle();
    if (exist) return exist.id;
    const { data, error } = await sb.from('polla_participantes').insert({ nombre: nombre.trim(), nombre_key: key }).select().single();
    if (error) { toast('Error al registrar: ' + error.message); return null; }
    return data.id;
  }

  async function entrar(nombre: string) {
    if (!nombre) { toast('Escribe tu nombre'); return; }
    toast('Conectando…');
    const id = await registrarParticipante(nombre);
    if (!id) return;
    dispatch({ type: 'SET_USER', nombre, id });
    localStorage.setItem('polla_user', nombre);
    localStorage.setItem('polla_id', id);
    await cargarMisPredicciones(id);
    dispatch({ type: 'SET_VISTA', val: 'partidos' });
    toast('¡Hola ' + nombre + '! Haz tus pronósticos');
  }

  function salir() {
    localStorage.removeItem('polla_user');
    localStorage.removeItem('polla_id');
    dispatch({ type: 'LOGOUT' });
    toast('Sesión cerrada');
  }

  async function guardar() {
    dispatch({ type: 'SET_CAMBIOS', val: false });
    const MAP = Object.fromEntries(ALL_MATCHES.map(m => [m.id, m]));
    if (esAdmin) {
      const rows = Object.entries(resultados)
        .filter(([, r]) => r.l !== null && r.v !== null)
        .map(([mid, r]) => ({ match_id: mid, goles_local: r.l, goles_visitante: r.v, actualizado_en: new Date().toISOString() }));
      if (rows.length) {
        const { error } = await sb.from('polla_resultados').upsert(rows, { onConflict: 'match_id' });
        if (error) { toast('Error: ' + error.message); return; }
      }
      toast('✅ Resultados guardados — el ranking se actualizó para todos');
    } else {
      // Solo se guardan apuestas nuevas: con marcador, no bloqueadas y no cerradas (5 min antes).
      const nuevos = Object.entries(predicciones)
        .filter(([mid, p]) => p.l !== null && p.v !== null && !guardados.includes(mid) && !partidoCerrado(MAP[mid]));
      if (!nuevos.length) { toast('No hay apuestas nuevas para guardar'); return; }
      const rows = nuevos.map(([mid, p]) => ({ participante_id: participanteId, match_id: mid, goles_local: p.l, goles_visitante: p.v, actualizado_en: new Date().toISOString() }));
      const { error } = await sb.from('polla_pronosticos').upsert(rows, { onConflict: 'participante_id,match_id' });
      if (error) { toast('Error: ' + error.message); return; }
      // Una vez guardadas, quedan BLOQUEADAS sin modificación.
      dispatch({ type: 'ADD_GUARDADOS', ids: nuevos.map(([mid]) => mid) });
      toast(`✅ ${rows.length} apuesta(s) guardada(s) y bloqueada(s)`);
    }
  }

  useEffect(() => {
    cargarResultados();
    const u = localStorage.getItem('polla_user');
    const id = localStorage.getItem('polla_id');
    if (u && id) {
      dispatch({ type: 'SET_USER', nombre: u, id });
      cargarMisPredicciones(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 14px 90px' }}>
        <TabBar />
        {vista === 'partidos' && <PartidosView toast={toast} />}
        {vista === 'calendario' && <CalendarioView />}
        {vista === 'ranking' && <RankingView toast={toast} />}
        {vista === 'apuestas' && <ApuestasView toast={toast} />}
        {vista === 'reglas' && <ReglasView />}
        {vista === 'avisos' && <AvisosView />}
        <div
          className="text-center mt-5 text-xs text-gris cursor-pointer underline"
          onClick={() => {
            if (esAdmin) {
              dispatch({ type: 'SET_ADMIN', val: false });
              toast('Modo admin desactivado');
            } else {
              dispatch({ type: 'SET_VISTA', val: 'partidos' }); // will be overridden by AdminModal
              document.getElementById('adminModal')?.classList.add('show');
            }
          }}
        >
          {esAdmin ? '✅ Modo admin ACTIVO — toca para salir' : '🔧 Modo administrador (cargar resultados reales)'}
        </div>
      </div>
      <SaveBar onGuardar={guardar} />
      <LoginModal onEntrar={entrar} />
      <AdminModal toast={toast} />
      <UserMenu onSalir={salir} />
      <Toast />
    </>
  );
}
