import { NextResponse } from 'next/server';
import { PERSONAS } from '@/lib/constantes';
import { inicioDe } from '@/lib/permisos';
import { COOKIE_DEMO } from '@/lib/sesion';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const usuario = (url.searchParams.get('usuario') ?? 'paco').trim().toLowerCase();
  const destino = (url.searchParams.get('destino') ?? '').trim();
  const p = PERSONAS.find((x) => x.id === usuario) ?? PERSONAS[0];

  const ruta = destino && destino.startsWith('/') ? destino : inicioDe(p);
  const res = NextResponse.redirect(new URL(ruta, req.url));
  res.cookies.set(COOKIE_DEMO, p.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return res;
}
