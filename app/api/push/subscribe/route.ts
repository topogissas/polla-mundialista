import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhrwtgkmkxpyjujbqlue.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_92EJ92ayz-tQZR2AAd5E0w_vBsCoU2K'
);

export async function POST(req: NextRequest) {
  const { participanteId, subscription } = await req.json();
  if (!participanteId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }
  const { error } = await sb.from('polla_push_subscriptions').upsert({
    participante_id: participanteId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }, { onConflict: 'endpoint' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'No endpoint' }, { status: 400 });
  await sb.from('polla_push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
