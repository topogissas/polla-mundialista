# Polla Mundial 2026

Quiniela de pronósticos del Mundial de Fútbol 2026 para jugar con amigos.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (base de datos y autenticación)
- Tailwind CSS
- Vercel (deploy)

## Correr localmente

1. Clona el repo e instala dependencias:
   ```bash
   npm install
   ```

2. Copia el archivo de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Las credenciales ya están en `.env.example` (son públicas por diseño).

3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública de Supabase |
| `NEXT_PUBLIC_ADMIN_PASS` | Clave del modo administrador |
| `NEXT_PUBLIC_POLLA_URL` | Link público de la polla (déjalo vacío hasta que hagas el deploy) |

## Deploy en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [vercel.com](https://vercel.com).
3. En **Settings → Environment Variables**, añade las mismas variables de `.env.example`.
4. Despliega. Vercel detecta Next.js automáticamente.
5. Cuando tengas la URL del deploy, copia el link (ej. `https://polla-mundialista.vercel.app`) y actualiza `NEXT_PUBLIC_POLLA_URL` en Vercel → Redeploy.

## Modo administrador

- En la pantalla principal, toca el texto "🔧 Modo administrador" al final de la página.
- Ingresa la clave (`topogis2026` por defecto, configurable en `NEXT_PUBLIC_ADMIN_PASS`).
- En modo admin puedes:
  - **Editar los resultados reales** de cada partido (los inputs se vuelven editables).
  - Ver la pestaña **Avisos** para enviar recordatorios por WhatsApp.
- Los resultados guardados actualizan el ranking para todos los participantes en tiempo real.

## Cómo jugar

1. Abre la polla y escribe tu nombre.
2. En **Pronósticos**, llena los marcadores de los partidos antes de que empiecen.
3. Cada partido se cierra automáticamente a su hora de inicio (hora Colombia).
4. En **Especiales**, elige campeón, subcampeón y selección más goleadora.
5. Consulta el **Ranking** para ver cómo vas.

## Sistema de puntos

| Acierto | Fase de grupos | Eliminatorias |
|---|---|---|
| Marcador exacto | 5 pts | 10 pts |
| Resultado + diferencia | 3 pts | 6 pts |
| Solo ganador/empate | 1 pt | 2 pts |
| Fallo | 0 pts | 0 pts |

Especiales: Campeón +10 pts · Subcampeón +5 pts · Más goleadora +5 pts.
