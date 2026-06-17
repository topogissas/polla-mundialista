'use client';
import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { toastMsg } = useApp();
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: '#1A1F3A', color: '#fff', padding: '10px 18px',
      borderRadius: 24, fontSize: '.85rem', fontWeight: 600, zIndex: 200,
      opacity: toastMsg ? 1 : 0, transition: 'opacity .3s',
      pointerEvents: 'none', textAlign: 'center', maxWidth: '90%',
    }}>
      {toastMsg}
    </div>
  );
}
