import type { Metadata } from 'next';
import { PresentacionDeck } from '@/components/presentacion/deck';
import { leerDatosTaller } from '@/lib/ajustes';

export const metadata: Metadata = {
  title: 'AI Partner para Talleres Mecánicos · Presentación',
  description: 'Del taller saturado de llamadas y papeles al taller asistido por Inteligencia Artificial.',
};

export default async function PaginaPresentacion() {
  const taller = await leerDatosTaller();
  return <PresentacionDeck taller={taller} />;
}
