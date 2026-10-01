import type { Metadata } from 'next';
import { ChatPublico } from '@/components/chat/chat-publico';
import { leerDatosTaller, leerConfiguracionWhatsApp } from '@/lib/ajustes';

export async function generateMetadata(): Promise<Metadata> {
  const taller = await leerDatosTaller();
  return {
    title: `Chat · ${taller.nombre}`,
    description: `Pregunta por tu coche, pide precio o reserva cita en ${taller.nombre}${taller.ciudad ? ` (${taller.ciudad})` : ''}.`,
  };
}

// Página pública para clientes. Cada chat nuevo entra en la bandeja del
// taller con el canal "Web" o pueden saltar directamente a WhatsApp si está activo.
export default async function PaginaChat() {
  const [taller, configWhatsApp] = await Promise.all([
    leerDatosTaller(),
    leerConfiguracionWhatsApp(),
  ]);

  const telefonoWhatsApp =
    configWhatsApp.activo && configWhatsApp.telefonoVisible?.trim()
      ? configWhatsApp.telefonoVisible.trim()
      : undefined;

  return (
    <main className="min-h-dvh flex justify-center items-start sm:items-center sm:p-6">
      <ChatPublico taller={taller} telefonoWhatsApp={telefonoWhatsApp} />
    </main>
  );
}
