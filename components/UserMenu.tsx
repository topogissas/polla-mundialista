'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, flag, fechaColPartido, formatHora } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';

const VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BINsAPbwpM1PMPOffAeimivyzp5Mmzv4zeUCtOrMrAGjY2J2LP-rQCJzpEEZNCIMstINRtlDZOUBvI_PsQMFRvA';

async function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export default function UserMenu({ onSalir, onMisGrupos }: { onSalir: () => void; onMisGrupos: () => void }) {
  const { usuario, participanteId, predicciones, resultados, esAdmin, formatoHora, grupoNombre, dispatch } = useApp();
  const [pushState, setPushState] = useState<'unsupported' | 'default' | 'granted' | 'denied' | 'loading'>('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'granted') {
      setPushState('granted');
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setPushSubscribed(!!sub));
      });
    } else if (perm === 'denied') {
      setPushState('denied');
    }
  }, []);

  let total = 0, exactos = 0, jugados = 0, hechos = 0;
  ALL_MATCHES.forEach(m => {
    const pred = predicciones[m.id];
    if (pred && pred.l !== null && pred.v !== null) hechos++;
    const real = resultados[m.id];
    if (real && real.l !== null && real.v !== null && pred && pred.l !== null && pred.v !== null) {
      const pts = calcularPuntos(pred, real, m.fase);
      if (pts !== null) { total += pts; jugados++; if (pts === 25) exactos++; }
    }
  });

  function cerrar() {
    document.getElementById('userMenu')!.classList.remove('show');
  }

  async function activarPush() {
    if (!('serviceWorker' in navigator)) return;
    setPushState('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushState('denied'); return; }
      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = await urlBase64ToUint8Array(VAPID_PUBLIC);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participanteId, subscription: sub }),
      });
      setPushState('granted');
      setPushSubscribed(true);
    } catch {
      setPushState('default');
    }
  }

  async function desactivarPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setPushSubscribed(false);
  }

  function compartirWhatsApp() {
    const ranking = jugados > 0 ? `${total} pts · ${exactos} exactos` : 'aún sin resultados';

    // Partidos de hoy en Colombia
    const hoyCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const partidosHoy = ALL_MATCHES.filter(m => fechaColPartido(m) === hoyCol);
    const listaHoy = partidosHoy.length > 0
      ? '\n\n⚽ *Partidos de hoy (hora COL)*\n' + partidosHoy.map(m => `(${formatHora(m.hora, '12h')}) — ${flag(m.local)} ${m.local} vs ${m.visitante} ${flag(m.visitante)}`).join('\n')
      : '';

    const texto = `🏆 *Polla Mundial 2026*\n👤 *${usuario}*${grupoNombre ? ` · Grupo ${grupoNombre}` : ''}\n${ranking}${listaHoy}\n\n¡Únete y compite!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  const stat = (label: string, val: number | string) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: '#EEF0F9', borderRadius: 10 }}>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#2A398D' }}>{val}</div>
      <div style={{ fontSize: '.7rem', color: '#474A4A', fontWeight: 600 }}>{label}</div>
    </div>
  );

  const btn = (label: string, onClick: () => void, primary = false, danger = false) => (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', padding: 13, borderRadius: 12,
      fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', marginTop: 8,
      background: danger ? '#fff0f0' : primary ? '#2A398D' : '#fff',
      color: danger ? '#c0392b' : primary ? '#fff' : '#2A398D',
      border: danger ? '1px solid #f5a5a5' : primary ? 'none' : '1px solid #3CAC3B',
    }}>{label}</button>
  );

  return (
    <div id="userMenu" className="modal"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 2, color: '#2A398D' }}>👤 {usuario}</h2>
        {grupoNombre && (
          <p style={{ fontSize: '.78rem', color: '#3CAC3B', fontWeight: 700, marginBottom: 4 }}>🏆 {grupoNombre}</p>
        )}
        <p style={{ fontSize: '.85rem', color: '#474A4A', marginBottom: 14 }}>Tu resumen en la polla</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {stat('puntos', total)}
          {stat('exactos', exactos)}
          {stat('jugados', jugados)}
        </div>
        <p style={{ fontSize: '.78rem', color: '#474A4A', textAlign: 'center', marginBottom: 14 }}>
          Has pronosticado {hechos} de {ALL_MATCHES.length} partidos.
        </p>

        {/* Formato de hora */}
        <div style={{ background: '#F4F6FB', borderRadius: 12, padding: '10px 14px', marginBottom: 4 }}>
          <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#474A4A', marginBottom: 8 }}>🕐 Formato de hora</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['24h', '12h'] as const).map(f => (
              <button key={f} onClick={() => dispatch({ type: 'SET_FORMATO_HORA', val: f })} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer',
                background: formatoHora === f ? '#2A398D' : '#fff',
                color: formatoHora === f ? '#fff' : '#474A4A',
                border: formatoHora === f ? 'none' : '1px solid #D5D9EB',
              }}>{f === '24h' ? '24h (15:00)' : '12h (3:00 PM)'}</button>
            ))}
          </div>
        </div>

        {/* Push notifications */}
        {pushState !== 'unsupported' && (
          <div style={{ background: '#F4F6FB', borderRadius: 12, padding: '10px 14px', marginBottom: 4, marginTop: 8 }}>
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#474A4A', marginBottom: 8 }}>🔔 Notificaciones push</p>
            {pushState === 'denied' ? (
              <p style={{ fontSize: '.75rem', color: '#c0392b' }}>Bloqueadas en este navegador. Actívalas en los ajustes del sitio.</p>
            ) : pushState === 'loading' ? (
              <p style={{ fontSize: '.75rem', color: '#474A4A' }}>Activando…</p>
            ) : pushSubscribed ? (
              <div>
                <p style={{ fontSize: '.75rem', color: '#3CAC3B', fontWeight: 700, marginBottom: 6 }}>✅ Activadas — te avisamos antes de cada partido</p>
                <button onClick={desactivarPush} style={{ padding: '6px 14px', background: '#fff0f0', color: '#c0392b', border: '1px solid #f5a5a5', borderRadius: 8, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>Desactivar</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '.75rem', color: '#474A4A', marginBottom: 6 }}>Recibe una notif ~5 min antes de cada partido.</p>
                <button onClick={activarPush} style={{ padding: '8px 18px', background: '#2A398D', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }}>🔔 Activar notificaciones</button>
              </div>
            )}
          </div>
        )}

        {/* Administrador */}
        {esAdmin
          ? btn('✅ Admin ACTIVO — desactivar', () => { cerrar(); dispatch({ type: 'SET_ADMIN', val: false }); }, false, true)
          : btn('🔧 Modo administrador', () => { cerrar(); document.getElementById('adminModal')?.classList.add('show'); })
        }

        {btn('🏆 Mis grupos', () => { cerrar(); onMisGrupos(); })}
        {btn('📲 Compartir en WhatsApp', compartirWhatsApp)}
        {btn('🔄 Cambiar de usuario', () => {
          cerrar();
          const inp = document.getElementById('nameInput') as HTMLInputElement | null;
          if (inp) inp.value = usuario || '';
          document.getElementById('loginModal')!.classList.add('show');
        })}
        {btn('🚪 Salir', () => { cerrar(); onSalir(); })}
        {btn('Cerrar', cerrar, true)}
      </div>
      <style>{`.modal.show { display: flex !important; }`}</style>
    </div>
  );
}
