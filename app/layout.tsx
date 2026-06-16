import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Polla Mundial 2026',
  description: 'Quiniela de pronósticos del Mundial 2026',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Polla 2026',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-bg text-texto font-sans leading-snug">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
