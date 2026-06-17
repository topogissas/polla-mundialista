import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BINsAPbwpM1PMPOffAeimivyzp5Mmzv4zeUCtOrMrAGjY2J2LP-rQCJzpEEZNCIMstINRtlDZOUBvI_PsQMFRvA';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:topogissas@gmail.com';
const SEND_SECRET = process.env.PUSH_SEND_SECRET || 'polla2026secret';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhrwtgkmkxpyjujbqlue.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_92EJ92ayz-tQZR2AAd5E0w_vBsCoU2K'
);

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-send-secret');
  if (auth !== SEND_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!VAPID_PRIVATE) return NextResponse.json({ error: 'VAPID_PRIVATE_KEY not configured' }, { status: 500 });

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const { title, body, tag, url } = await req.json();
  const { data: subs } = await sb.from('polla_push_subscriptions').select('*');
  if (!subs?.length) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({ title, body, tag: tag || 'polla', url: url || '/' });
  let sent = 0, failed = 0;

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sb.from('polla_push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ sent, failed });
}
