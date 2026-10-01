import type { Metadata } from 'next';
import { ChatPublico } from '@/components/chat/chat-publico';
import { leerDatosTaller } from '@/lib/ajustes';

export async function generateMetadata(): Promise<Metadata> {
  const taller = await leerDatosTaller();
  return {
    title: `Chat · ${taller.nombre}`,
    description: `Pregunta por tu coche, pide precio o reserva cita en ${taller.nombre}${taller.ciudad ? ` (${taller.ciudad})` : ''}.`,
  };
}

// Página pública para clientes. Cada chat nuevo entra en la bandeja del
// taller con el canal "Web".
export default async function PaginaChat() {
  const taller = await leerDatosTaller();
  return (
    <main className="min-h-dvh flex justify-center items-start sm:items-center sm:p-6">
      <ChatPublico taller={taller} />
    </main>
  );
}
