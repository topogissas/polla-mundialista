'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { sb } from '@/lib/supabase';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import LoginModal from '@/components/LoginModal';
import AdminModal from '@/components/AdminModal';
import UserMenu from '@/components/UserMenu';
import Toast from '@/components/Toast';
import SaveBar from '@/components/SaveBar';
import GrupoSelectorModal from '@/components/GrupoSelectorModal';
import GruposModal from '@/components/GruposModal';
import PartidosView from '@/components/views/PartidosView';
import RankingView from '@/components/views/RankingView';
import ApuestasView from '@/components/views/ApuestasView';
import CalendarioView from '@/components/views/CalendarioView';
import ReglasView from '@/components/views/ReglasView';
import AvisosView from '@/components/views/AvisosView';
import { ALL_MATCHES, partidoCerrado } from '@/lib/matches';
import type { Predicciones, Resultados, Grupo } from '@/lib/types';

export default function Home() {
  const { usuario, participanteId, grupoId, grupos, esAdmin, vista, cambios, predicciones, resultados, guardados, dispatch } = useApp();
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false);
  const [mostrarGruposModal, setMostrarGruposModal] = useState(false);

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

  async function cargarMisPredicciones(pid: string, gid: string) {
    const { data } = await sb.from('polla_pronosticos').select('*')
      .eq('participante_id', pid)
      .eq('grupo_id', gid);
    const preds: Predicciones = {};
    (data || []).forEach((p: any) => { preds[p.match_id] = { l: p.goles_local, v: p.goles_visitante }; });
    dispatch({ type: 'SET_PREDICCIONES', data: preds });
    dispatch({ type: 'SET_GUARDADOS', ids: Object.keys(preds) });

    const { data: esp } = await sb.from('polla_especiales').select('*')
      .eq('participante_id', pid)
      .eq('grupo_id', gid)
      .maybeSingle();
    dispatch({ type: 'SET_ESPECIALES', data: esp
      ? { campeon: esp.campeon, subcampeon: esp.subcampeon, goleador: esp.goleador }
      : { campeon: null, subcampeon: null, goleador: null }
    });
  }

  async function cargarGruposDelUsuario(pid: string): Promise<(Grupo & { estado: string })[]> {
    const { data } = await sb
      .from('grupo_miembros')
      .select('estado, grupos(id, nombre, codigo, descripcion)')
      .eq('participante_id', pid)
      .eq('estado', 'activo');
    return ((data || []) as any[]).map(m => ({
      ...(m.grupos as Grupo),
      estado: m.estado,
    }));
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

    const gruposActivos = await cargarGruposDelUsuario(id);
    dispatch({ type: 'SET_GRUPOS', data: gruposActivos });

    if (gruposActivos.length === 0) {
      dispatch({ type: 'SET_VISTA', val: 'partidos' });
      toast('¡Hola ' + nombre + '! Solicita unirte a un grupo para apostar');
      setMostrarGruposModal(true);
    } else if (gruposActivos.length === 1) {
      const g = gruposActivos[0];
      dispatch({ type: 'SET_GRUPO', id: g.id, nombre: g.nombre });
      localStorage.setItem('polla_grupo_id', g.id);
      localStorage.setItem('polla_grupo_nombre', g.nombre);
      await cargarMisPredicciones(id, g.id);
      dispatch({ type: 'SET_VISTA', val: 'partidos' });
      toast('¡Hola ' + nombre + '! Haz tus pronósticos en ' + g.nombre);
    } else {
      dispatch({ type: 'SET_VISTA', val: 'partidos' });
      setMostrarSelectorGrupo(true);
      toast('¡Hola ' + nombre + '! Elige tu grupo');
    }
  }

  async function seleccionarGrupo(g: Grupo) {
    if (!participanteId) return;
    dispatch({ type: 'SET_GRUPO', id: g.id, nombre: g.nombre });
    localStorage.setItem('polla_grupo_id', g.id);
    localStorage.setItem('polla_grupo_nombre', g.nombre);
    setMostrarSelectorGrupo(false);
    await cargarMisPredicciones(participanteId, g.id);
    toast('Grupo: ' + g.nombre);
  }

  function salir() {
    localStorage.removeItem('polla_user');
    localStorage.removeItem('polla_id');
    localStorage.removeItem('polla_grupo_id');
    localStorage.removeItem('polla_grupo_nombre');
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
      if (!grupoId) { toast('Selecciona un grupo primero'); return; }
      const nuevos = Object.entries(predicciones)
        .filter(([mid, p]) => p.l !== null && p.v !== null && !guardados.includes(mid) && !partidoCerrado(MAP[mid]));
      if (!nuevos.length) { toast('No hay apuestas nuevas para guardar'); return; }
      const rows = nuevos.map(([mid, p]) => ({
        participante_id: participanteId,
        match_id: mid,
        grupo_id: grupoId,
        goles_local: p.l,
        goles_visitante: p.v,
        actualizado_en: new Date().toISOString(),
      }));
      const { error } = await sb.from('polla_pronosticos').upsert(rows, { onConflict: 'participante_id,match_id,grupo_id' });
      if (error) { toast('Error: ' + error.message); return; }
      dispatch({ type: 'ADD_GUARDADOS', ids: nuevos.map(([mid]) => mid) });
      toast(`✅ ${rows.length} apuesta(s) guardada(s) y bloqueada(s)`);
    }
  }

  useEffect(() => {
    async function init() {
      await cargarResultados();
      const u = localStorage.getItem('polla_user');
      const id = localStorage.getItem('polla_id');
      const gid = localStorage.getItem('polla_grupo_id');
      const gnombre = localStorage.getItem('polla_grupo_nombre');
      if (!u || !id) return;
      dispatch({ type: 'SET_USER', nombre: u, id });

      // Verificar membresías activas (nunca confiar en localStorage ciegamente)
      const gruposActivos = await cargarGruposDelUsuario(id);
      dispatch({ type: 'SET_GRUPOS', data: gruposActivos });

      const autoSelect = (gs: typeof gruposActivos) => {
        if (gs.length === 1) {
          const g = gs[0];
          dispatch({ type: 'SET_GRUPO', id: g.id, nombre: g.nombre });
          localStorage.setItem('polla_grupo_id', g.id);
          localStorage.setItem('polla_grupo_nombre', g.nombre);
          cargarMisPredicciones(id, g.id);
        } else if (gs.length > 1) {
          setMostrarSelectorGrupo(true);
        }
      };

      if (gid && gnombre && gruposActivos.some(g => g.id === gid)) {
        // Membresía sigue activa
        dispatch({ type: 'SET_GRUPO', id: gid, nombre: gnombre });
        cargarMisPredicciones(id, gid);
      } else {
        // Membresía revocada o no existe → limpiar y re-seleccionar
        localStorage.removeItem('polla_grupo_id');
        localStorage.removeItem('polla_grupo_nombre');
        autoSelect(gruposActivos);
      }
    }
    init();
    // Refresca resultados cada 60 s para mostrar marcadores en vivo sin recargar la página
    const intervalo = setInterval(cargarResultados, 60_000);
    return () => clearInterval(intervalo);
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
      </div>
      <SaveBar onGuardar={guardar} />
      <LoginModal onEntrar={entrar} />
      <AdminModal toast={toast} />
      <UserMenu
        onSalir={salir}
        onMisGrupos={() => setMostrarGruposModal(true)}
      />
      <Toast />
      {mostrarSelectorGrupo && grupos.length > 1 && (
        <GrupoSelectorModal onSeleccionar={seleccionarGrupo} />
      )}
      {mostrarGruposModal && (
        <GruposModal
          onCerrar={() => setMostrarGruposModal(false)}
          onCambiarGrupo={(g) => { seleccionarGrupo(g); setMostrarGruposModal(false); }}
        />
      )}
    </>
  );
}
