import { randomUUID } from 'crypto';
import { clienteAsistente, type Db } from './supabase/servidor';
import { leerConfiguracionWhatsApp, type ConfiguracionWhatsApp } from './ajustes';
import { atenderConversacion } from './ia/asistente';

/**
 * Limpia el número de teléfono dejándolo en formato internacional estándar (solo dígitos).
 * Ej. "+34 600 12 34 56" -> "34600123456"
 */
export function limpiarTelefonoWhatsApp(telefono: string): string {
  return (telefono || '').replace(/\D/g, '');
}

/**
 * Envía un mensaje de texto saliente al cliente mediante la API oficial de Meta (Cloud API).
 */
export async function enviarMensajeWhatsApp(
  telefono: string,
  texto: string,
  configOpcional?: ConfiguracionWhatsApp,
  db?: Db | null
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const cfg = configOpcional ?? (await leerConfiguracionWhatsApp(db));
  if (!cfg.token?.trim()) {
    return { ok: false, error: 'Falta el Token de acceso de Meta Cloud API.' };
  }
  if (!cfg.phoneId?.trim()) {
    return { ok: false, error: 'Falta el Identificador de número de teléfono (Phone Number ID) de Meta.' };
  }

  const destino = limpiarTelefonoWhatsApp(telefono);
  if (!destino || destino.length < 7) {
    return { ok: false, error: 'Número de teléfono de destino no válido (debe incluir prefijo de país).' };
  }

  const mensajeTexto = (texto || '').trim();
  if (!mensajeTexto) {
    return { ok: false, error: 'El mensaje a enviar no puede estar vacío.' };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${cfg.phoneId.trim()}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destino,
        type: 'text',
        text: {
          preview_url: false,
          body: mensajeTexto,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const mensajeError =
        (data as { error?: { message?: string } })?.error?.message ||
        `Error ${res.status} al enviar mensaje por Meta WhatsApp API.`;
      console.error('[enviarMensajeWhatsApp] Error de Meta API:', data);
      return { ok: false, error: mensajeError };
    }

    const messageId = (data as { messages?: { id?: string }[] })?.messages?.[0]?.id;
    return { ok: true, messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[enviarMensajeWhatsApp] Error de red/conexión:', err);
    return { ok: false, error: msg };
  }
}

/**
 * Procesa un mensaje entrante recibido a través del Webhook de Meta.
 * 1. Busca o abre una conversación en canal 'WhatsApp'.
 * 2. Guarda el mensaje del cliente en la base de datos.
 * 3. Si la conversación está en modo IA, ejecuta el asistente y envía la respuesta generada de vuelta por WhatsApp.
 */
export async function procesarMensajeWhatsAppEntrante(params: {
  de: string;
  texto: string;
  nombre?: string;
}): Promise<{ ok: boolean; conversacionId?: string; error?: string }> {
  const config = await leerConfiguracionWhatsApp();
  if (!config.activo) {
    console.info('[WhatsApp] Mensaje recibido pero WhatsApp está pausado/desactivado en ajustes.');
    return { ok: false, error: 'WhatsApp está pausado en la configuración' };
  }

  const telefono = limpiarTelefonoWhatsApp(params.de);
  const texto = (params.texto || '').trim();
  if (!telefono || !texto) {
    return { ok: false, error: 'Datos de mensaje entrante no válidos' };
  }

  const db = await clienteAsistente();

  // 1. Buscar si ya existe una conversación abierta para este teléfono en WhatsApp
  const { data: convExistente } = await db
    .from('conversaciones')
    .select('id, modo, nombre, contacto')
    .eq('canal', 'WhatsApp')
    .eq('contacto', telefono)
    .order('actualizada', { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversacionId = convExistente?.id;

  if (!conversacionId) {
    conversacionId = `cv-${randomUUID()}`;
    const nombre = params.nombre?.trim() || `WhatsApp +${telefono}`;
    const { error: insErr } = await db.from('conversaciones').insert({
      id: conversacionId,
      canal: 'WhatsApp',
      modo: 'ia',
      contacto: telefono,
      nombre,
    });

    if (insErr) {
      console.error('[procesarMensajeWhatsAppEntrante] Error creando conversación:', insErr);
      throw new Error(`Error al crear conversación: ${insErr.message}`);
    }
  } else if (params.nombre && convExistente?.nombre?.startsWith('WhatsApp +')) {
    // Si Meta nos proporciona el nombre de perfil y antes teníamos solo el número, lo actualizamos
    await db.from('conversaciones').update({ nombre: params.nombre.trim() }).eq('id', conversacionId);
  }

  // 2. Insertar el mensaje del cliente
  const mensajeId = `m-${randomUUID()}`;
  const { error: msgErr } = await db.from('mensajes').insert({
    id: mensajeId,
    conversacion_id: conversacionId,
    de: 'cliente',
    texto,
  });

  if (msgErr) {
    console.error('[procesarMensajeWhatsAppEntrante] Error insertando mensaje:', msgErr);
    throw new Error(`Error al insertar mensaje: ${msgErr.message}`);
  }

  // 3. Si la conversación está en modo IA, atendemos automáticamente
  const { data: convActual } = await db
    .from('conversaciones')
    .select('modo')
    .eq('id', conversacionId)
    .single();

  if (convActual?.modo === 'ia') {
    // Tomamos nota de los mensajes existentes para saber cuál es la respuesta generada
    const { data: antes } = await db
      .from('mensajes')
      .select('id')
      .eq('conversacion_id', conversacionId);

    const idsAntes = new Set((antes || []).map((m) => m.id));

    try {
      await atenderConversacion(db, conversacionId);
    } catch (e) {
      console.error('[procesarMensajeWhatsAppEntrante] Error en atenderConversacion:', e);
    }

    // Buscamos los mensajes nuevos creados por la IA tras atender
    const { data: despues } = await db
      .from('mensajes')
      .select('id, de, texto, cuando')
      .eq('conversacion_id', conversacionId)
      .order('cuando', { ascending: true });

    const nuevosIa = (despues || []).filter(
      (m) => !idsAntes.has(m.id) && m.de === 'ia'
    );

    for (const mIa of nuevosIa) {
      if (mIa.texto?.trim()) {
        await enviarMensajeWhatsApp(telefono, mIa.texto, config, db);
      }
    }
  }

  return { ok: true, conversacionId };
}
