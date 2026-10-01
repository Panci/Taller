import { cookies } from 'next/headers';
import type { Db } from './supabase/servidor';
import type { Json } from './supabase/tipos-bd';
import {
  HORARIO_DEFECTO,
  PERSONAS,
  TALLER,
  type HorarioTaller,
  actualizarMemoriaTaller,
  actualizarMemoriaTrabajadores,
} from './constantes';
import type { Persona } from './tipos';

// Claves de la tabla 'ajustes' en Supabase
const CLAVE_HORARIO = 'horarios_citas';
const CLAVE_TALLER = 'datos_taller';
const CLAVE_IA = 'ia_config';
const CLAVE_TRABAJADORES = 'trabajadores_taller';

// Claves de cookies para máxima resiliencia
const COOKIE_HORARIO = 'taller_horario_cfg';
const COOKIE_TALLER = 'taller_datos_cfg';
const COOKIE_IA = 'taller_ia_cfg';
const COOKIE_TRABAJADORES = 'taller_trabajadores_cfg';

// ——— HORARIOS ———

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
      // Fallback
    }
  }

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
    // Sin contexto de cookies
  }

  return HORARIO_DEFECTO;
}

export async function guardarHorarioTaller(db: Db, horario: HorarioTaller): Promise<{ ok: boolean; enBd: boolean; error?: string }> {
  let enBd = false;
  try {
    const { error } = await db.from('ajustes').upsert({
      clave: CLAVE_HORARIO,
      valor: horario as unknown as Json,
      actualizado: new Date().toISOString(),
    });
    if (!error) enBd = true;
  } catch {
    // Si la tabla no responde
  }

  try {
    const c = await cookies();
    c.set(COOKIE_HORARIO, JSON.stringify(horario), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  } catch {
    // Sin cookies
  }

  return { ok: true, enBd };
}

// ——— DATOS DEL TALLER ———

export interface DatosTaller {
  nombre: string;
  lema: string;
  ciudad: string;
  direccion: string;
  cp: string;
  telefono: string;
  email: string;
  web: string;
  garantia: string;
}

export const DATOS_TALLER_DEFECTO: DatosTaller = {
  nombre: TALLER.nombre,
  lema: TALLER.lema,
  ciudad: TALLER.ciudad,
  direccion: TALLER.direccion,
  cp: TALLER.cp,
  telefono: TALLER.telefono,
  email: TALLER.email,
  web: TALLER.web,
  garantia: TALLER.garantia,
};

export async function leerDatosTaller(db?: Db | null): Promise<DatosTaller> {
  if (db) {
    try {
      const { data, error } = await db
        .from('ajustes')
        .select('valor')
        .eq('clave', CLAVE_TALLER)
        .maybeSingle();

      if (!error && data?.valor && typeof data.valor === 'object') {
        const v = data.valor as Record<string, unknown>;
        const res: DatosTaller = {
          nombre: String(v.nombre || DATOS_TALLER_DEFECTO.nombre).trim(),
          lema: String(v.lema || DATOS_TALLER_DEFECTO.lema).trim(),
          ciudad: String(v.ciudad || DATOS_TALLER_DEFECTO.ciudad).trim(),
          direccion: String(v.direccion || DATOS_TALLER_DEFECTO.direccion).trim(),
          cp: String(v.cp || DATOS_TALLER_DEFECTO.cp).trim(),
          telefono: String(v.telefono || DATOS_TALLER_DEFECTO.telefono).trim(),
          email: String(v.email || DATOS_TALLER_DEFECTO.email).trim(),
          web: String(v.web || DATOS_TALLER_DEFECTO.web).trim(),
          garantia: String(v.garantia || DATOS_TALLER_DEFECTO.garantia).trim(),
        };
        actualizarMemoriaTaller(res);
        return res;
      }
    } catch {
      // Fallback
    }
  }

  try {
    const c = await cookies();
    const raw = c.get(COOKIE_TALLER)?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const res: DatosTaller = {
          ...DATOS_TALLER_DEFECTO,
          ...parsed,
        };
        actualizarMemoriaTaller(res);
        return res;
      }
    }
  } catch {
    //
  }

  return DATOS_TALLER_DEFECTO;
}

export async function guardarDatosTaller(db: Db, datos: DatosTaller): Promise<{ ok: boolean; enBd: boolean; error?: string }> {
  let enBd = false;
  actualizarMemoriaTaller(datos);
  try {
    const { error } = await db.from('ajustes').upsert({
      clave: CLAVE_TALLER,
      valor: datos as unknown as Json,
      actualizado: new Date().toISOString(),
    });
    if (!error) enBd = true;
  } catch {
    //
  }

  try {
    const c = await cookies();
    c.set(COOKIE_TALLER, JSON.stringify(datos), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  } catch {
    //
  }

  return { ok: true, enBd };
}

// ——— CONFIGURACIÓN DE IA (OPENROUTER) ———

export interface ConfiguracionIA {
  apiKey: string;
  modeloTexto: string;
  modeloAudio: string;
}

export const CONFIG_IA_DEFECTO: ConfiguracionIA = {
  apiKey: '',
  modeloTexto: 'google/gemini-3-flash-preview',
  modeloAudio: 'google/gemini-3-flash-preview',
};

// Memoria volátil en proceso para acceso ultra-rápido en llamadas de servidor
let memoriaClaveIA = '';

export async function leerConfiguracionIA(db?: Db | null): Promise<ConfiguracionIA> {
  const envKey = process.env.OPENROUTER_API_KEY?.trim() || '';
  let clave = memoriaClaveIA || envKey;
  let modeloTexto = process.env.OPENROUTER_MODEL?.trim() || CONFIG_IA_DEFECTO.modeloTexto;
  let modeloAudio = process.env.OPENROUTER_AUDIO_MODEL?.trim() || CONFIG_IA_DEFECTO.modeloAudio;

  if (db) {
    try {
      const { data, error } = await db
        .from('ajustes')
        .select('valor')
        .eq('clave', CLAVE_IA)
        .maybeSingle();

      if (!error && data?.valor && typeof data.valor === 'object') {
        const v = data.valor as Record<string, unknown>;
        if (typeof v.apiKey === 'string' && v.apiKey.trim()) {
          clave = v.apiKey.trim();
          memoriaClaveIA = clave;
        }
        if (typeof v.modeloTexto === 'string' && v.modeloTexto.trim()) {
          modeloTexto = v.modeloTexto.trim();
        }
        if (typeof v.modeloAudio === 'string' && v.modeloAudio.trim()) {
          modeloAudio = v.modeloAudio.trim();
        }
        return { apiKey: clave, modeloTexto, modeloAudio };
      }
    } catch {
      //
    }
  }

  try {
    const c = await cookies();
    const raw = c.get(COOKIE_IA)?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.apiKey) clave = parsed.apiKey;
        if (parsed.modeloTexto) modeloTexto = parsed.modeloTexto;
        if (parsed.modeloAudio) modeloAudio = parsed.modeloAudio;
      }
    }
  } catch {
    //
  }

  return { apiKey: clave, modeloTexto, modeloAudio };
}

export async function guardarConfiguracionIA(db: Db, config: ConfiguracionIA): Promise<{ ok: boolean; enBd: boolean; error?: string }> {
  let enBd = false;
  memoriaClaveIA = config.apiKey.trim();

  try {
    const { error } = await db.from('ajustes').upsert({
      clave: CLAVE_IA,
      valor: config as unknown as Json,
      actualizado: new Date().toISOString(),
    });
    if (!error) enBd = true;
  } catch {
    //
  }

  try {
    const c = await cookies();
    c.set(COOKIE_IA, JSON.stringify(config), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  } catch {
    //
  }

  return { ok: true, enBd };
}

// ——— TRABAJADORES DEL TALLER ———

export async function leerTrabajadoresTaller(db?: Db | null): Promise<Persona[]> {
  // 1. Intentar leer de la tabla 'personas'
  if (db) {
    try {
      const { data, error } = await db.from('personas').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((f: { id: string; nombre: string; nombre_completo: string; rol: string; rol_etiqueta: string }) => ({
          id: f.id as Persona['id'],
          nombre: f.nombre,
          nombreCompleto: f.nombre_completo,
          rol: f.rol as Persona['rol'],
          rolEtiqueta: f.rol_etiqueta,
        }));
      }
    } catch {
      //
    }
  }

  // 2. Intentar leer de la tabla ajustes (clave 'trabajadores_taller')
  if (db) {
    try {
      const { data, error } = await db.from('ajustes').select('valor').eq('clave', CLAVE_TRABAJADORES).maybeSingle();
      if (!error && Array.isArray(data?.valor)) {
        const res = data.valor as unknown as Persona[];
        actualizarMemoriaTrabajadores(res);
        return res;
      }
    } catch {
      //
    }
  }

  // 3. Fallback con cookie
  try {
    const c = await cookies();
    const raw = c.get(COOKIE_TRABAJADORES)?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        actualizarMemoriaTrabajadores(parsed);
        return parsed;
      }
    }
  } catch {
    //
  }

  actualizarMemoriaTrabajadores(PERSONAS);
  return PERSONAS;
}

export async function guardarTrabajadorTaller(db: Db, p: Persona): Promise<{ ok: boolean; enBd: boolean; error?: string }> {
  let enBd = false;

  // Actualizar tabla personas si está disponible
  try {
    const { error } = await db.from('personas').upsert({
      id: p.id,
      nombre: p.nombre,
      nombre_completo: p.nombreCompleto,
      rol: p.rol,
      rol_etiqueta: p.rolEtiqueta,
    });
    if (!error) enBd = true;
  } catch {
    //
  }

  // Actualizar lista en ajustes y memoria
  try {
    const actuales = await leerTrabajadoresTaller(db);
    const idx = actuales.findIndex((x) => x.id === p.id);
    const nuevaLista = idx >= 0
      ? actuales.map((x) => (x.id === p.id ? p : x))
      : [...actuales, p];

    actualizarMemoriaTrabajadores(nuevaLista);

    const { error } = await db.from('ajustes').upsert({
      clave: CLAVE_TRABAJADORES,
      valor: nuevaLista as unknown as Json,
      actualizado: new Date().toISOString(),
    });
    if (!error) enBd = true;

    try {
      const c = await cookies();
      c.set(COOKIE_TRABAJADORES, JSON.stringify(nuevaLista), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
      });
    } catch {
      //
    }
  } catch {
    //
  }

  return { ok: true, enBd };
}
