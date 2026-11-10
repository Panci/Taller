'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { borrarFotoDemo, fotosDemo, guardarFotoDemo } from '@/lib/fotos-demo';

type Foto = { id: string; descripcion: string; url: string };

async function prepararImagen(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith('image/') || archivo.size > 20 * 1024 * 1024) throw new Error('Selecciona una imagen de hasta 20 MB.');
  const bitmap = await createImageBitmap(archivo);
  try {
    if (bitmap.width * bitmap.height > 50_000_000) throw new Error('La imagen tiene demasiados píxeles.');
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se ha podido preparar la imagen.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error('No se ha podido preparar la imagen.');
    return blob;
  } finally { bitmap.close(); }
}

export function FotosOrden({ ordenId, demo, editable = false, informe = false }: {
  ordenId: string; demo: boolean; editable?: boolean; informe?: boolean;
}) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargada, setCargada] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const endpoint = `/api/ordenes/${encodeURIComponent(ordenId)}/fotos`;

  const cargar = useCallback(async () => {
    try {
      let lista: Foto[];
      if (demo) {
        const datos = await fotosDemo(ordenId);
        urls.current.forEach(URL.revokeObjectURL);
        urls.current = datos.map((f) => URL.createObjectURL(f.archivo));
        lista = datos.map((f, i) => ({ id: f.id, descripcion: f.descripcion, url: urls.current[i] }));
      } else {
        const r = await fetch(endpoint, { cache: 'no-store' });
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error || 'No se pueden cargar las fotos.');
        lista = datos.fotos.map((f: { id: string; descripcion: string }) => ({ ...f, url: `${endpoint}/${f.id}` }));
      }
      setFotos(lista); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pueden cargar las fotos.'); }
    finally { setCargada(true); }
  }, [demo, endpoint, ordenId]);

  useEffect(() => {
    void cargar();
    return () => { urls.current.forEach(URL.revokeObjectURL); urls.current = []; };
  }, [cargar]);

  const anadir = async () => {
    if (!archivo || ocupado) return;
    setOcupado(true); setError('');
    try {
      if (fotos.length >= 10) throw new Error('La orden admite hasta 10 fotos.');
      const imagen = await prepararImagen(archivo);
      if (demo) {
        await guardarFotoDemo({ id: crypto.randomUUID(), ordenId, descripcion: descripcion.trim().slice(0, 160), creada: new Date().toISOString(), archivo: imagen });
      } else {
        const form = new FormData(); form.set('foto', imagen, 'pieza.jpg'); form.set('descripcion', descripcion.trim());
        const r = await fetch(endpoint, { method: 'POST', body: form });
        if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'No se ha podido guardar la foto.'); }
      }
      setArchivo(null); setDescripcion(''); if (input.current) input.current.value = '';
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido guardar la foto.'); }
    finally { setOcupado(false); }
  };

  const quitar = async (id: string) => {
    setOcupado(true); setError('');
    try {
      if (demo) await borrarFotoDemo(id);
      else {
        const r = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('No se ha podido quitar la foto.');
      }
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido quitar la foto.'); }
    finally { setOcupado(false); }
  };

  if (informe && cargada && !fotos.length && !error) return null;
  return (
    <section className={informe ? 'flex flex-col gap-3' : 'bg-white border border-borde rounded-[14px] px-[18px] py-4 flex flex-col gap-3'} aria-label="Fotos de la reparación">
      <h2 className="titulo-seccion">Fotos de la reparación</h2>
      {error && <p className="text-sm text-rojo" role="alert">{error}</p>}
      {!cargada && <p className="text-sm text-t2">Cargando fotos…</p>}
      {cargada && !fotos.length && !error && <p className="text-sm text-t2">Todavía no hay fotos.</p>}
      <div className="grid grid-cols-2 gap-3">
        {fotos.map((f) => <figure key={f.id} className="min-w-0 flex flex-col gap-1 break-inside-avoid">
          {/* Fotos elegidas por el usuario: URLs locales o servidas con autorización. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.url} alt={f.descripcion || 'Pieza de la reparación'} className="w-full h-40 object-contain bg-fondo rounded-lg" />
          {f.descripcion && <figcaption className="text-sm">{f.descripcion}</figcaption>}
          {editable && <button type="button" className="text-sm text-rojo self-start no-imprimir" disabled={ocupado} onClick={() => void quitar(f.id)}>Quitar foto</button>}
        </figure>)}
      </div>
      {editable && <div className="flex flex-col gap-2 no-imprimir">
        <label className="etiqueta">Hacer o elegir foto<input ref={input} type="file" accept="image/*" capture="environment" className="campo" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} /></label>
        <label className="etiqueta">Descripción para el cliente <input className="campo" maxLength={160} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Pastillas de freno sustituidas" /></label>
        <button type="button" className="btn btn-borde h-10 px-4 text-sm self-start" disabled={!archivo || ocupado} onClick={() => void anadir()}>{ocupado ? 'Guardando…' : 'Añadir foto'}</button>
        {demo && <p className="text-xs text-t2">En la demo las fotos se guardan solo en este navegador.</p>}
      </div>}
    </section>
  );
}
