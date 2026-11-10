import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { cookies } from 'next/headers';
import { leerOrden } from '@/lib/datos';
import { puedeTocarOrden } from '@/lib/permisos';
import { dbSesion, personaActual } from '@/lib/sesion';

const MAXIMO = 3 * 1024 * 1024;

async function acceso(id: string, escritura: boolean) {
  const actor = await personaActual();
  if (!actor || (await cookies()).get('tr_demo_persona')) return null;
  const db = await dbSesion();
  const orden = await leerOrden(db, id);
  if (!orden || !puedeTocarOrden(actor, orden) || (actor.rol === 'mecanico' && orden.estado === 'entregado') || (escritura && orden.estado === 'entregado')) return null;
  return db;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await acceso(id, false);
  if (!db) return Response.json({ error: 'No tienes acceso a esta orden.' }, { status: 403 });
  const { data, error } = await db.from('fotos_orden').select('id,descripcion,creada').eq('orden_id', id).order('creada');
  if (error) return Response.json({ error: 'No se pueden cargar las fotos. Comprueba la configuración de almacenamiento.' }, { status: 503 });
  return Response.json({ fotos: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await acceso(id, true);
  if (!db) return Response.json({ error: 'No puedes añadir fotos a esta orden.' }, { status: 403 });
  const longitud = Number(req.headers.get('content-length') || 0);
  if (longitud > MAXIMO + 32_768) return Response.json({ error: 'La imagen es demasiado grande.' }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const archivo = form?.get('foto');
  const descripcion = String(form?.get('descripcion') ?? '').trim().slice(0, 160);
  if (!(archivo instanceof Blob) || !archivo.size || archivo.size > MAXIMO) return Response.json({ error: 'Selecciona una imagen de hasta 3 MB.' }, { status: 400 });
  const { count, error: errorConteo } = await db.from('fotos_orden').select('id', { count: 'exact', head: true }).eq('orden_id', id);
  if (errorConteo) return Response.json({ error: 'No se pueden guardar fotos. Comprueba la configuración de almacenamiento.' }, { status: 503 });
  if ((count ?? 0) >= 10) return Response.json({ error: 'La orden admite hasta 10 fotos.' }, { status: 400 });
  let imagen: Buffer;
  try {
    imagen = await sharp(Buffer.from(await archivo.arrayBuffer()), { limitInputPixels: 25_000_000, failOn: 'error' }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  } catch { return Response.json({ error: 'El archivo no es una imagen válida.' }, { status: 400 }); }
  if (imagen.length > MAXIMO) return Response.json({ error: 'La imagen es demasiado grande.' }, { status: 413 });
  const fotoId = randomUUID();
  const ruta = `${id}/${fotoId}.jpg`;
  const { error: errorSubida } = await db.storage.from('fotos-orden').upload(ruta, imagen, { contentType: 'image/jpeg', upsert: false });
  if (errorSubida) return Response.json({ error: 'No se ha podido guardar la imagen.' }, { status: 503 });
  const { error } = await db.from('fotos_orden').insert({ id: fotoId, orden_id: id, ruta, descripcion });
  if (error) {
    await db.storage.from('fotos-orden').remove([ruta]);
    return Response.json({ error: 'No se ha podido guardar la foto en la orden.' }, { status: 503 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
