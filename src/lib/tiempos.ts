import 'server-only';
import { cookies } from 'next/headers';
import type { Db } from './supabase/servidor';

export type Tramo = { orden_id: string; mecanico_id: string; inicio: string; fin: string | null };
const COOKIE = 'tr_demo_tiempos';

async function demo(): Promise<boolean> {
  return Boolean((await cookies()).get('tr_demo_persona')?.value);
}

async function leerDemo(): Promise<Tramo[]> {
  try {
    const v: unknown = JSON.parse((await cookies()).get(COOKIE)?.value ?? '[]');
    return Array.isArray(v) ? v.filter((t): t is Tramo =>
      typeof t?.orden_id === 'string' && typeof t?.mecanico_id === 'string' &&
      typeof t?.inicio === 'string' && (t?.fin === null || typeof t?.fin === 'string')) : [];
  } catch { return []; }
}

async function guardarDemo(tramos: Tramo[]) {
  const valor = JSON.stringify(tramos);
  if (encodeURIComponent(valor).length > 3500) throw new Error('La demostración ha alcanzado el límite de registros de tiempo de este navegador.');
  (await cookies()).set(COOKIE, valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 });
}

export async function leerTiempos(db: Db, ordenId?: string): Promise<Tramo[]> {
  if (await demo()) {
    const todos = await leerDemo();
    return ordenId ? todos.filter((t) => t.orden_id === ordenId) : todos;
  }
  let consulta = db.from('tiempos_trabajo').select('orden_id,mecanico_id,inicio,fin');
  if (ordenId) consulta = consulta.eq('orden_id', ordenId);
  const { data, error } = await consulta;
  if (error) throw new Error('No se han podido cargar los tiempos. Comprueba que la base de datos está actualizada.');
  return data ?? [];
}

export async function cambiarTiempo(db: Db, mecanicoId: string, ordenId: string | null, esperada: string | null) {
  if (await demo()) {
    const tramos = await leerDemo();
    if (!ordenId && !tramos.some((t) => t.mecanico_id === mecanicoId && t.orden_id === esperada && !t.fin)) return;
    if (ordenId && tramos.some((t) => t.mecanico_id === mecanicoId && t.orden_id === ordenId && !t.fin)) return;
    const ahora = new Date().toISOString();
    for (const t of tramos) if (t.mecanico_id === mecanicoId && !t.fin) t.fin = ahora;
    if (ordenId) tramos.push({ orden_id: ordenId, mecanico_id: mecanicoId, inicio: ahora, fin: null });
    await guardarDemo(tramos);
    return;
  }
  const { error } = await db.rpc('cambiar_trabajo_activo', { p_orden: ordenId, p_esperada: esperada });
  if (error) throw new Error('No se ha podido cambiar el reloj. Comprueba que la base de datos está actualizada.');
}

export async function detenerTiempoDemoOrden(ordenId: string) {
  if (!(await demo())) return;
  const tramos = await leerDemo();
  const activos = tramos.filter((t) => t.orden_id === ordenId && !t.fin);
  if (!activos.length) return;
  const ahora = new Date().toISOString();
  for (const t of activos) t.fin = ahora;
  await guardarDemo(tramos);
}
