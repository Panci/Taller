import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { ProveedorAvisos } from '@/components/avisos';
import { leerDatosTaller } from '@/lib/ajustes';
import './globals.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-plex-mono' });

export async function generateMetadata(): Promise<Metadata> {
  const taller = await leerDatosTaller();
  const desc = taller.lema
    ? `${taller.lema}${taller.ciudad ? ` · ${taller.ciudad}` : ''}`
    : (taller.ciudad || 'Taller mecánico');

  return {
    title: {
      template: `%s · ${taller.nombre}`,
      default: taller.nombre,
    },
    description: desc,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#B91C1C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </body>
    </html>
  );
}
