'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccion, useAvisos } from '@/components/avisos';
import {
  guardarDatosTallerAccion,
  guardarConfiguracionIAAccion,
  probarClaveIAAccion,
  guardarTrabajadorAccion,
  crearTrabajadorAccion,
  eliminarTrabajadorAccion,
  cambiarClaveTrabajadorAccion,
  guardarConfiguracionWhatsAppAccion,
  probarEnvioWhatsAppAccion,
} from '@/app/acciones';
import type { DatosTaller, ConfiguracionIA, ConfiguracionWhatsApp } from '@/lib/ajustes';
import type { Persona } from '@/lib/tipos';

type Pestana = 'taller' | 'trabajadores' | 'ia' | 'whatsapp';

export function PanelConfiguracion({
  datosTallerInicial,
  configIAInicial,
  trabajadoresInicial,
  iaActivaInicial,
  configWhatsAppInicial,
}: {
  datosTallerInicial: DatosTaller;
  configIAInicial: ConfiguracionIA;
  trabajadoresInicial: Persona[];
  iaActivaInicial: boolean;
  configWhatsAppInicial: ConfiguracionWhatsApp;
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

  // ——— Estado WhatsApp ———
  const [whatsAppConfig, setWhatsAppConfig] = useState<ConfiguracionWhatsApp>(configWhatsAppInicial);
  const [verTokenWhatsApp, setVerTokenWhatsApp] = useState(false);
  const [telefonoPruebaWhatsApp, setTelefonoPruebaWhatsApp] = useState('');
  const [textoPruebaWhatsApp, setTextoPruebaWhatsApp] = useState('¡Hola! Mensaje de prueba desde el taller.');
  const [probandoWhatsApp, setProbandoWhatsApp] = useState(false);
  const [resultadoPruebaWhatsApp, setResultadoPruebaWhatsApp] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const [copiadoWebhook, setCopiadoWebhook] = useState(false);

  // ——— Estado Trabajadores ———
  const [trabajadores, setTrabajadores] = useState<Persona[]>(trabajadoresInicial);
  const [trabajadorEditando, setTrabajadorEditando] = useState<Persona | null>(null);
  const [creandoTrabajador, setCreandoTrabajador] = useState(false);
  const [nuevoTrabajador, setNuevoTrabajador] = useState({
    id: '',
    nombre: '',
    nombreCompleto: '',
    rol: 'mecanico' as Persona['rol'],
    rolEtiqueta: 'Mecánico',
    clave: '',
  });
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
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

  // ——— Guardar WhatsApp ———
  const handleGuardarWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutar(
      () => guardarConfiguracionWhatsAppAccion(whatsAppConfig),
      (r) => {
        if (r.ok) {
          avisar(r.mensaje || 'Configuración de WhatsApp guardada.');
          router.refresh();
        }
      }
    );
  };

  // ——— Probar WhatsApp ———
  const handleProbarWhatsApp = async () => {
    if (!whatsAppConfig.token?.trim() || !whatsAppConfig.phoneId?.trim()) {
      setResultadoPruebaWhatsApp({
        ok: false,
        mensaje: 'Introduce primero el Token de Meta y el Phone Number ID para poder probar el envío.',
      });
      return;
    }
    if (!telefonoPruebaWhatsApp.trim()) {
      setResultadoPruebaWhatsApp({
        ok: false,
        mensaje: 'Escribe el número de teléfono de destino (con código de país, ej. 34600112233).',
      });
      return;
    }
    setProbandoWhatsApp(true);
    setResultadoPruebaWhatsApp(null);
    try {
      const r = await probarEnvioWhatsAppAccion(
        telefonoPruebaWhatsApp.trim(),
        textoPruebaWhatsApp.trim() || 'Prueba de conexión de WhatsApp desde el taller'
      );
      if (r.ok) {
        setResultadoPruebaWhatsApp({ ok: true, mensaje: r.mensaje || '¡Mensaje enviado con éxito por WhatsApp!' });
      } else {
        setResultadoPruebaWhatsApp({ ok: false, mensaje: r.error || 'Error al enviar mensaje por Meta API.' });
      }
    } catch {
      setResultadoPruebaWhatsApp({ ok: false, mensaje: 'Error al conectar con el servidor para probar WhatsApp.' });
    } finally {
      setProbandoWhatsApp(false);
    }
  };

  const copiarWebhook = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/api/whatsapp`
        : 'https://taller-blond.vercel.app/api/whatsapp';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiadoWebhook(true);
      setTimeout(() => setCopiadoWebhook(false), 2500);
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

  // ——— Crear Nuevo Trabajador ———
  const handleCrearTrabajador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTrabajador.id.trim() || !nuevoTrabajador.nombre.trim()) return;
    ejecutar(
      () =>
        crearTrabajadorAccion(
          {
            id: nuevoTrabajador.id.trim().toLowerCase() as Persona['id'],
            nombre: nuevoTrabajador.nombre.trim(),
            nombreCompleto: nuevoTrabajador.nombreCompleto.trim(),
            rol: nuevoTrabajador.rol,
            rolEtiqueta: nuevoTrabajador.rolEtiqueta.trim(),
          },
          nuevoTrabajador.clave?.trim()
        ),
      (r) => {
        if (r.ok) {
          avisar(r.mensaje || 'Trabajador añadido correctamente.');
          setCreandoTrabajador(false);
          router.refresh();
        }
      }
    );
  };

  // ——— Eliminar Trabajador ———
  const handleEliminarTrabajador = (id: string) => {
    ejecutar(
      () => eliminarTrabajadorAccion(id),
      (r) => {
        if (r.ok) {
          setTrabajadores((prev) => prev.filter((t) => t.id !== id));
          setEliminandoId(null);
          avisar(r.mensaje || 'Trabajador eliminado correctamente.');
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
        <button
          type="button"
          onClick={() => setPestana('whatsapp')}
          className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] flex items-center gap-2 transition-colors whitespace-nowrap ${
            pestana === 'whatsapp' ? 'border-rojo text-tinta' : 'border-transparent text-t2 hover:text-tinta'
          }`}
        >
          <span>💬</span> WhatsApp
          {whatsAppConfig.activo ? (
            <span className="w-2 h-2 rounded-full bg-verde shrink-0" title="WhatsApp Activado" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="WhatsApp Pausado / Desactivado" />
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
                Gestiona los nombres, roles, altas, bajas y contraseñas de acceso para cada trabajador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNuevoTrabajador({
                  id: '',
                  nombre: '',
                  nombreCompleto: '',
                  rol: 'mecanico',
                  rolEtiqueta: 'Mecánico',
                  clave: '',
                });
                setCreandoTrabajador(true);
              }}
              className="btn btn-rojo h-10 px-4 text-sm font-semibold flex items-center gap-2"
            >
              <span>➕</span> Añadir nuevo trabajador
            </button>
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
                    {t.id !== 'paco' && !esDueno && (
                      <button
                        type="button"
                        onClick={() => setEliminandoId(t.id)}
                        className="btn btn-borde h-9 px-3 text-sm font-semibold text-rojo hover:bg-rojo-50 hover:border-rojo-300 ml-auto"
                        title="Eliminar trabajador"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
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

          {/* Modal Crear Nuevo Trabajador */}
          {creandoTrabajador && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-borde flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold m-0">Añadir nuevo trabajador</h3>
                  <button
                    type="button"
                    onClick={() => setCreandoTrabajador(false)}
                    className="text-t2 hover:text-tinta text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCrearTrabajador} className="flex flex-col gap-3.5">
                  <label className="etiqueta">
                    Nombre de usuario (para iniciar sesión)
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t2 font-semibold">@</span>
                      <input
                        type="text"
                        required
                        pattern="^[a-zA-Z0-9_-]{2,30}$"
                        className="campo h-11 text-base pl-8 font-mono lowercase"
                        value={nuevoTrabajador.id}
                        onChange={(e) =>
                          setNuevoTrabajador({
                            ...nuevoTrabajador,
                            id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                          })
                        }
                        placeholder="ej. carlos, mario, ana..."
                      />
                    </div>
                    <span className="text-xs text-t2 mt-0.5">
                      Solo letras minúsculas, números o guiones (ej. carlos).
                    </span>
                  </label>

                  <label className="etiqueta">
                    Nombre corto (para botones y citas)
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base mt-1"
                      value={nuevoTrabajador.nombre}
                      onChange={(e) =>
                        setNuevoTrabajador({ ...nuevoTrabajador, nombre: e.target.value })
                      }
                      placeholder="Ej. Carlos"
                    />
                  </label>

                  <label className="etiqueta">
                    Nombre y apellidos completo
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base mt-1"
                      value={nuevoTrabajador.nombreCompleto}
                      onChange={(e) =>
                        setNuevoTrabajador({ ...nuevoTrabajador, nombreCompleto: e.target.value })
                      }
                      placeholder="Ej. Carlos Gómez"
                    />
                  </label>

                  <label className="etiqueta">
                    Rol en la aplicación
                    <select
                      className="campo h-11 text-base mt-1"
                      value={nuevoTrabajador.rol}
                      onChange={(e) => {
                        const rol = e.target.value as Persona['rol'];
                        const etiqueta =
                          rol === 'dueno' ? 'Dueño' : rol === 'recepcion' ? 'Recepción' : 'Mecánico';
                        setNuevoTrabajador({ ...nuevoTrabajador, rol, rolEtiqueta: etiqueta });
                      }}
                    >
                      <option value="mecanico">Mecánico (vista móvil con sus coches)</option>
                      <option value="recepcion">Recepción (citas, clientes y tablero)</option>
                      <option value="dueno">Dueño (acceso total)</option>
                    </select>
                  </label>

                  <label className="etiqueta">
                    Etiqueta visible del puesto
                    <input
                      type="text"
                      required
                      className="campo h-11 text-base mt-1"
                      value={nuevoTrabajador.rolEtiqueta}
                      onChange={(e) =>
                        setNuevoTrabajador({ ...nuevoTrabajador, rolEtiqueta: e.target.value })
                      }
                      placeholder="Ej. Mecánico, Mecánica, Oficial de 1ª..."
                    />
                  </label>

                  <label className="etiqueta">
                    Contraseña de acceso inicial (mínimo 10 caracteres)
                    <input
                      type="password"
                      required
                      minLength={10}
                      className="campo h-11 text-base mt-1"
                      value={nuevoTrabajador.clave}
                      onChange={(e) =>
                        setNuevoTrabajador({ ...nuevoTrabajador, clave: e.target.value })
                      }
                      placeholder="••••••••••"
                    />
                    <span className="text-xs text-t2 mt-0.5">
                      Podrá cambiarse en cualquier momento desde esta misma pantalla.
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCreandoTrabajador(false)}
                      className="btn btn-borde h-10 px-4 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pendiente}
                      className="btn btn-rojo h-10 px-5 text-sm font-semibold"
                    >
                      {pendiente ? 'Creando…' : 'Crear trabajador'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Confirmar Eliminación */}
          {eliminandoId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-borde flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 text-rojo">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-lg font-bold m-0 text-tinta">Eliminar trabajador</h3>
                </div>
                <p className="text-sm text-t2 m-0 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar a{' '}
                  <b className="text-tinta">
                    {trabajadores.find((t) => t.id === eliminandoId)?.nombreCompleto || eliminandoId}
                  </b>{' '}
                  (@{eliminandoId})? Se borrará su acceso a la aplicación.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEliminandoId(null)}
                    className="btn btn-borde h-10 px-4 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() => handleEliminarTrabajador(eliminandoId)}
                    className="btn btn-rojo h-10 px-5 text-sm font-semibold"
                  >
                    {pendiente ? 'Eliminando…' : 'Sí, eliminar trabajador'}
                  </button>
                </div>
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

      {/* ——— PESTAÑA 4: WHATSAPP (META CLOUD API) ——— */}
      {pestana === 'whatsapp' && (
        <div className="flex flex-col gap-6">
          {/* Tarjeta de Estado y Activación */}
          <div className="tarjeta p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-[#F0FDF4] border-l-4 border-l-verde">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold m-0">Canal de WhatsApp Business</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    whatsAppConfig.activo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {whatsAppConfig.activo ? 'Activado' : 'Pausado / En preparación'}
                </span>
              </div>
              <p className="text-sm text-t2 mt-1 mb-0">
                {whatsAppConfig.activo
                  ? 'El canal de WhatsApp está activo. Los clientes pueden comunicarse con tu taller y el asistente responderá automáticamente.'
                  : 'El canal está pausado para que puedas introducir y comprobar tus claves con total tranquilidad antes de que los clientes lo usen.'}
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none bg-white px-4 py-2.5 rounded-xl border border-borde shadow-sm shrink-0">
              <input
                type="checkbox"
                checked={whatsAppConfig.activo}
                onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, activo: e.target.checked })}
                className="w-5 h-5 accent-verde cursor-pointer rounded"
              />
              <span className="font-semibold text-sm">
                {whatsAppConfig.activo ? 'WhatsApp Activo' : 'Pausar WhatsApp'}
              </span>
            </label>
          </div>

          {/* Formulario Principal de Configuración */}
          <form onSubmit={handleGuardarWhatsApp} className="tarjeta p-6 sm:p-7 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold m-0">Conexión con Meta Cloud API</h2>
              <p className="text-sm text-t2 mt-1 mb-0">
                Conecta tu cuenta de Meta for Developers para que el taller reciba y envíe mensajes de WhatsApp de forma oficial y gratuita.
              </p>
            </div>

            {/* Credenciales de Meta */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-tinta m-0">1. Credenciales de la API</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="etiqueta md:col-span-2">
                  Token de Acceso Permanente (System User Token)
                  <div className="relative mt-1">
                    <input
                      type={verTokenWhatsApp ? 'text' : 'password'}
                      className="campo h-11 text-base font-mono pr-24 text-xs sm:text-sm"
                      value={whatsAppConfig.token}
                      onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, token: e.target.value })}
                      placeholder="EAA..."
                    />
                    <button
                      type="button"
                      onClick={() => setVerTokenWhatsApp(!verTokenWhatsApp)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-t2 hover:text-tinta px-2 py-1 rounded bg-fondo"
                    >
                      {verTokenWhatsApp ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <span className="text-xs text-t2 mt-1 block">
                    Token generado en Meta Business Manager con permiso <code>whatsapp_business_messaging</code>.
                  </span>
                </label>

                <label className="etiqueta">
                  Identificador de Número de Teléfono (Phone Number ID)
                  <input
                    type="text"
                    className="campo h-11 text-base font-mono mt-1 text-xs sm:text-sm"
                    value={whatsAppConfig.phoneId}
                    onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, phoneId: e.target.value })}
                    placeholder="Ej. 104859201948271"
                  />
                  <span className="text-xs text-t2 mt-1 block">
                    Encuéntralo en Meta for Developers &gt; WhatsApp &gt; Configuración de la API.
                  </span>
                </label>

                <label className="etiqueta">
                  Teléfono público para enlace directo (wa.me)
                  <input
                    type="text"
                    className="campo h-11 text-base mt-1"
                    value={whatsAppConfig.telefonoVisible}
                    onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, telefonoVisible: e.target.value })}
                    placeholder="Ej. 34600123456 (con prefijo sin + ni espacios)"
                  />
                  <span className="text-xs text-t2 mt-1 block">
                    Si lo indicas, se mostrará un botón directo en el chat web para que los clientes abran WhatsApp.
                  </span>
                </label>
              </div>
            </div>

            {/* Configuración del Webhook */}
            <div className="flex flex-col gap-4 pt-4 border-t border-borde">
              <h3 className="text-base font-bold text-tinta m-0">2. Configuración del Webhook en Meta</h3>
              <p className="text-xs text-t2 m-0">
                Pega estos dos datos en la sección <b>WhatsApp &gt; Configuración del Webhook</b> dentro de tu panel de Meta for Developers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="etiqueta">
                  URL del Webhook (Callback URL)
                  <div className="relative mt-1 flex gap-2">
                    <input
                      type="text"
                      readOnly
                      className="campo h-11 text-xs sm:text-sm font-mono bg-fondo/60 cursor-text select-all"
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp` : 'https://taller-blond.vercel.app/api/whatsapp'}
                    />
                    <button
                      type="button"
                      onClick={copiarWebhook}
                      className="btn btn-blanco h-11 px-4 text-xs font-bold shrink-0"
                    >
                      {copiadoWebhook ? '✓ ¡Copiada!' : 'Copiar URL'}
                    </button>
                  </div>
                  <span className="text-xs text-t2 mt-1 block">
                    Dirección donde Meta notificará los mensajes entrantes de los clientes.
                  </span>
                </label>

                <label className="etiqueta">
                  Token de Verificación (Verify Token)
                  <div className="relative mt-1 flex gap-2">
                    <input
                      type="text"
                      className="campo h-11 text-xs sm:text-sm font-mono"
                      value={whatsAppConfig.verifyToken}
                      onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, verifyToken: e.target.value })}
                      placeholder="taller_secreto_whatsapp"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsAppConfig({
                          ...whatsAppConfig,
                          verifyToken: `wa_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`,
                        })
                      }
                      className="btn btn-blanco h-11 px-3 text-xs font-semibold shrink-0"
                      title="Generar token aleatorio"
                    >
                      Generar
                    </button>
                  </div>
                  <span className="text-xs text-t2 mt-1 block">
                    Pega este mismo texto en el campo <i>Token de verificación</i> de Meta.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={pendiente} className="btn btn-rojo h-11 px-6 text-base font-semibold">
                {pendiente ? 'Guardando…' : 'Guardar configuración de WhatsApp'}
              </button>
            </div>
          </form>

          {/* Tarjeta de Pruebas en Vivo */}
          <div className="tarjeta p-6 sm:p-7 flex flex-col gap-4 border-l-4 border-l-[#25D366]">
            <div>
              <h2 className="text-xl font-bold m-0 flex items-center gap-2">
                <span>🧪</span> Probar Envío de WhatsApp en Directo
              </h2>
              <p className="text-sm text-t2 mt-1 mb-0">
                Envía un mensaje de prueba a tu propio número de teléfono para verificar que el Token y el Phone Number ID funcionan correctamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="etiqueta">
                Teléfono de destino de la prueba
                <input
                  type="text"
                  className="campo h-11 text-base mt-1"
                  value={telefonoPruebaWhatsApp}
                  onChange={(e) => setTelefonoPruebaWhatsApp(e.target.value)}
                  placeholder="Ej. 34600123456 (incluye prefijo internacional)"
                />
              </label>

              <label className="etiqueta">
                Texto del mensaje de prueba
                <input
                  type="text"
                  className="campo h-11 text-base mt-1"
                  value={textoPruebaWhatsApp}
                  onChange={(e) => setTextoPruebaWhatsApp(e.target.value)}
                  placeholder="Mensaje de prueba..."
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleProbarWhatsApp}
                disabled={probandoWhatsApp || !whatsAppConfig.token?.trim() || !whatsAppConfig.phoneId?.trim()}
                className="btn btn-verde h-11 px-5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {probandoWhatsApp ? 'Enviando prueba…' : '📲 Enviar mensaje de prueba ahora'}
              </button>

              <span className="text-xs text-t2">
                Recuerda que en el entorno de desarrollo de Meta, el destinatario debe estar añadido en números de prueba.
              </span>
            </div>

            {resultadoPruebaWhatsApp && (
              <div
                className={`p-3.5 rounded-lg border text-sm font-medium ${
                  resultadoPruebaWhatsApp.ok
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                    : 'bg-rojo-50 border-rojo-200 text-rojo'
                }`}
              >
                {resultadoPruebaWhatsApp.mensaje}
              </div>
            )}
          </div>

          {/* Guía Paso a Paso para el Cliente */}
          <div className="tarjeta p-6 sm:p-7 flex flex-col gap-4 bg-fondo/40">
            <div>
              <h2 className="text-lg font-bold m-0 flex items-center gap-2">
                <span>📖</span> Guía Rápida: Cómo conectar tu WhatsApp paso a paso
              </h2>
              <p className="text-sm text-t2 mt-1 mb-0">
                Sigue estos 4 sencillos pasos para activar el servicio cuando tú o tu cliente lo decidáis:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-borde flex flex-col gap-2">
                <div className="font-bold text-sm text-rojo flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rojo/10 text-rojo flex items-center justify-center text-xs">1</span>
                  Crear App en Meta
                </div>
                <p className="text-xs text-t2 m-0 leading-relaxed">
                  Entra en <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-rojo underline font-medium">developers.facebook.com</a>, pulsa en <b>Mis apps &gt; Crear app</b>, selecciona el tipo <b>Negocio</b> y añade el producto <b>WhatsApp</b>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-borde flex flex-col gap-2">
                <div className="font-bold text-sm text-rojo flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rojo/10 text-rojo flex items-center justify-center text-xs">2</span>
                  Copiar Token y Phone ID
                </div>
                <p className="text-xs text-t2 m-0 leading-relaxed">
                  En el menú lateral pulsa <b>WhatsApp &gt; Primeros pasos</b>. Copia el <b>Identificador de número de teléfono</b> y el <b>Token de acceso</b> y pégalos en los campos de arriba.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-borde flex flex-col gap-2">
                <div className="font-bold text-sm text-rojo flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rojo/10 text-rojo flex items-center justify-center text-xs">3</span>
                  Vincular el Webhook
                </div>
                <p className="text-xs text-t2 m-0 leading-relaxed">
                  En <b>WhatsApp &gt; Configuración</b>, pulsa en <b>Editar Webhook</b>. Pega la URL del Webhook y tu Token de verificación. Luego suscríbete al campo <b>messages</b>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-borde flex flex-col gap-2">
                <div className="font-bold text-sm text-rojo flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rojo/10 text-rojo flex items-center justify-center text-xs">4</span>
                  Probar y Activar
                </div>
                <p className="text-xs text-t2 m-0 leading-relaxed">
                  Envía un mensaje de prueba con el botón de arriba para verificar que todo responde. Cuando quieras abrirlo al público, marca la casilla <b>WhatsApp Activo</b> y pulsa Guardar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
