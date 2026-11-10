import { cookies } from 'next/headers';
import { leerOrden } from '@/lib/datos';
import { puedeTocarOrden } from '@/lib/permisos';
import { dbSesion, personaActual } from '@/lib/sesion';

async function buscar(ctx: { params: Promise<{ id: string; fotoId: string }> }, escritura: boolean) {
  const { id, fotoId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(fotoId)) return null;
  const actor = await personaActual();
  if (!actor || (await cookies()).get('tr_demo_persona')) return null;
  const db = await dbSesion();
  const orden = await leerOrden(db, id);
  if (!orden || !puedeTocarOrden(actor, orden) || (actor.rol === 'mecanico' && orden.estado === 'entregado') || (escritura && orden.estado === 'entregado')) return null;
  const { data } = await db.from('fotos_orden').select('ruta').eq('orden_id', id).eq('id', fotoId).maybeSingle();
  return data ? { db, ruta: data.ruta, fotoId } : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; fotoId: string }> }) {
  const foto = await buscar(ctx, false);
  if (!foto) return new Response('No encontrada', { status: 404 });
  const { data, error } = await foto.db.storage.from('fotos-orden').download(foto.ruta);
  if (error || !data) return new Response('No disponible', { status: 404 });
  return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; fotoId: string }> }) {
  const foto = await buscar(ctx, true);
  if (!foto) return Response.json({ error: 'No se puede eliminar esta foto.' }, { status: 404 });
  const { error } = await foto.db.storage.from('fotos-orden').remove([foto.ruta]);
  if (error) return Response.json({ error: 'No se ha podido eliminar la imagen.' }, { status: 503 });
  const res = await foto.db.from('fotos_orden').delete().eq('id', foto.fotoId);
  if (res.error) return Response.json({ error: 'No se ha podido actualizar la orden.' }, { status: 503 });
  return Response.json({ ok: true });
}
