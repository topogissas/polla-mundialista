'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Predicciones, Resultados, Especiales, Vista, Grupo } from '@/lib/types';

interface State {
  usuario: string | null;
  participanteId: string | null;
  grupoId: string | null;
  grupoNombre: string | null;
  grupos: Grupo[];
  predicciones: Predicciones;
  especiales: Especiales;
  resultados: Resultados;
  guardados: string[];
  esAdmin: boolean;
  vista: Vista;
  filtroFase: string;
  cambios: boolean;
  toastMsg: string | null;
  formatoHora: '12h' | '24h';
}

type Action =
  | { type: 'SET_USER'; nombre: string; id: string }
  | { type: 'SET_GRUPO'; id: string; nombre: string }
  | { type: 'SET_GRUPOS'; data: Grupo[] }
  | { type: 'SET_PREDICCIONES'; data: Predicciones }
  | { type: 'SET_ESPECIALES'; data: Especiales }
  | { type: 'SET_RESULTADOS'; data: Resultados }
  | { type: 'UPDATE_SCORE'; store: 'predicciones' | 'resultados'; mid: string; side: 'l' | 'v'; val: number | null }
  | { type: 'SET_ADMIN'; val: boolean }
  | { type: 'SET_VISTA'; val: Vista }
  | { type: 'SET_FILTRO'; val: string }
  | { type: 'SET_CAMBIOS'; val: boolean }
  | { type: 'SET_GUARDADOS'; ids: string[] }
  | { type: 'ADD_GUARDADOS'; ids: string[] }
  | { type: 'TOAST'; msg: string | null }
  | { type: 'SET_FORMATO_HORA'; val: '12h' | '24h' }
  | { type: 'LOGOUT' };

const initial: State = {
  usuario: null, participanteId: null,
  grupoId: null, grupoNombre: null, grupos: [],
  predicciones: {}, especiales: { campeon: null, subcampeon: null, goleador: null },
  resultados: {}, guardados: [], esAdmin: false, vista: 'partidos', filtroFase: 'todos',
  cambios: false, toastMsg: null, formatoHora: '24h',
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_USER': return { ...s, usuario: a.nombre, participanteId: a.id };
    case 'SET_GRUPO': return { ...s, grupoId: a.id, grupoNombre: a.nombre };
    case 'SET_GRUPOS': return { ...s, grupos: a.data };
    case 'SET_PREDICCIONES': return { ...s, predicciones: a.data };
    case 'SET_ESPECIALES': return { ...s, especiales: a.data };
    case 'SET_RESULTADOS': return { ...s, resultados: a.data };
    case 'UPDATE_SCORE': {
      const store = a.store === 'predicciones' ? s.predicciones : s.resultados;
      const updated = { ...store, [a.mid]: { ...store[a.mid], [a.side]: a.val } };
      return a.store === 'predicciones'
        ? { ...s, predicciones: updated, cambios: true }
        : { ...s, resultados: updated, cambios: true };
    }
    case 'SET_ADMIN': return { ...s, esAdmin: a.val };
    case 'SET_VISTA': return { ...s, vista: a.val };
    case 'SET_FILTRO': return { ...s, filtroFase: a.val };
    case 'SET_CAMBIOS': return { ...s, cambios: a.val };
    case 'SET_GUARDADOS': return { ...s, guardados: a.ids };
    case 'ADD_GUARDADOS': return { ...s, guardados: Array.from(new Set([...s.guardados, ...a.ids])) };
    case 'TOAST': return { ...s, toastMsg: a.msg };
    case 'SET_FORMATO_HORA': return { ...s, formatoHora: a.val };
    case 'LOGOUT': return {
      ...initial,
      resultados: s.resultados,
    };
    default: return s;
  }
}

interface Ctx extends State { dispatch: React.Dispatch<Action> }
const AppCtx = createContext<Ctx | null>(null);
export function useApp() { const c = useContext(AppCtx); if (!c) throw new Error('no ctx'); return c; }

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <AppCtx.Provider value={{ ...state, dispatch }}>{children}</AppCtx.Provider>;
}
