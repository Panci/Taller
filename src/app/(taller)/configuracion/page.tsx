import { dbSesion, exigirVista } from '@/lib/sesion';
import {
  leerDatosTaller,
  leerConfiguracionIA,
  leerTrabajadoresTaller,
  leerConfiguracionWhatsApp,
} from '@/lib/ajustes';
import { iaConfiguradaAsync } from '@/lib/ia/openrouter';
import { PanelConfiguracion } from '@/components/configuracion/panel';

export const dynamic = 'force-dynamic';

export default async function PaginaConfiguracion() {
  await exigirVista('configuracion');
  const db = await dbSesion();

  const [taller, configIA, trabajadores, iaActiva, configWhatsApp] = await Promise.all([
    leerDatosTaller(db),
    leerConfiguracionIA(db),
    leerTrabajadoresTaller(db),
    iaConfiguradaAsync(),
    leerConfiguracionWhatsApp(db),
  ]);

  return (
    <main className="px-4 sm:px-7 pt-6 pb-12 max-w-[1040px] w-full mx-auto flex flex-col gap-6">
      <div>
        <h1 className="m-0 text-[26px] font-bold">Configuración</h1>
        <div className="text-t2 text-sm mt-1">
          Ajustes generales del taller, trabajadores, conexión con inteligencia artificial y canal de WhatsApp.
        </div>
      </div>

      <PanelConfiguracion
        key={`${taller.nombre}-${trabajadores.map((t) => `${t.id}:${t.nombre}:${t.nombreCompleto}`).join(',')}-${configWhatsApp.activo}`}
        datosTallerInicial={taller}
        configIAInicial={configIA}
        trabajadoresInicial={trabajadores}
        iaActivaInicial={iaActiva}
        configWhatsAppInicial={configWhatsApp}
      />
    </main>
  );
}
