'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Predicciones, Resultados, Especiales, Vista } from '@/lib/types';

interface State {
  usuario: string | null;
  participanteId: string | null;
  predicciones: Predicciones;
  especiales: Especiales;
  resultados: Resultados;
  esAdmin: boolean;
  vista: Vista;
  filtroFase: string;
  cambios: boolean;
  toastMsg: string | null;
}

type Action =
  | { type: 'SET_USER'; nombre: string; id: string }
  | { type: 'SET_PREDICCIONES'; data: Predicciones }
  | { type: 'SET_ESPECIALES'; data: Especiales }
  | { type: 'SET_RESULTADOS'; data: Resultados }
  | { type: 'UPDATE_SCORE'; store: 'predicciones' | 'resultados'; mid: string; side: 'l' | 'v'; val: number | null }
  | { type: 'SET_ADMIN'; val: boolean }
  | { type: 'SET_VISTA'; val: Vista }
  | { type: 'SET_FILTRO'; val: string }
  | { type: 'SET_CAMBIOS'; val: boolean }
  | { type: 'TOAST'; msg: string | null }
  | { type: 'LOGOUT' };

const initial: State = {
  usuario: null, participanteId: null,
  predicciones: {}, especiales: { campeon: null, subcampeon: null, goleador: null },
  resultados: {}, esAdmin: false, vista: 'partidos', filtroFase: 'todos',
  cambios: false, toastMsg: null,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_USER': return { ...s, usuario: a.nombre, participanteId: a.id };
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
    case 'TOAST': return { ...s, toastMsg: a.msg };
    case 'LOGOUT': return {
      ...initial,
      resultados: s.resultados, // los resultados son globales, no se pierden
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
