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

interface SolicitudCreacion {
  id: string;
  solicitante_id: string;
  solicitante_nombre: string;
  nombre_deseado: string;
  descripcion: string | null;
  estado: string;
  creado_en: string;
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
  const { participanteId, usuario, grupoId, grupoNombre, esAdmin } = useApp();
  const [misMembresías, setMisMembresías] = useState<MiMembresia[]>([]);
  const [todosGrupos, setTodosGrupos] = useState<Grupo[]>([]);
  const [solicitudesAdmin, setSolicitudesAdmin] = useState<Solicitud[]>([]);
  const [solicitudesCreacion, setSolicitudesCreacion] = useState<SolicitudCreacion[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'mis' | 'unirse' | 'admin'>('mis');
  // PIN flow
  const [pinGrupo, setPinGrupo] = useState<Grupo | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  // Solicitud de nuevo grupo
  const [mostrarFormSolicitud, setMostrarFormSolicitud] = useState(false);
  const [solicNombre, setSolicNombre] = useState('');
  const [solicDesc, setSolicDesc] = useState('');
  const [solicEnviada, setSolicEnviada] = useState(false);
  // Crear desde solicitud (pre-rellenar formulario admin)
  const [crearDesde, setCrearDesde] = useState<SolicitudCreacion | null>(null);

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

      const { data: solicsCreacion } = await sb
        .from('solicitudes_grupos')
        .select('*')
        .eq('estado', 'pendiente')
        .order('creado_en');
      setSolicitudesCreacion(solicsCreacion || []);
    }
  }, [participanteId, esAdmin]);

  useEffect(() => { cargar(); }, [cargar]);

  const miGrupoIds = new Set(misMembresías.map(m => m.grupo_id));
  const gruposDisponibles = todosGrupos.filter(g => !miGrupoIds.has(g.id));

  function abrirPinModal(g: Grupo) {
    setPinGrupo(g);
    setPinInput('');
    setPinError('');
  }

  async function confirmarPin() {
    if (!pinGrupo || !participanteId) return;
    if (!pinGrupo.pin) {
      setPinError('No se pudo verificar el PIN. Contacta al administrador.');
      return;
    }
    if (pinInput !== pinGrupo.pin) {
      setPinError('PIN incorrecto. Pídelo al administrador del grupo.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await sb.from('grupo_miembros').insert({
        grupo_id: pinGrupo.id, participante_id: participanteId, estado: 'pendiente',
      });
      if (error) { alert('Error: ' + error.message); return; }

      // Notificar al admin por WhatsApp
      const msg = `🏆 *Polla Mundial 2026*\n\n📩 *${usuario || 'Un usuario'}* quiere unirse al grupo *${pinGrupo.nombre}*.\n\nEntra a la app → Mis grupos → Admin para aprobar o rechazar.`;
      window.open(`https://wa.me/573125511088?text=${encodeURIComponent(msg)}`, '_blank');

      setPinGrupo(null);
      await cargar();
    } finally { setBusy(false); }
  }

  async function enviarSolicitudCreacion() {
    if (!solicNombre.trim() || !participanteId) return;
    setBusy(true);
    try {
      const { error } = await sb.from('solicitudes_grupos').insert({
        solicitante_id: participanteId,
        solicitante_nombre: usuario || 'Usuario',
        nombre_deseado: solicNombre.trim(),
        descripcion: solicDesc.trim() || null,
      });
      if (error) { alert('Error: ' + error.message); return; }
      setSolicNombre(''); setSolicDesc('');
      setMostrarFormSolicitud(false);
      setSolicEnviada(true);
    } finally { setBusy(false); }
  }

  async function rechazarSolicitudCreacion(id: string) {
    setBusy(true);
    try {
      await sb.from('solicitudes_grupos').update({ estado: 'rechazado' }).eq('id', id);
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
    if (!/^\d{3}$/.test(nuevoPin)) { alert('El PIN debe ser exactamente 3 dígitos (ej: 456)'); return; }
    setBusy(true);
    try {
      const codigo = nuevoCodigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const { data: nuevoGrupo, error } = await sb.from('grupos').insert({ nombre: nuevoNombre.trim(), codigo, pin: nuevoPin }).select('id').single();
      if (error) { alert('Error: ' + error.message); return; }
      // Auto-agregar al admin como miembro activo del nuevo grupo
      if (nuevoGrupo && participanteId) {
        await sb.from('grupo_miembros').insert({ grupo_id: nuevoGrupo.id, participante_id: participanteId, estado: 'activo', aprobado_en: new Date().toISOString() });
      }
      // Si se creó desde una solicitud, marcarla como aprobada
      if (crearDesde) {
        await sb.from('solicitudes_grupos').update({ estado: 'aprobado' }).eq('id', crearDesde.id);
        setCrearDesde(null);
      }
      setNuevoNombre(''); setNuevoCodigo(''); setNuevoPin('');
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

  const totalPendientesAdmin = solicitudesAdmin.length + solicitudesCreacion.length;

  return (
    <>
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

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {tabBtn('mis', 'Mis grupos')}
            {tabBtn('unirse', 'Unirse')}
            {esAdmin && tabBtn('admin', `Admin${totalPendientesAdmin ? ` (${totalPendientesAdmin})` : ''}`)}
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
                <p style={{ color: '#474A4A', fontSize: '.85rem', textAlign: 'center', padding: '12px 0 4px' }}>Ya estás en todos los grupos disponibles.</p>
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
                          onClick={() => abrirPinModal(g)}
                          disabled={busy}
                          style={{ padding: '6px 14px', background: '#3CAC3B', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
                        >Solicitar</button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Solicitar nuevo grupo */}
              <div style={{ marginTop: 16, borderTop: '1px solid #e8e8e8', paddingTop: 14 }}>
                <p style={{ fontSize: '.78rem', color: '#474A4A', marginBottom: 10 }}>
                  ¿No encuentras tu grupo? Solicita al administrador que cree uno nuevo.
                </p>
                {solicEnviada ? (
                  <div style={{ background: '#edf7ed', borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#3CAC3B', fontWeight: 700 }}>
                    ✅ Solicitud enviada — el administrador la revisará pronto.
                  </div>
                ) : !mostrarFormSolicitud ? (
                  <button
                    onClick={() => setMostrarFormSolicitud(true)}
                    style={{ width: '100%', padding: '9px 0', background: '#EEF0F9', color: '#2A398D', border: '1px dashed #3CAC3B', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}
                  >+ Pedir nuevo grupo</button>
                ) : (
                  <div>
                    <input
                      autoFocus
                      value={solicNombre}
                      onChange={e => setSolicNombre(e.target.value)}
                      placeholder="Nombre del grupo que quieres (ej: Familia, Trabajo)"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.85rem', marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <input
                      value={solicDesc}
                      onChange={e => setSolicDesc(e.target.value)}
                      placeholder="Descripción opcional"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.85rem', marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setMostrarFormSolicitud(false)} style={{ flex: 1, padding: '9px 0', background: '#EEF0F9', color: '#474A4A', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={enviarSolicitudCreacion} disabled={busy || !solicNombre.trim()} style={{ flex: 2, padding: '9px 0', background: '#2A398D', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.85rem', cursor: (busy || !solicNombre.trim()) ? 'not-allowed' : 'pointer', opacity: (busy || !solicNombre.trim()) ? .6 : 1 }}>Enviar solicitud</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Admin */}
          {tab === 'admin' && esAdmin && (
            <div>
              {/* Solicitudes de ingreso */}
              <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 10 }}>Solicitudes de ingreso</h3>
              {solicitudesAdmin.length === 0 ? (
                <p style={{ color: '#474A4A', fontSize: '.82rem', textAlign: 'center', padding: '8px 0 12px' }}>No hay solicitudes de ingreso pendientes.</p>
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

              {/* Solicitudes de nuevo grupo */}
              {solicitudesCreacion.length > 0 && (
                <>
                  <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 10, marginTop: 14, borderTop: '1px solid #e8e8e8', paddingTop: 14 }}>Solicitudes de nuevo grupo</h3>
                  {solicitudesCreacion.map(s => (
                    <div key={s.id} style={{ background: '#f0f7ff', border: '1px solid #b3d4f5', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                      <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#2A398D' }}>{s.nombre_deseado}</div>
                      <div style={{ fontSize: '.75rem', color: '#474A4A', marginBottom: 4 }}>Por: {s.solicitante_nombre} · {new Date(s.creado_en).toLocaleDateString('es-CO')}</div>
                      {s.descripcion && <div style={{ fontSize: '.75rem', color: '#474A4A', marginBottom: 8, fontStyle: 'italic' }}>{s.descripcion}</div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setCrearDesde(s);
                            setNuevoNombre(s.nombre_deseado);
                            setNuevoCodigo(s.nombre_deseado.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
                            setNuevoPin('');
                          }}
                          disabled={busy}
                          style={{ flex: 2, padding: '7px 0', background: '#2A398D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '.8rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
                        >✅ Crear grupo</button>
                        <button onClick={() => rechazarSolicitudCreacion(s.id)} disabled={busy} style={{ flex: 1, padding: '7px 0', background: '#fff0f0', color: '#c0392b', border: '1px solid #f5a5a5', borderRadius: 8, fontWeight: 700, fontSize: '.8rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}>❌ Rechazar</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Crear nuevo grupo */}
              <div style={{ borderTop: '1px solid #e8e8e8', marginTop: 16, paddingTop: 14 }}>
                <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: crearDesde ? 6 : 10 }}>
                  {crearDesde ? `Crear grupo: "${crearDesde.nombre_deseado}"` : 'Crear nuevo grupo'}
                </h3>
                {crearDesde && (
                  <button onClick={() => { setCrearDesde(null); setNuevoNombre(''); setNuevoCodigo(''); setNuevoPin(''); }} style={{ background: 'none', border: 'none', color: '#474A4A', fontSize: '.75rem', cursor: 'pointer', marginBottom: 8 }}>✕ Cancelar y limpiar</button>
                )}
                <input
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del grupo"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.88rem', marginBottom: 8, boxSizing: 'border-box' }}
                />
                <input
                  value={nuevoCodigo}
                  onChange={e => setNuevoCodigo(e.target.value.toUpperCase())}
                  placeholder="Código (ej: OBRAS, FAMILIA)"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.88rem', marginBottom: 8, boxSizing: 'border-box' }}
                />
                <input
                  value={nuevoPin}
                  onChange={e => setNuevoPin(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="PIN de 3 dígitos (ej: 456)"
                  maxLength={3}
                  inputMode="numeric"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D5D9EB', borderRadius: 9, fontSize: '.88rem', marginBottom: 8, boxSizing: 'border-box', letterSpacing: 6, fontWeight: 700 }}
                />
                <button
                  onClick={crearGrupo}
                  disabled={busy}
                  style={{ width: '100%', padding: 11, background: '#2A398D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
                >Crear grupo</button>
              </div>

              {/* PINs de grupos existentes */}
              <div style={{ borderTop: '1px solid #e8e8e8', marginTop: 16, paddingTop: 14 }}>
                <h3 style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 10 }}>PINs de grupos</h3>
                {todosGrupos.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f4f1' }}>
                    <span style={{ fontSize: '.85rem', color: '#2A398D', fontWeight: 600 }}>{g.nombre}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#474A4A', letterSpacing: 4 }}>{g.pin || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onCerrar}
            style={{ display: 'block', width: '100%', padding: 11, background: '#EEF0F9', color: '#2A398D', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', marginTop: 14 }}
          >Cerrar</button>
        </div>
      </div>

      {/* Modal de PIN */}
      {pinGrupo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <h2 style={{ fontSize: '1.05rem', color: '#2A398D', marginBottom: 6 }}>🔒 PIN del grupo</h2>
            <p style={{ fontSize: '.85rem', color: '#474A4A', marginBottom: 16 }}>
              Ingresa el PIN de 3 dígitos para solicitar unirte a <b>{pinGrupo.nombre}</b>.
            </p>
            <input
              autoFocus
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 3)); setPinError(''); }}
              onKeyDown={e => e.key === 'Enter' && confirmarPin()}
              placeholder="• • •"
              maxLength={3}
              inputMode="numeric"
              style={{
                width: '100%', padding: '14px 0', textAlign: 'center', fontSize: '2rem', fontWeight: 800,
                border: `2px solid ${pinError ? '#c0392b' : '#D5D9EB'}`, borderRadius: 12,
                letterSpacing: 14, boxSizing: 'border-box', marginBottom: 6,
              }}
            />
            {pinError && <p style={{ fontSize: '.78rem', color: '#c0392b', marginBottom: 10, textAlign: 'center' }}>{pinError}</p>}
            <button
              onClick={confirmarPin}
              disabled={busy || pinInput.length !== 3}
              style={{ display: 'block', width: '100%', padding: 13, background: '#2A398D', color: '#fff', border: 'none', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: (busy || pinInput.length !== 3) ? 'not-allowed' : 'pointer', opacity: (busy || pinInput.length !== 3) ? .6 : 1, marginBottom: 8 }}
            >{busy ? 'Enviando…' : 'Solicitar ingreso'}</button>
            <button
              onClick={() => setPinGrupo(null)}
              style={{ display: 'block', width: '100%', padding: 11, background: '#EEF0F9', color: '#2A398D', border: 'none', borderRadius: 12, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer' }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}
