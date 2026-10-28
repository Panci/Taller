'use client';

import { useActionState } from 'react';
import { iniciarSesion, type EstadoEntrar } from '@/app/acceso';

export function FormEntrar() {
  const [estado, accion, pendiente] = useActionState<EstadoEntrar, FormData>(iniciarSesion, { error: '', usuario: '' });
  return (
    <div className="flex flex-col gap-4">
      <form action={accion} className="tarjeta p-6 flex flex-col gap-4">
        <h1 className="m-0 text-2xl font-bold">Entrar</h1>
        <label className="etiqueta">
          Usuario
          <input
            name="usuario"
            defaultValue={estado.usuario}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="Por ejemplo: lucia"
            className="campo h-12 text-base"
          />
        </label>
        <label className="etiqueta">
          Contraseña
          <input name="clave" type="password" autoComplete="current-password" required className="campo h-12 text-base" />
        </label>
        {estado.error && (
          <div role="alert" className="text-sm font-semibold text-rojo bg-rojo-50 border border-rojo-200 rounded-lg px-3 py-2">
            {estado.error}
          </div>
        )}
        <button type="submit" disabled={pendiente} className="btn btn-rojo h-12 text-base">
          {pendiente ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="tarjeta p-4 flex flex-col gap-2.5 bg-papel">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-t3">Acceso rápido Demo (1 clic)</span>
          <span className="text-[11px] font-mono text-t4">Sin contraseña</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href="/api/demo?usuario=paco" className="btn btn-borde w-full h-10 text-xs flex-col gap-0 py-1">
            <span className="font-bold text-tinta">Paco</span>
            <span className="text-[10px] text-t3 font-normal">Dueño</span>
          </a>
          <a href="/api/demo?usuario=lucia" className="btn btn-borde w-full h-10 text-xs flex-col gap-0 py-1">
            <span className="font-bold text-tinta">Lucía</span>
            <span className="text-[10px] text-t3 font-normal">Recepción</span>
          </a>
          <a href="/api/demo?usuario=javi" className="btn btn-borde w-full h-10 text-xs flex-col gap-0 py-1">
            <span className="font-bold text-tinta">Javi</span>
            <span className="text-[10px] text-t3 font-normal">Mecánico</span>
          </a>
        </div>
      </div>
    </div>
  );
}
