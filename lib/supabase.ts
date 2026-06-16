import { createClient } from '@supabase/supabase-js';

// Estas credenciales son públicas por diseño (anon/publishable key) y ya viven
// en .env.example. Se usan como fallback para que el build no falle si las
// variables de entorno no están configuradas (p. ej. en un deploy nuevo).
// Las variables de entorno NEXT_PUBLIC_* tienen prioridad si están definidas.
const DEFAULT_URL = 'https://hhrwtgkmkxpyjujbqlue.supabase.co';
const DEFAULT_KEY = 'sb_publishable_92EJ92ayz-tQZR2AAd5E0w_vBsCoU2K';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const sb = createClient(url, key);
