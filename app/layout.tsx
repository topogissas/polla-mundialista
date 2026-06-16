import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Polla Mundial 2026',
  description: 'Quiniela de pronósticos del Mundial 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-bg text-texto font-sans leading-snug">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
