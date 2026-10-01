import { cookies } from 'next/headers';
import type { Db } from './supabase/servidor';
import type { Json } from './supabase/tipos-bd';
import { HORARIO_DEFECTO, type HorarioTaller } from './constantes';

const CLAVE_HORARIO = 'horarios_citas';
const COOKIE_HORARIO = 'taller_horario_cfg';

/**
 * Lee la configuración de horarios del taller.
 * Intenta leer de la tabla 'ajustes' en Supabase; si no existe la tabla o falla,
 * usa la cookie de servidor o el horario por defecto.
 */
export async function leerHorarioTaller(db?: Db | null): Promise<HorarioTaller> {
  if (db) {
    try {
      const { data, error } = await db
        .from('ajustes')
        .select('valor')
        .eq('clave', CLAVE_HORARIO)
        .maybeSingle();

      if (!error && data?.valor && typeof data.valor === 'object') {
        const v = data.valor as Record<string, unknown>;
        return {
          tardeActiva: v.tardeActiva !== false,
          huecosManana: Array.isArray(v.huecosManana) && v.huecosManana.length > 0 ? (v.huecosManana as string[]) : HORARIO_DEFECTO.huecosManana,
          huecosTarde: Array.isArray(v.huecosTarde) && v.huecosTarde.length > 0 ? (v.huecosTarde as string[]) : HORARIO_DEFECTO.huecosTarde,
        };
      }
    } catch {
      // Si la tabla ajustes no existe todavía, pasa al fallback
    }
  }

  // Fallback con cookie
  try {
    const c = await cookies();
    const raw = c.get(COOKIE_HORARIO)?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          tardeActiva: parsed.tardeActiva !== false,
          huecosManana: Array.isArray(parsed.huecosManana) ? parsed.huecosManana : HORARIO_DEFECTO.huecosManana,
          huecosTarde: Array.isArray(parsed.huecosTarde) ? parsed.huecosTarde : HORARIO_DEFECTO.huecosTarde,
        };
      }
    }
  } catch {
    // Si no hay contexto de cookies
  }

  return HORARIO_DEFECTO;
}

/**
 * Guarda los horarios del taller.
 * Guarda en Supabase y también en cookie para máxima resiliencia.
 */
export async function guardarHorarioTaller(db: Db, horario: HorarioTaller): Promise<{ ok: boolean; enBd: boolean; error?: string }> {
  let enBd = false;

  try {
    const { error } = await db.from('ajustes').upsert({
      clave: CLAVE_HORARIO,
      valor: horario as unknown as Json,
      actualizado: new Date().toISOString(),
    });
    if (!error) {
      enBd = true;
    }
  } catch {
    // La tabla ajustes podría no existir
  }

  // Guardar siempre también en cookie para que no se pierda
  try {
    const c = await cookies();
    c.set(COOKIE_HORARIO, JSON.stringify(horario), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 año
    });
  } catch {
    // Error al escribir cookie
  }

  return { ok: true, enBd };
}
