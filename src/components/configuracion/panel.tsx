'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccion, useAvisos } from '@/components/avisos';
import {
  guardarDatosTallerAccion,
  guardarConfiguracionIAAccion,
  probarClaveIAAccion,
  guardarTrabajadorAccion,
  cambiarClaveTrabajadorAccion,
} from '@/app/acciones';
import type { DatosTaller, ConfiguracionIA } from '@/lib/ajustes';
import type { Persona } from '@/lib/tipos';

type Pestana = 'taller' | 'trabajadores' | 'ia';

export function PanelConfiguracion({
  datosTallerInicial,
  configIAInicial,
  trabajadoresInicial,
  iaActivaInicial,
}: {
  datosTallerInicial: DatosTaller;
  configIAInicial: ConfiguracionIA;
  trabajadoresInicial: Persona[];
  iaActivaInicial: boolean;
}) {
  const router = useRouter();
  const avisar = useAvisos();
  const { pendiente, ejecutar } = useAccion();

  const [pestana, setPestana] = useState<Pestana>('taller');

  // ——— Estado Datos Taller ———
  const [taller, setTaller] = useState<DatosTaller>(datosTallerInicial);

  // ——— Estado IA ———
  const [iaConfig, setIaConfig] = useState<ConfiguracionIA>(configIAInicial);
  const [verClave, setVerClave] = useState(false);
  const [probandoIA, setProbandoIA] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const [trabajadores, setTrabajadores] = useState<Persona[]>(trabajadoresInicial);
  const [trabajadorEditando, setTrabajadorEditando] = useState<Persona | null>(null);
  const [cambiandoClaveId, setCambiandoClaveId] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState('');
  const [repetirClave, setRepetirClave] = useState('');

  // ——— Guardar Taller ———
  const handleGuardarTaller = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutar(
      () => guardarDatosTallerAccion(taller),
      (r) => {
        if (r.ok) {
          avisar(r.mensaje || 'Datos del taller guardados.');
          router.refresh();
        }
      }
    );
  };

  // ——— Guardar IA ———
  const handleGuardarIA = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutar(
      () => guardarConfiguracionIAAccion(iaConfig),
      (r) => {
        if (r.ok) {
          avisar(r.mensaje || 'Configuración de IA guardada.');
          router.refresh();
        }
      }
    );
  };

  // ——— Probar Conexión IA ———
  const handleProbarIA = async () => {
    if (!iaConfig.apiKey?.trim()) {
      setResultadoPrueba({ ok: false, mensaje: 'Escribe primero la clave de OpenRouter para poder probarla.' });
      return;
    }
    setProbandoIA(true);
    setResultadoPrueba(null);
    try {
      const r = await probarClaveIAAccion(iaConfig.apiKey.trim());
      if (r.ok) {
        setResultadoPrueba({ ok: true, mensaje: r.mensaje || '¡Conexión exitosa! La clave es válida.' });
      } else {
        setResultadoPrueba({ ok: false, mensaje: r.error || 'La clave fue rechazada por OpenRouter.' });
      }
    } catch {
      setResultadoPrueba({ ok: false, mensaje: 'Error al conectar con el servidor para probar la clave.' });
    } finally {
      setProbandoIA(false);
    }
  };

  // ——— Guardar Trabajador ———
  const handleGuardarTrabajador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajadorEditando) return;
    ejecutar(
      () => guardarTrabajadorAccion(trabajadorEditando),
      (r) => {
        if (r.ok) {
          setTrabajadores((prev) => prev.map((t) => (t.id === trabajadorEditando.id ? trabajadorEditando : t)));
          setTrabajadorEditando(null);
          avisar(r.mensaje || 'Trabajador guardado.');
          router.refresh();
        }
      }
    );
  };

  // ——— Cambiar Clave de Trabajador ———
  const handleCambiarClave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cambiandoClaveId) return;
    if (nuevaClave.length < 10) {
      avisar('La contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (nuevaClave !== repetirClave) {
      avisar('Las contraseñas no coinciden.');
      return;
    }
    ejecutar(
      () => cambiarClaveTrabajadorAccion(cambiandoClaveId, nuevaClave),
      (r) => {
        if (r.ok) {
          setCambiandoClaveId(null);
          setNuevaClave('');
          setRepetirClave('');
          avisar('Contraseña actualizada correctamente.');
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de pestañas */}
      <div className="flex border-b border-borde gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setPestana('taller')}
          className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] flex items-center gap-2 transition-colors whitespace-nowrap ${
            pestana === 'taller' ? 'border-rojo text-tinta' : 'border-transparent text-t2 hover:text-tinta'
          }`}
        >
          <span>🏢</span> Datos del Taller
        </button>
        <button
          type="button"
          onClick={() => setPestana('trabajadores')}
          className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] flex items-center gap-2 transition-colors whitespace-nowrap ${
            pestana === 'trabajadores' ? 'border-rojo text-tinta' : 'border-transparent text-t2 hover:text-tinta'
          }`}
        >
          <span>👥</span> Trabajadores
        </button>
        <button
          type="button"
          onClick={() => setPestana('ia')}
          className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] flex items-center gap-2 transition-colors whitespace-nowrap ${
            pestana === 'ia' ? 'border-rojo text-tinta' : 'border-transparent text-t2 hover:text-tinta'
          }`}
        >
          <span>🤖</span> Inteligencia Artificial
          {iaActivaInicial || Boolean(iaConfig.apiKey?.trim()) ? (
            <span className="w-2 h-2 rounded-full bg-verde shrink-0" title="IA Activa" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-rojo shrink-0" title="IA pendiente" />
          )}
        </button>
      </div>

      {/* ——— PESTAÑA 1: DATOS DEL TALLER ——— */}
      {pestana === 'taller' && (
        <form onSubmit={handleGuardarTaller} className="tarjeta p-6 sm:p-7 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold m-0">Información del Taller</h2>
            <p className="text-sm text-t2 mt-1 mb-0">
              Estos datos aparecen en la cabecera de la aplicación, en los informes para clientes y son utilizados por el asistente para atender las consultas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="etiqueta">
              Nombre del Taller
              <input
                type="text"
                required
                className="campo h-11 text-base font-semibold"
                value={taller.nombre}
                onChange={(e) => setTaller({ ...taller, nombre: e.target.value })}
                placeholder="Ej. Talleres Ruiz"
              />
            </label>

            <label className="etiqueta">
              Lema / Actividad
              <input
                type="text"
                className="campo h-11 text-base"
                value={taller.lema}
                onChange={(e) => setTaller({ ...taller, lema: e.target.value })}
                placeholder="Ej. Mecánica y electricidad del automóvil"
              />
            </label>

            <label className="etiqueta">
              Teléfono de contacto
              <input
                type="text"
                required
                className="campo h-11 text-base"
                value={taller.telefono}
                onChange={(e) => setTaller({ ...taller, telefono: e.target.value })}
                placeholder="Ej. 916 95 23 40"
              />
            </label>

            <label className="etiqueta">
              Correo electrónico
              <input
                type="email"
                className="campo h-11 text-base"
                value={taller.email}
                onChange={(e) => setTaller({ ...taller, email: e.target.value })}
                placeholder="Ej. taller@talleresruiz.es"
              />
            </label>

            <label className="etiqueta md:col-span-2">
              Dirección física
              <input
                type="text"
                className="campo h-11 text-base"
                value={taller.direccion}
                onChange={(e) => setTaller({ ...taller, direccion: e.target.value })}
                placeholder="Ej. C/ de Toledo, 48 · Pol. Ind. Los Olivos"
              />
            </label>

            <label className="etiqueta">
              Código Postal
              <input
                type="text"
                className="campo h-11 text-base"
                value={taller.cp}
                onChange={(e) => setTaller({ ...taller, cp: e.target.value })}
                placeholder="Ej. 28906"
              />
            </label>

            <label className="etiqueta">
              Ciudad y Provincia
              <input
                type="text"
                className="campo h-11 text-base"
                value={taller.ciudad}
                onChange={(e) => setTaller({ ...taller, ciudad: e.target.value })}
                placeholder="Ej. Getafe (Madrid)"
              />
            </label>

            <label className="etiqueta md:col-span-2">
              Página Web
              <input
                type="text"
                className="campo h-11 text-base"
                value={taller.web}
                onChange={(e) => setTaller({ ...taller, web: e.target.value })}
                placeholder="Ej. talleresruiz.es"
              />
            </label>

            <label className="etiqueta md:col-span-2">
              Texto de garantía (impreso en informes al cliente)
              <textarea
                rows={2}
                className="campo text-base p-2.5 resize-none"
                value={taller.garantia}
                onChange={(e) => setTaller({ ...taller, garantia: e.target.value })}
                placeholder="Ej. Garantía de 3 meses o 2.000 km en los trabajos realizados."
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={pendiente} className="btn btn-rojo h-11 px-6 text-base font-semibold">
              {pendiente ? 'Guardando…' : 'Guardar datos del taller'}
            </button>
          </div>
        </form>
      )}

      {/* ——— PESTAÑA 2: TRABAJADORES ——— */}
      {pestana === 'trabajadores' && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold m-0">Equipo del Taller</h2>
              <p className="text-sm text-t2 mt-1 mb-0">
                Gestiona los nombres, roles y contraseñas de acceso para cada trabajador.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trabajadores.map((t) => {
              const esMecanico = t.rol === 'mecanico';
              const esDueno = t.rol === 'dueno';

              return (
                <div key={t.id} className="tarjeta p-5 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full font-bold text-white flex items-center justify-center shrink-0 text-lg ${
                          esDueno ? 'bg-rojo' : esMecanico ? 'bg-azul' : 'bg-[#6D28D9]'
                        }`}
                      >
                        {t.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[17px] text-tinta">{t.nombreCompleto}</div>
                        <div className="text-xs text-t2">
                          Usuario: <span className="font-mono font-semibold text-tinta">@{t.id}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        esDueno
                          ? 'bg-rojo-50 text-rojo border-rojo-200'
                          : esMecanico
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {t.rolEtiqueta}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-borde flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTrabajadorEditando(t)}
                      className="btn btn-borde h-9 px-3 text-sm font-semibold"
                    >
                      ✏️ Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCambiandoClaveId(t.id);
                        setNuevaClave('');
                        setRepetirClave('');
                      }}
                      className="btn btn-borde h-9 px-3 text-sm font-semibold text-t2 hover:text-tinta"
                    >
                      🔑 Cambiar contraseña
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Edición de Trabajador */}
          {trabajadorEditando && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-borde flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold m-0">Editar trabajador (@{trabajadorEditando.id})</h3>
                  <button
                    type="button"
                    onClick={() => setTrabajadorEditando(null)}
                    className="text-t2 hover:text-tinta text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleGuardarTrabajador} className="flex flex-col gap-3.5">
                  <label className="etiqueta">
                    Nombre corto (para botones y citas)
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base"
                      value={trabajadorEditando.nombre}
                      onChange={(e) => setTrabajadorEditando({ ...trabajadorEditando, nombre: e.target.value })}
                    />
                  </label>

                  <label className="etiqueta">
                    Nombre y apellidos completo
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base"
                      value={trabajadorEditando.nombreCompleto}
                      onChange={(e) => setTrabajadorEditando({ ...trabajadorEditando, nombreCompleto: e.target.value })}
                    />
                  </label>

                  <label className="etiqueta">
                    Rol en la aplicación
                    <select
                      className="campo h-11 text-base"
                      value={trabajadorEditando.rol}
                      onChange={(e) => {
                        const rol = e.target.value as Persona['rol'];
                        const etiqueta = rol === 'dueno' ? 'Dueño' : rol === 'recepcion' ? 'Recepción' : 'Mecánico';
                        setTrabajadorEditando({ ...trabajadorEditando, rol, rolEtiqueta: etiqueta });
                      }}
                    >
                      <option value="dueno">Dueño (acceso total)</option>
                      <option value="recepcion">Recepción (citas, clientes y tablero)</option>
                      <option value="mecanico">Mecánico (vista móvil con sus coches)</option>
                    </select>
                  </label>

                  <label className="etiqueta">
                    Etiqueta visible del puesto
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base"
                      value={trabajadorEditando.rolEtiqueta}
                      onChange={(e) => setTrabajadorEditando({ ...trabajadorEditando, rolEtiqueta: e.target.value })}
                      placeholder="Ej. Mecánico jefe, Oficial de 1ª..."
                    />
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTrabajadorEditando(null)}
                      className="btn btn-borde h-10 px-4 text-sm"
                    >
                      Cancelar
                    </button>
                    <button type="submit" disabled={pendiente} className="btn btn-rojo h-10 px-5 text-sm font-semibold">
                      {pendiente ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Cambiar Contraseña */}
          {cambiandoClaveId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-borde flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold m-0">
                    Cambiar contraseña de @{cambiandoClaveId}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCambiandoClaveId(null)}
                    className="text-t2 hover:text-tinta text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-t2 m-0">
                  Al cambiarla, se cerrarán las sesiones activas de esta persona y tendrá que entrar con la nueva.
                </p>

                <form onSubmit={handleCambiarClave} className="flex flex-col gap-3.5">
                  <label className="etiqueta">
                    Nueva contraseña (mínimo 10 caracteres)
                    <input
                      type="password"
                      required
                      minLength={10}
                      className="campo h-11 text-base"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      placeholder="••••••••••"
                    />
                  </label>

                  <label className="etiqueta">
                    Repite la nueva contraseña
                    <input
                      type="password"
                      required
                      minLength={10}
                      className="campo h-11 text-base"
                      value={repetirClave}
                      onChange={(e) => setRepetirClave(e.target.value)}
                      placeholder="••••••••••"
                    />
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCambiandoClaveId(null)}
                      className="btn btn-borde h-10 px-4 text-sm"
                    >
                      Cancelar
                    </button>
                    <button type="submit" disabled={pendiente} className="btn btn-rojo h-10 px-5 text-sm font-semibold">
                      {pendiente ? 'Cambiando…' : 'Establecer contraseña'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ——— PESTAÑA 3: INTELIGENCIA ARTIFICIAL ——— */}
      {pestana === 'ia' && (
        <div className="flex flex-col gap-5">
          {/* Tarjeta de estado de IA */}
          <div
            className={`border rounded-xl p-5 flex items-start gap-4 ${
              iaActivaInicial || Boolean(iaConfig.apiKey?.trim())
                ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="text-3xl shrink-0">
              {iaActivaInicial || Boolean(iaConfig.apiKey?.trim()) ? '🟢' : '⚠️'}
            </div>
            <div>
              <div className="font-bold text-base text-tinta">
                {iaActivaInicial || Boolean(iaConfig.apiKey?.trim())
                  ? 'Inteligencia Artificial activa y disponible'
                  : 'Inteligencia Artificial sin configurar'}
              </div>
              <div className="text-sm text-t2 mt-0.5">
                {iaActivaInicial || Boolean(iaConfig.apiKey?.trim())
                  ? 'El asistente del chat público, la transcripción de notas de voz de los mecánicos y la generación de informes están listos.'
                  : 'Introduce una clave de OpenRouter para habilitar el dictado por voz de los mecánicos, el asistente web y los informes automáticos.'}
              </div>
            </div>
          </div>

          {/* Formulario de clave y modelos */}
          <form onSubmit={handleGuardarIA} className="tarjeta p-6 sm:p-7 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold m-0">Clave de API de OpenRouter</h2>
              <p className="text-sm text-t2 mt-1 mb-0">
                La clave se almacena de forma segura en el servidor y nunca se comparte con el navegador de los clientes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="etiqueta">
                OpenRouter API Key
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <input
                      type={verClave ? 'text' : 'password'}
                      className="campo h-11 text-base font-mono w-full pr-10"
                      value={iaConfig.apiKey}
                      onChange={(e) => {
                        setIaConfig({ ...iaConfig, apiKey: e.target.value });
                        setResultadoPrueba(null);
                      }}
                      placeholder="sk-or-v1-xxxxxxxxxxxxxxxx..."
                    />
                    <button
                      type="button"
                      onClick={() => setVerClave(!verClave)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-t2 hover:text-tinta text-sm"
                      title={verClave ? 'Ocultar' : 'Mostrar'}
                    >
                      {verClave ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleProbarIA}
                    disabled={probandoIA || !iaConfig.apiKey?.trim()}
                    className="btn btn-borde h-11 px-4 text-sm font-semibold shrink-0"
                  >
                    {probandoIA ? 'Probando…' : '⚡ Probar conexión'}
                  </button>
                </div>
              </label>

              {/* Resultado de la prueba */}
              {resultadoPrueba && (
                <div
                  className={`text-sm font-semibold p-3 rounded-lg border ${
                    resultadoPrueba.ok
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                      : 'bg-rojo-50 border-rojo-200 text-rojo'
                  }`}
                >
                  {resultadoPrueba.mensaje}
                </div>
              )}

              <p className="text-xs text-t2 m-0">
                ¿No tienes una clave? Puedes crear una cuenta y recargar saldo en{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rojo font-semibold hover:underline"
                >
                  openrouter.ai/keys ↗
                </a>
                . Se recomienda utilizar el modelo <b>Gemini 3 Flash</b> por su bajo coste y capacidad de audio nativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-borde">
              <label className="etiqueta">
                Modelo de Texto (chat e informes)
                <input
                  type="text"
                  className="campo h-11 text-base font-mono text-xs sm:text-sm"
                  value={iaConfig.modeloTexto}
                  onChange={(e) => setIaConfig({ ...iaConfig, modeloTexto: e.target.value })}
                  placeholder="google/gemini-3-flash-preview"
                />
              </label>

              <label className="etiqueta">
                Modelo de Audio (dictado mecánicos)
                <input
                  type="text"
                  className="campo h-11 text-base font-mono text-xs sm:text-sm"
                  value={iaConfig.modeloAudio}
                  onChange={(e) => setIaConfig({ ...iaConfig, modeloAudio: e.target.value })}
                  placeholder="google/gemini-3-flash-preview"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={pendiente} className="btn btn-rojo h-11 px-6 text-base font-semibold">
                {pendiente ? 'Guardando…' : 'Guardar configuración de IA'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
