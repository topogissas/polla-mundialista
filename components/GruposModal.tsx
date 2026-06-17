'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import type { Grupo } from '@/lib/types';

interface Solicitud {
  id: string;
  estado: string;
  grupo_id: string;
  grupo_nombre: string;
  participante_id: string;
  participante_nombre: string;
  solicitado_en: string;
}

interface MiMembresiaRaw {
  id: string;
  estado: string;
  grupo_id: string;
  grupos: { nombre: string; codigo: string; descripcion: string | null } | null;
}

interface MiMembresia {
  id: string;
  estado: string;
  grupo_id: string;
  grupo_nombre: string;
  grupo_codigo: string;
  grupo_descripcion: string | null;
}

export default function GruposModal({ onCerrar, onCambiarGrupo }: {
  onCerrar: () => void;
  onCambiarGrupo: (g: Grupo) => void;
}) {
  const { participanteId, grupoId, grupoNombre, esAdmin } = useApp();
  const [misMembresías, setMisMembresías] = useState<MiMembresia[]>([]);
  const [todosGrupos, setTodosGrupos] = useState<Grupo[]>([]);
  const [solicitudesAdmin, setSolicitudesAdmin] = useState<Solicitud[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'mis' | 'unirse' | 'admin'>('mis');

  const cargar = useCallback(async () => {
    if (!participanteId) return;

    const { data: mems } = await sb
      .from('grupo_miembros')
      .select('id, estado, grupo_id, grupos(nombre, codigo, descripcion)')
      .eq('participante_id', participanteId);

    const parsed: MiMembresia[] = ((mems || []) as unknown as MiMembresiaRaw[]).map(m => ({
      id: m.id,
      estado: m.estado,
      grupo_id: m.grupo_id,
      grupo_nombre: m.grupos?.nombre || '',
      grupo_codigo: m.grupos?.codigo || '',
      grupo_descripcion: m.grupos?.descripcion || null,
    }));
    setMisMembresías(parsed);

    const { data: todos } = await sb.from('grupos').select('*').order('nombre');
    setTodosGrupos(todos || []);

    if (esAdmin) {
      const { data: solic } = await sb
        .from('grupo_miembros')
        .select('id, estado, grupo_id, grupos(nombre), participante_id, polla_participantes(nombre), solicitado_en')
        .eq('estado', 'pendiente')
        .order('solicitado_en');

      const parsed2: Solicitud[] = ((solic || []) as any[]).map(s => ({
        id: s.id,
        estado: s.estado,
        grupo_id: s.grupo_id,
        grupo_nombre: s.grupos?.nombre || '',
        participante_id: s.participante_id,
        participante_nombre: s.polla_participantes?.nombre || '?',
        solicitado_en: s.solicitado_en,
      }));
      setSolicitudesAdmin(parsed2);
    }
  }, [participanteId, esAdmin]);

  useEffect(() => { cargar(); }, [cargar]);

  const miGrupoIds = new Set(misMembresías.map(m => m.grupo_id));
  const gruposDisponibles = todosGrupos.filter(g => !miGrupoIds.has(g.id));

  async function solicitar(grupoId: string) {
    if (!participanteId) return;
    setBusy(true);
    try {
      const { error } = await sb.from('grupo_miembros').insert({
        grupo_id: grupoId, participante_id: participanteId, estado: 'pendiente',
      });
      if (error) { alert('Error: ' + error.message); return; }
      await cargar();
    } finally { setBusy(false); }
  }

  async function aprobar(solicitudId: string) {
    setBusy(true);
    try {
      await sb.from('grupo_miembros').update({ estado: 'activo', aprobado_en: new Date().toISOString() }).eq('id', solicitudId);
      await cargar();
    } finally { setBusy(false); }
  }

  async function rechazar(solicitudId: string) {
    setBusy(true);
    try {
      await sb.from('grupo_miembros').update({ estado: 'rechazado' }).eq('id', solicitudId);
      await cargar();
    } finally { setBusy(false); }
  }

  async function crearGrupo() {
    if (!nuevoNombre.trim() || !nuevoCodigo.trim()) { alert('Completa nombre y código'); return; }
    setBusy(true);
    try {
      const codigo = nuevoCodigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const { error } = await sb.from('grupos').insert({ nombre: nuevoNombre.trim(), codigo });
      if (error) { alert('Error: ' + error.message); return; }
      setNuevoNombre(''); setNuevoCodigo('');
      await cargar();
    } finally { setBusy(false); }
  }

  const tabBtn = (key: typeof tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1, padding: '8px 4px', borderRadius: 8, fontWeight: 700, fontSize: '.82rem',
        cursor: 'pointer',
        background: tab === key ? '#2A398D' : '#EEF0F9',
        color: tab === key ? '#fff' : '#474A4A',
        border: 'none',
      }}
    >{label}</button>
  );

  const estadoBadge = (estado: string) => {
    const map: Record<string, [string, string]> = {
      activo: ['#3CAC3B', '✅ Activo'],
      pendiente: ['#D4A017', '⏳ Pendiente'],
      rechazado: ['#c0392b', '❌ Rechazado'],
    };
    const [color, label] = map[estado] || ['#474A4A', estado];
    return <span style={{ fontSize: '.7rem', fontWeight: 700, color }}>{label}</span>;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 150 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.05rem', color: '#2A398D', margin: 0 }}>🏆 Grupos</h2>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#474A4A' }}>✕</button>
        </div>

        {grupoNombre && (
          <div style={{ background: '#EEF0F9', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: '.82rem', color: '#2A398D', fontWeight: 600 }}>
            Jugando en: <b>{grupoNombre}</b>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {tabBtn('mis', 'Mis grupos')}
          {tabBtn('unirse', 'Unirse')}
          {esAdmin && tabBtn('admin', `Admin${solicitudesAdmin.length ? ` (${solicitudesAdmin.length})` : ''}`)}
        </div>

        {/* Tab: Mis grupos */}
        {tab === 'mis' && (
          <div>
            {misMembresías.length === 0 ? (
              <p style={{ color: '#474A4A', fontSize: '.85rem', textAlign: 'center', padding: 20 }}>No estás en ningún grupo todavía. Usa la pestaña "Unirse".</p>
            ) : misMembresías.map(m => (
              <div key={m.id} style={{ background: '#F4F6FB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#2A398D' }}>{m.grupo_nombre}</div>
                    <div style={{ fontSize: '.72rem', color: '#474A4A' }}>Código: {m.grupo_codigo}</div>
                  </div>
                  {estadoBadge(m.estado)}
                </div>
                {m.estado === 'activo' && m.grupo_id !== grupoId && (
                  <button
                    onClick={() => onCambiarGrupo({ id: m.grupo_id, nombre: m.grupo_nombre, codigo: m.grupo_codigo, descripcion: m.grupo_descripcion })}
                    style={{ marginTop: 8, padding: '5px 12px', background: '#2A398D', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >Cambiar a este grupo</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Unirse */}
        {tab === 'unirse' && (
          <div>
            {gruposDisponibles.length === 0 ? (
              <p style={{ color: '#474A4A', fontSize: '.85rem', textAlign: 'center', padding: 20 }}>Ya estás en todos los grupos disponibles.</p>
            ) : gruposDisponibles.map(g => {
              const mia = misMembresías.find(m => m.grupo_id === g.id);
              return (
                <div key={g.id} style={{ background: '#F4F6FB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#2A398D' }}>{g.nombre}</div>
                      <div style={{ fontSize: '.72rem', color: '#474A4A' }}>{g.descripcion || `Código: ${g.codigo}`}</div>
                    </div>
                    {mia ? estadoBadge(mia.estado) : (
                      <button
                        onClick={() => solicitar(g.id)}
                        disabled={busy}
                        style={{ padding: '6px 14px', background: '#3CAC3B', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
                      >Solicitar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Admin */}
        {tab === 'admin' && esAdmin && (
          <div>
            <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 10 }}>Solicitudes pendientes</h3>
            {solicitudesAdmin.length === 0 ? (
              <p style={{ color: '#474A4A', fontSize: '.85rem', textAlign: 'center', padding: '12px 0' }}>No hay solicitudes pendientes.</p>
            ) : solicitudesAdmin.map(s => (
              <div key={s.id} style={{ background: '#fffbe8', border: '1px solid #f0d68a', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#2A398D' }}>{s.participante_nombre}</div>
                <div style={{ fontSize: '.75rem', color: '#474A4A', marginBottom: 8 }}>→ {s.grupo_nombre} · {new Date(s.solicitado_en).toLocaleDateString('es-CO')}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => aprobar(s.id)} disabled={busy} style={{ flex: 1, padding: '7px 0', background: '#3CAC3B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '.8rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}>✅ Aprobar</button>
                  <button onClick={() => rechazar(s.id)} disabled={busy} style={{ flex: 1, padding: '7px 0', background: '#fff0f0', color: '#c0392b', border: '1px solid #f5a5a5', borderRadius: 8, fontWeight: 700, fontSize: '.8rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}>❌ Rechazar</button>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #e8e8e8', marginTop: 16, paddingTop: 14 }}>
              <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 10 }}>Crear nuevo grupo</h3>
              <input
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                placeholder="Nombre del grupo"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.88rem', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <input
                value={nuevoCodigo}
                onChange={e => setNuevoCodigo(e.target.value.toUpperCase())}
                placeholder="Código (ej: OBRAS, PLANEACION)"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.88rem', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <button
                onClick={crearGrupo}
                disabled={busy}
                style={{ width: '100%', padding: 11, background: '#2A398D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
              >Crear grupo</button>
            </div>
          </div>
        )}

        <button
          onClick={onCerrar}
          style={{ display: 'block', width: '100%', padding: 11, background: '#EEF0F9', color: '#2A398D', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', marginTop: 14 }}
        >Cerrar</button>
      </div>
    </div>
  );
}
