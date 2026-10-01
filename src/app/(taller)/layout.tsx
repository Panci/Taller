import type { Metadata } from 'next';
import { Cabecera } from '@/components/cabecera';
import { Navegacion } from '@/components/navegacion';
import { AutoRefresco } from '@/components/auto-refresco';
import { dbSesion, personaObligatoria } from '@/lib/sesion';
import { vistasDe } from '@/lib/permisos';
import { pendientesDePersona } from '@/lib/datos';
import { fmtCabecera } from '@/lib/fechas';
import { iaConfiguradaAsync } from '@/lib/ia/openrouter';
import { leerDatosTaller, leerTrabajadoresTaller } from '@/lib/ajustes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LayoutTaller({ children }: { children: React.ReactNode }) {
  const yo = await personaObligatoria();
  const db = await dbSesion();
  const [pendientes, iaLista, datosTaller] = await Promise.all([
    yo.rol === 'mecanico' ? Promise.resolve(0) : pendientesDePersona(db),
    iaConfiguradaAsync(),
    leerDatosTaller(db),
    leerTrabajadoresTaller(db),
  ]);

  return (
    <div className="min-h-dvh flex flex-col has-[.pantalla-completa]:h-dvh">
      <Cabecera persona={yo} taller={datosTaller} />
      {yo.rol !== 'mecanico' && (
        <Navegacion vistas={vistasDe(yo)} pendientes={pendientes} fecha={fmtCabecera()} iaLista={iaLista} />
      )}
      {children}
      <AutoRefresco />
    </div>
  );
}
