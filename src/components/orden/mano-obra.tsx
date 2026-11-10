'use client';

import { useState } from 'react';
import { aprobarManoObraAccion, quitarManoObraAccion } from '@/app/acciones';
import { useAccion } from '@/components/avisos';
import { duracion, revisionTiempos, segundosTramo } from '@/lib/duracion';
import { aNumero, eur, precioEditable } from '@/lib/formato';
import type { Trabajo } from '@/lib/tipos';
import type { Tramo } from '@/lib/tiempos';

export function ManoObra({ ordenId, tramos, linea, cerrada, disponible }: {
  ordenId: string; tramos: Tramo[]; linea?: Trabajo; cerrada: boolean; disponible: boolean;
}) {
  const revision = revisionTiempos(tramos);
  const activos = tramos.some((t) => !t.fin);
  const segundos = tramos.reduce((s, t) => s + segundosTramo(t.inicio, t.fin, 0), 0);
  const previa = linea?.manoObra;
  const [horas, setHoras] = useState(previa && previa.revisionTiempos === revision ? String(previa.horas).replace('.', ',') : (segundos / 3600).toFixed(4).replace('.', ','));
  const [tarifa, setTarifa] = useState(previa ? precioEditable(previa.tarifa) : '');
  const [ajuste, setAjuste] = useState<string | null>(previa && previa.revisionTiempos === revision ? precioEditable(linea?.precio) : null);
  const { pendiente, ejecutar } = useAccion();
  const h = aNumero(horas), t = aNumero(tarifa);
  const calculado = h !== null && t !== null && h >= 0 && t >= 0 ? Math.round(h * t * 100) / 100 : null;
  const importe = ajuste ?? (calculado === null ? '' : precioEditable(calculado));
  const desactualizada = Boolean(previa && previa.revisionTiempos !== revision);

  return (
    <section className="tarjeta px-5 py-[18px] flex flex-col gap-3" aria-label="Revisión de mano de obra">
      <h2 className="titulo-seccion">Mano de obra</h2>
      {!disponible ? <p className="text-sm text-rojo">No se puede calcular sin cargar los tiempos.</p> : <>
        <p className="text-sm text-t2">Tiempo registrado y pausado: <b>{duracion(segundos)}</b>. {activos && 'Hay un reloj en marcha; páusalo antes de aprobar.'}</p>
        {previa && <p className="text-sm font-semibold">{desactualizada ? 'Hay tiempos nuevos: revisa de nuevo el importe aprobado.' : `Aprobada por ${previa.aprobadoPor}: ${eur(linea?.precio ?? 0)}.`}</p>}
        {!previa && <p className="text-sm text-t2">Pendiente de revisión. La propuesta no se suma al total hasta aprobarla.</p>}
        {!cerrada && <>
          <p className="text-sm text-t2">Comprueba si los precios de los trabajos ya incluyen mano de obra para evitar cobrarla dos veces. Los importes llevan IVA incluido.</p>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="etiqueta flex-1 min-w-[105px]">Horas facturables
              <input className="campo" inputMode="decimal" value={horas} onChange={(e) => { setHoras(e.target.value); setAjuste(null); }} />
            </label>
            <label className="etiqueta flex-1 min-w-[105px]">Tarifa €/hora
              <input className="campo" inputMode="decimal" value={tarifa} onChange={(e) => { setTarifa(e.target.value); setAjuste(null); }} />
            </label>
            <label className="etiqueta flex-1 min-w-[105px]">Importe final €
              <input className="campo" inputMode="decimal" value={importe} onChange={(e) => setAjuste(e.target.value)} />
            </label>
          </div>
          <div className="text-xs text-t2">Cálculo por horas: {calculado === null ? 'indica la tarifa' : eur(calculado)}. Puedes ajustar el importe final.</div>
          <div className="flex gap-2 flex-wrap"><button type="button" className="btn btn-negro h-10 px-4 text-sm self-start" disabled={pendiente || activos || !tramos.length}
            onClick={() => ejecutar(() => aprobarManoObraAccion(ordenId, { horas, tarifa, importe, revision }))}>
            {previa ? 'Revisar y aprobar de nuevo' : 'Aprobar e incluir en la orden'}
          </button>
          {previa && <button type="button" className="btn btn-borde h-10 px-4 text-sm" disabled={pendiente} onClick={() => ejecutar(() => quitarManoObraAccion(ordenId))}>Retirar del total</button>}</div>
        </>}
      </>}
    </section>
  );
}
