import Link from 'next/link';
import { cerrarSesion } from '@/app/acceso';
import { PERSONAS } from '@/lib/constantes';
import type { Persona } from '@/lib/tipos';

import type { DatosTaller } from '@/lib/ajustes';

// Arriba a la derecha: quién ha entrado, cambio rápido de rol en 1 clic (para demos) y botón para salir.
export function Cabecera({ persona, taller }: { persona: Persona; taller?: DatosTaller }) {
  const nombre = taller?.nombre || 'Talleres Ruiz';
  const iniciales = nombre.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TR';
  const subtitulo = taller?.lema
    ? `${taller.lema}${taller.ciudad ? ` · ${taller.ciudad}` : ''}`
    : 'Mecánica y electricidad del automóvil · Getafe';

  const demos = PERSONAS.filter((p) => ['paco', 'lucia', 'javi'].includes(p.id));

  return (
    <header className="no-imprimir bg-white border-b border-borde px-4 sm:px-7 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <Link href="/" className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-rojo rounded-md text-white font-bold text-base flex items-center justify-center shrink-0">
          {iniciales}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[17px] leading-[1.15]">{nombre}</div>
          <div className="text-xs text-t2 hidden sm:block">{subtitulo}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Selector rápido de perfil para demos en vivo sin contraseñas */}
        <div className="flex items-center gap-1 bg-papel border border-borde rounded-lg p-1" title="Cambiar de perfil en 1 clic para la demo">
          <span className="text-[11px] font-mono uppercase text-t4 px-1.5 hidden md:inline">Vista Demo:</span>
          {demos.map((d) => {
            const activo = d.id === persona.id;
            return (
              <a
                key={d.id}
                href={`/api/demo?usuario=${d.id}`}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  activo ? 'bg-rojo text-white' : 'text-t2 hover:bg-white hover:text-tinta'
                }`}
              >
                {d.nombre} <span className="hidden sm:inline opacity-80 font-normal">({d.rolEtiqueta})</span>
              </a>
            );
          })}
        </div>

        <Link
          href="/presentacion"
          className="btn btn-borde h-[38px] px-3 text-xs sm:text-sm"
          title="Abrir presentación comercial AI Partner"
        >
          Presentación IA
        </Link>
        <Link
          href="/cuenta"
          className="hidden lg:flex flex-col items-start px-3 py-[5px] rounded-lg bg-tinta text-white leading-[1.2] hover:opacity-90"
          title={`${persona.nombreCompleto} · cambiar contraseña`}
        >
          <span className="text-sm font-semibold">{persona.nombre}</span>
          <span className="text-[11px] text-t6">{persona.rolEtiqueta}</span>
        </Link>
        <form action={cerrarSesion}>
          <button type="submit" className="btn btn-borde h-[38px] px-3 text-xs sm:text-sm">Salir</button>
        </form>
      </div>
    </header>
  );
}
