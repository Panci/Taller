import { leerConfiguracionWhatsApp } from '@/lib/ajustes';
import { procesarMensajeWhatsAppEntrante } from '@/lib/whatsapp';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

/**
 * Verificación del Webhook por Meta for Developers.
 * Meta envía una solicitud GET con los parámetros:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: el token que configuramos
 * - hub.challenge: una cadena que debemos devolver para verificar la propiedad del webhook.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const config = await leerConfiguracionWhatsApp();
    const tokenEsperado = config.verifyToken || 'taller_secreto_whatsapp';

    if (mode === 'subscribe' && token === tokenEsperado) {
      return new Response(challenge || '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[WhatsApp Webhook GET] Verificación rechazada. Token recibido:', token, 'Esperado:', tokenEsperado);
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[WhatsApp Webhook GET Error]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Recepción de eventos y mensajes entrantes de WhatsApp desde Meta.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          field?: string;
          value?: {
            messaging_product?: string;
            contacts?: Array<{
              profile?: { name?: string };
              wa_id?: string;
            }>;
            messages?: Array<{
              from?: string;
              id?: string;
              timestamp?: string;
              type?: string;
              text?: { body?: string };
              interactive?: {
                button_reply?: { title?: string };
                list_reply?: { title?: string };
              };
              button?: { text?: string };
            }>;
            statuses?: unknown[];
          };
        }>;
      }>;
    } | null;

    if (!body || body.object !== 'whatsapp_business_account') {
      return Response.json({ status: 'ignored' }, { status: 200 });
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value;
        if (!val) continue;

        // Si son mensajes entrantes
        if (val.messages && Array.isArray(val.messages)) {
          for (const msg of val.messages) {
            const de = msg.from;
            if (!de) continue;

            let texto = '';
            if (msg.type === 'text') {
              texto = msg.text?.body || '';
            } else if (msg.type === 'interactive') {
              texto =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                '';
            } else if (msg.type === 'button') {
              texto = msg.button?.text || '';
            }

            if (texto.trim()) {
              const contacto = val.contacts?.find((c) => c.wa_id === de);
              const nombre = contacto?.profile?.name;

              // Procesar el mensaje
              await procesarMensajeWhatsAppEntrante({
                de,
                texto: texto.trim(),
                nombre,
              });
            }
          }
        }
      }
    }

    // Meta siempre requiere una respuesta 200 OK rápida
    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook POST Error]', error);
    // Devolvemos 200 para evitar que Meta reintente continuamente en caso de excepción
    return Response.json({ status: 'error', error: String(error) }, { status: 200 });
  }
}
