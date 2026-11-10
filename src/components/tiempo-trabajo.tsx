'use client';

import { useEffect, useState } from 'react';
import { cambiarTiempoAccion } from '@/app/acciones';
import { useAccion } from '@/components/avisos';
import { duracion, segundosTramo } from '@/lib/duracion';
import type { Tramo } from '@/lib/tiempos';

export function TiempoTrabajo({ ordenId, tramos, mecanicoId, nombres, disponible = true }: {
  ordenId: string; tramos: Tramo[]; mecanicoId?: string;
  nombres?: Record<string, string>; disponible?: boolean;
}) {
  const [ahora, setAhora] = useState(0);
  const { pendiente, ejecutar } = useAccion();
  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const grupos = new Map<string, number>();
  for (const t of tramos) grupos.set(t.mecanico_id, (grupos.get(t.mecanico_id) ?? 0) + segundosTramo(t.inicio, t.fin, ahora));
  const activo = Boolean(mecanicoId && tramos.some((t) => t.mecanico_id === mecanicoId && !t.fin));
  const total = [...grupos.values()].reduce((a, b) => a + b, 0);

  return (
    <section className="bg-white border border-borde rounded-[14px] px-[18px] py-4 flex flex-col gap-2" aria-label="Tiempo de trabajo">
      <div className="flex items-center justify-between gap-3">
        <span className="titulo-seccion">Tiempo de trabajo</span>
        {activo && <span className="text-sm font-semibold text-green-700">● En marcha</span>}
      </div>
      {!disponible ? <p className="text-sm text-rojo">No se han podido cargar los tiempos. Comprueba la conexión y la configuración de la base de datos.</p> : <>
        <span className="text-xl font-bold tabular-nums">{duracion(total)}</span>
        {!mecanicoId && [...grupos].map(([id, segundos]) => <div key={id} className="flex justify-between text-sm"><span>{nombres?.[id] ?? id}</span><span className="tabular-nums">{duracion(segundos)}</span></div>)}
        {mecanicoId && <>
          <p className="text-sm text-t2">{activo ? 'El reloj sigue funcionando aunque cierres la ficha.' : 'Empieza al trabajar en este coche. Al activar otro, este se pausa.'}</p>
          <button type="button" className={`btn h-11 px-4 ${activo ? 'btn-borde' : 'btn-rojo'}`} disabled={pendiente}
            onClick={() => ejecutar(() => cambiarTiempoAccion(ordenId, !activo))}>
            {activo ? 'Pausar trabajo' : 'Empezar trabajo'}
          </button>
        </>}
      </>}
    </section>
  );
}
