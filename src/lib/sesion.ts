// Quién ha entrado. La sesión es de Supabase Auth (cookies httpOnly); aquí se
// comprueba su firma y se saca la persona y el rol, que van en app_metadata
// (solo se pueden cambiar desde la base de datos, nunca desde la app).

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PERSONAS } from './constantes';
import { leerTrabajadoresTaller } from './ajustes';
import { inicioDe, puedeVer } from './permisos';
import { clienteSesion, supabaseConfigurado, type Db } from './supabase/servidor';
import { crearClienteDemo } from './supabase/demo';
import type { Persona, VistaId } from './tipos';

export const COOKIE_DEMO = 'tr_demo_persona';

async function personaDemo(): Promise<Persona | null> {
  try {
    const c = await cookies();
    const id = c.get(COOKIE_DEMO)?.value;
    if (!id) return null;
    return PERSONAS.find((p) => p.id === id) ?? null;
  } catch {
    return null;
  }
}

export const personaActual = cache(async (): Promise<Persona | null> => {
  const demo = await personaDemo();
  if (demo) return demo;
  if (!supabaseConfigurado()) return null;
  const db = await clienteSesion();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims) return null;
  const app = (data.claims.app_metadata ?? {}) as { persona?: unknown; rol?: unknown };
  const trabajadores = await leerTrabajadoresTaller(db);
  const p = trabajadores.find((x) => x.id === app.persona) ?? PERSONAS.find((x) => x.id === app.persona);
  // La persona tiene que existir.
  if (!p) return null;
  // El rol autenticado en app_metadata es la autoridad de seguridad.
  const rolVerificado = (app.rol as Persona['rol']) || p.rol;
  return { ...p, rol: rolVerificado };
});

/** Cliente de Supabase con la sesión de quien ha entrado (o base de datos Demo instantánea). */
export const dbSesion = async (): Promise<Db> => {
  const demo = await personaDemo();
  if (demo) return crearClienteDemo(demo.id, demo.rol);
  return clienteSesion();
};

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Acepta "paco", "Paco", "Lucía", "lucia", "Rubén Ortega"… y nombres personalizados */
export function usuarioDe(texto: string, trabajadores?: Persona[]): Persona | undefined {
  const t = sinAcentos(texto);
  if (!t) return undefined;
  const lista = trabajadores && trabajadores.length > 0 ? trabajadores : PERSONAS;
  const encontrada = lista.find((p) => p.id === t || sinAcentos(p.nombre) === t || sinAcentos(p.nombreCompleto) === t);
  if (encontrada) return encontrada;
  return PERSONAS.find((p) => p.id === t || sinAcentos(p.nombre) === t || sinAcentos(p.nombreCompleto) === t);
}

/** Para páginas: sin sesión, a la pantalla de entrar. */
export async function personaObligatoria(): Promise<Persona> {
  const p = await personaActual();
  if (!p) redirect('/entrar');
  return p;
}

/** Para páginas: si la persona no puede ver esta sección, la manda a su inicio. */
export async function exigirVista(vista: VistaId): Promise<Persona> {
  const p = await personaObligatoria();
  if (!puedeVer(p, vista)) redirect(inicioDe(p));
  return p;
}
