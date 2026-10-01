'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { anularCitaAccion, reservarCitaAccion, actualizarCitaAccion, guardarHorariosAccion } from '@/app/acciones';
import { useAccion } from '@/components/avisos';
import { Matricula } from '@/components/ui';
import { HORARIO_DEFECTO, type HorarioTaller, huecosActivos } from '@/lib/constantes';

export interface DiaVista {
  fecha: string;
  nombre: string;
  corta: string;
  esHoy: boolean;
  pasado: boolean;
}

export interface CitaVista {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string;
  matricula: string;
  coche: string;
  motivo: string;
  origen: 'taller' | 'ia';
  ordenId: string | null;
  conversacionId: string | null;
}

const VACIO = { nombre: '', telefono: '', matricula: '', coche: '', motivo: '' };
const CAMPOS: [keyof typeof VACIO, string, string][] = [
  ['nombre', 'Cliente', 'Nombre y apellidos'],
  ['telefono', 'Teléfono', '600 000 000'],
  ['matricula', 'Matrícula', '1234 ABC'],
  ['coche', 'Coche', 'Marca y modelo'],
  ['motivo', 'Motivo', 'Qué le pasa o qué quiere hacer'],
];

const horaCorta = (h: string) => h.replace(/^0/, '');

function asegurarHorario(h?: Partial<HorarioTaller> | null): HorarioTaller {
  return {
    tardeActiva: h?.tardeActiva !== false,
    huecosManana: Array.isArray(h?.huecosManana) && h.huecosManana.length > 0 ? h.huecosManana : HORARIO_DEFECTO.huecosManana,
    huecosTarde: Array.isArray(h?.huecosTarde) && h.huecosTarde.length > 0 ? h.huecosTarde : HORARIO_DEFECTO.huecosTarde,
  };
}

export function SemanaCitas({
  dias,
  horarioInicial,
  citas,
}: {
  dias: DiaVista[];
  horarioInicial?: HorarioTaller;
  citas: CitaVista[];
}) {
  const router = useRouter();
  const [horario, setHorario] = useState<HorarioTaller>(() => asegurarHorario(horarioInicial));
  const [sel, setSel] = useState<{ fecha: string; hora: string } | null>(null);
  const [form, setForm] = useState(VACIO);

  // Estado para la edición de una cita existente
  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState<{
    fecha: string;
    hora: string;
    nombre: string;
    telefono: string;
    matricula: string;
    coche: string;
    motivo: string;
  }>({ fecha: '', hora: '', nombre: '', telefono: '', matricula: '', coche: '', motivo: '' });

  // Estado para el modal de configuración de horarios del taller
  const [modalHorarios, setModalHorarios] = useState(false);
  const [horarioDraft, setHorarioDraft] = useState<HorarioTaller>(() => asegurarHorario(horarioInicial));
  const [nuevaHoraManana, setNuevaHoraManana] = useState('');
  const [nuevaHoraTarde, setNuevaHoraTarde] = useState('');

  const { pendiente, ejecutar } = useAccion();

  // Variables seguras para el renderizado
  const manana = horario?.huecosManana ?? HORARIO_DEFECTO.huecosManana;
  const tarde = horario?.huecosTarde ?? HORARIO_DEFECTO.huecosTarde;
  const tardeActiva = horario?.tardeActiva !== false;

  const draftManana = horarioDraft?.huecosManana ?? HORARIO_DEFECTO.huecosManana;
  const draftTarde = horarioDraft?.huecosTarde ?? HORARIO_DEFECTO.huecosTarde;
  const draftTardeActiva = horarioDraft?.tardeActiva !== false;

  const citaEn = (fecha: string, hora: string) => citas.find((c) => c.fecha === fecha && c.hora === hora);
  const elegida = sel ? citaEn(sel.fecha, sel.hora) : undefined;
  const diaSel = sel ? dias.find((d) => d.fecha === sel.fecha) : undefined;
  const cuando = sel && diaSel ? `${diaSel.nombre} ${diaSel.corta} · ${horaCorta(sel.hora)}` : '';

  const todosHuecosActivos = huecosActivos(horario);

  // Reservar nueva cita
  const reservar = () => {
    if (!sel) return;
    ejecutar(
      () => reservarCitaAccion({ fecha: sel.fecha, hora: sel.hora, ...form }),
      (r) => {
        if (r.ok) {
          setForm(VACIO);
          router.refresh();
        }
      }
    );
  };

  // Iniciar edición de la cita seleccionada
  const empezarEdicion = () => {
    if (!elegida) return;
    setFormEdicion({
      fecha: elegida.fecha,
      hora: elegida.hora,
      nombre: elegida.nombre,
      telefono: elegida.telefono,
      matricula: elegida.matricula,
      coche: elegida.coche === '—' ? '' : elegida.coche,
      motivo: elegida.motivo === 'Sin especificar' ? '' : elegida.motivo,
    });
    setEditando(true);
  };

  // Guardar cambios en la cita existente
  const guardarEdicionCita = () => {
    if (!elegida) return;
    ejecutar(
      () => actualizarCitaAccion(elegida.id, formEdicion),
      (r) => {
        if (r.ok) {
          setSel({ fecha: formEdicion.fecha, hora: formEdicion.hora });
          setEditando(false);
          router.refresh();
        }
      }
    );
  };

  // Guardar nueva configuración de horarios del taller
  const guardarHorariosTaller = () => {
    ejecutar(
      () => guardarHorariosAccion(horarioDraft),
      (r) => {
        if (r.ok) {
          setHorario(horarioDraft);
          setModalHorarios(false);
          router.refresh();
        }
      }
    );
  };

  const agregarHora = (turno: 'manana' | 'tarde') => {
    const raw = turno === 'manana' ? nuevaHoraManana.trim() : nuevaHoraTarde.trim();
    if (!raw) return;
    const partes = raw.split(':');
    if (partes.length !== 2) return;
    const h = partes[0].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    const horaFmt = `${h}:${m}`;

    if (turno === 'manana') {
      if (!draftManana.includes(horaFmt)) {
        setHorarioDraft((prev) => ({
          ...asegurarHorario(prev),
          huecosManana: [...(prev?.huecosManana ?? HORARIO_DEFECTO.huecosManana), horaFmt].sort(),
        }));
      }
      setNuevaHoraManana('');
    } else {
      if (!draftTarde.includes(horaFmt)) {
        setHorarioDraft((prev) => ({
          ...asegurarHorario(prev),
          huecosTarde: [...(prev?.huecosTarde ?? HORARIO_DEFECTO.huecosTarde), horaFmt].sort(),
        }));
      }
      setNuevaHoraTarde('');
    }
  };

  const quitarHora = (turno: 'manana' | 'tarde', hora: string) => {
    if (turno === 'manana') {
      setHorarioDraft((prev) => ({
        ...asegurarHorario(prev),
        huecosManana: (prev?.huecosManana ?? HORARIO_DEFECTO.huecosManana).filter((x) => x !== hora),
      }));
    } else {
      setHorarioDraft((prev) => ({
        ...asegurarHorario(prev),
        huecosTarde: (prev?.huecosTarde ?? HORARIO_DEFECTO.huecosTarde).filter((x) => x !== hora),
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de opciones de calendario */}
      <div className="flex justify-between items-center bg-white border border-borde rounded-xl px-4 py-3 flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="font-semibold text-t3">Horario visible:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
            ☀️ Mañana ({manana.join(', ') || 'sin huecos'})
          </span>
          {tardeActiva && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-medium">
              🌙 Tarde ({tarde.join(', ') || 'sin huecos'})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setHorarioDraft(asegurarHorario(horario));
            setModalHorarios(true);
          }}
          className="btn btn-borde h-8.5 px-3 text-xs font-semibold text-t2 hover:text-tinta"
        >
          ⚙️ Configurar horarios
        </button>
      </div>

      <div className="flex gap-4 items-start flex-wrap">
        {/* Cuadrícula semanal de días */}
        <div className="flex-[3_1_720px] min-w-0 overflow-x-auto">
          <div className="grid grid-cols-[repeat(5,minmax(150px,1fr))] gap-2.5 min-w-[780px]">
            {dias.map((d) => {
              const huecosEstandar = [
                ...manana,
                ...(tardeActiva ? tarde : []),
              ];
              const citasExtra = citas.filter((c) => c.fecha === d.fecha && !huecosEstandar.includes(c.hora));

              const renderBoton = (h: string, esTarde = false, esExtra = false) => {
                const c = citaEn(d.fecha, h);
                const marcado = sel?.fecha === d.fecha && sel?.hora === h;
                const clicable = Boolean(c) || !d.pasado;

                return (
                  <button
                    key={h}
                    type="button"
                    disabled={!clicable}
                    onClick={() => {
                      setSel({ fecha: d.fecha, hora: h });
                      setForm(VACIO);
                      setEditando(false);
                    }}
                    className="text-left min-h-[96px] rounded-lg px-3 py-2 flex flex-col gap-1 disabled:cursor-default transition-all shadow-2xs hover:shadow-xs"
                    style={{
                      border: marcado
                        ? '2px solid #B91C1C'
                        : c
                          ? '1px solid #E4E1DC'
                          : '1.5px dashed #C9C5BF',
                      background: c
                        ? '#fff'
                        : d.pasado
                          ? 'transparent'
                          : esExtra
                            ? '#FFFBEB'
                            : esTarde
                              ? '#FBFBFA'
                              : '#FFFCFB',
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-[12px] font-semibold text-t2">{h}</span>
                      {c && c.origen === 'ia' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          IA
                        </span>
                      )}
                    </div>
                    {c ? (
                      <>
                        <Matricula valor={c.matricula} tam="xs" className="self-start" />
                        <span className="text-[13px] font-semibold leading-tight line-clamp-1">{c.nombre}</span>
                        <span className="text-[11px] text-t2 leading-[1.3] line-clamp-2">{c.motivo}</span>
                      </>
                    ) : (
                      <span
                        className="my-auto text-[13px] font-semibold"
                        style={{ color: d.pasado ? '#A8A29E' : '#B91C1C' }}
                      >
                        {d.pasado ? 'Sin cita' : 'Libre · reservar'}
                      </span>
                    )}
                  </button>
                );
              };

              return (
                <div key={d.fecha} className="flex flex-col gap-2">
                  {/* Encabezado del día */}
                  <div
                    className="px-3 py-2.5 rounded-lg flex justify-between items-baseline"
                    style={{ background: d.esHoy ? '#1C1917' : '#fff', color: d.esHoy ? '#fff' : '#1C1917' }}
                  >
                    <span className="text-[15px] font-bold">{d.nombre}</span>
                    <span className="text-[13px]">{d.corta}</span>
                  </div>

                  {/* Sección Turno Mañana */}
                  {manana.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-t4 px-1 flex items-center gap-1">
                        <span>☀️</span> Mañana
                      </div>
                      {manana.map((h) => renderBoton(h, false))}
                    </div>
                  )}

                  {/* Sección Turno Tarde */}
                  {tardeActiva && tarde.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-linea">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-t4 px-1 flex items-center gap-1">
                        <span>🌙</span> Tarde
                      </div>
                      {tarde.map((h) => renderBoton(h, true))}
                    </div>
                  )}

                  {/* Citas extraordinarias fuera de los tramos fijados */}
                  {citasExtra.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-amber-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 px-1 flex items-center gap-1">
                        <span>⚡</span> Otros horarios
                      </div>
                      {citasExtra.map((c) => renderBoton(c.hora, false, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral derecho de detalle, reserva o edición */}
        <aside className="flex-[1_1_300px] min-w-[280px] bg-white border border-borde rounded-xl p-5 flex flex-col gap-3">
          {!sel && (
            <div className="text-[15px] text-t2 leading-normal">
              Elige un hueco para ver la cita, reservarla o editar los datos.
            </div>
          )}

          {/* VISTA DETALLE DE CITA EXISTENTE */}
          {sel && elegida && !editando && (
            <>
              <div className="titulo-seccion">{cuando}</div>
              <Matricula valor={elegida.matricula} tam="lg" className="self-start" />
              <div className="text-lg font-bold">{elegida.nombre}</div>
              <div className="text-sm text-t3">{elegida.coche}</div>
              <div className="text-[15px] font-mono">{elegida.telefono || 'Sin teléfono'}</div>
              <div className="text-[15px] leading-[1.45] border-t border-linea pt-2.5">{elegida.motivo}</div>
              {elegida.origen === 'ia' && (
                <div className="text-xs font-semibold text-t2">
                  Reservada por la IA{elegida.conversacionId ? ' · ' : ''}
                  {elegida.conversacionId && (
                    <Link href={`/conversaciones/${elegida.conversacionId}`} className="text-rojo hover:underline">
                      ver conversación
                    </Link>
                  )}
                </div>
              )}
              {elegida.ordenId ? (
                <Link href={`/ordenes/${elegida.ordenId}`} className="btn btn-rojo h-10 text-sm">
                  Abrir {elegida.ordenId}
                </Link>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-linea">
                  <Link href={`/ordenes/nueva?cita=${elegida.id}`} className="btn btn-rojo h-10 text-sm">
                    Ha llegado el coche · abrir orden
                  </Link>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-borde flex-1 h-9 text-xs font-semibold"
                      disabled={pendiente}
                      onClick={empezarEdicion}
                    >
                      ✏️ Editar cita
                    </button>
                    <button
                      type="button"
                      className="btn btn-borde flex-1 h-9 text-xs font-semibold text-rojo hover:bg-rojo-50"
                      disabled={pendiente}
                      onClick={() => ejecutar(() => anularCitaAccion(elegida.id), (r) => r.ok && setSel(null))}
                    >
                      Anular cita
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* MODO EDICIÓN DE CITA EXISTENTE */}
          {sel && elegida && editando && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="titulo-seccion">Editar cita</div>
                <button
                  type="button"
                  className="text-xs text-t4 hover:text-tinta"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>
              </div>

              {/* Selector de Fecha */}
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                Día
                <select
                  value={formEdicion.fecha}
                  onChange={(e) => setFormEdicion((f) => ({ ...f, fecha: e.target.value }))}
                  className="campo h-[40px] text-sm px-2.5 bg-white"
                >
                  {dias.map((d) => (
                    <option key={d.fecha} value={d.fecha}>
                      {d.nombre} ({d.corta})
                    </option>
                  ))}
                </select>
              </label>

              {/* Selector de Hora */}
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                Hora
                <div className="flex gap-2">
                  <select
                    value={todosHuecosActivos.includes(formEdicion.hora) ? formEdicion.hora : 'otro'}
                    onChange={(e) => {
                      if (e.target.value !== 'otro') {
                        setFormEdicion((f) => ({ ...f, hora: e.target.value }));
                      }
                    }}
                    className="campo h-[40px] text-sm px-2.5 bg-white flex-1"
                  >
                    <optgroup label="Turno de mañana">
                      {manana.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </optgroup>
                    {tardeActiva && (
                      <optgroup label="Turno de tarde">
                        {tarde.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="otro">Hora personalizada...</option>
                  </select>

                  {(!todosHuecosActivos.includes(formEdicion.hora) || formEdicion.hora === '') && (
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={formEdicion.hora}
                      onChange={(e) => setFormEdicion((f) => ({ ...f, hora: e.target.value }))}
                      className="campo h-[40px] w-24 text-center font-mono text-sm px-2"
                    />
                  )}
                </div>
              </label>

              {/* Campos de texto */}
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                Cliente
                <input
                  value={formEdicion.nombre}
                  onChange={(e) => setFormEdicion((f) => ({ ...f, nombre: e.target.value }))}
                  className="campo h-[38px] text-sm px-3"
                  placeholder="Nombre y apellidos"
                />
              </label>

              <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                Teléfono
                <input
                  value={formEdicion.telefono}
                  onChange={(e) => setFormEdicion((f) => ({ ...f, telefono: e.target.value }))}
                  className="campo h-[38px] text-sm px-3 font-mono"
                  placeholder="600 000 000"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                  Matrícula
                  <input
                    value={formEdicion.matricula}
                    onChange={(e) => setFormEdicion((f) => ({ ...f, matricula: e.target.value.toUpperCase() }))}
                    className="campo h-[38px] text-sm px-3 font-mono uppercase"
                    placeholder="1234 ABC"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                  Coche
                  <input
                    value={formEdicion.coche}
                    onChange={(e) => setFormEdicion((f) => ({ ...f, coche: e.target.value }))}
                    className="campo h-[38px] text-sm px-3"
                    placeholder="Marca y modelo"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                Motivo
                <textarea
                  rows={2}
                  value={formEdicion.motivo}
                  onChange={(e) => setFormEdicion((f) => ({ ...f, motivo: e.target.value }))}
                  className="campo text-sm p-2.5 resize-none"
                  placeholder="Qué le ocurre al vehículo"
                />
              </label>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-rojo flex-1 h-[42px] text-sm"
                  disabled={pendiente}
                  onClick={guardarEdicionCita}
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  className="btn btn-borde h-[42px] px-3 text-sm"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* MODO RESERVAR NUEVO HUECO */}
          {sel && !elegida && (
            <>
              <div className="titulo-seccion">Reservar · {cuando}</div>
              {CAMPOS.map(([k, etiqueta, ph]) => (
                <label key={k} className="flex flex-col gap-1 text-[13px] font-semibold text-t3">
                  {etiqueta}
                  <input
                    value={form[k]}
                    placeholder={ph}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    className={`campo h-[42px] text-[15px] px-3 ${k === 'matricula' ? 'font-mono uppercase' : ''}`}
                  />
                </label>
              ))}
              <button
                type="button"
                className="btn btn-rojo h-[46px] text-[15px] mt-1"
                disabled={pendiente}
                onClick={reservar}
              >
                Reservar cita
              </button>
            </>
          )}
        </aside>
      </div>

      {/* MODAL PARA CONFIGURAR HORARIOS DEL TALLER */}
      {modalHorarios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 border border-borde max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold m-0">Horarios del taller</h2>
                <p className="text-sm text-t2 m-0 mt-1">
                  Configura los tramos de entrada disponibles para reservar citas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalHorarios(false)}
                className="text-t4 hover:text-tinta text-xl p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* SECCIÓN TURNO DE MAÑANA */}
            <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  <span>☀️</span> Turno de Mañana
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  {draftManana.length} tramos
                </span>
              </div>

              {/* Chips de horas */}
              <div className="flex flex-wrap gap-1.5">
                {draftManana.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-mono font-bold text-amber-900 shadow-2xs"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => quitarHora('manana', h)}
                      className="text-amber-600 hover:text-rojo text-sm font-bold ml-0.5"
                      title="Eliminar hora"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Añadir hora mañana */}
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="time"
                  value={nuevaHoraManana}
                  onChange={(e) => setNuevaHoraManana(e.target.value)}
                  className="campo h-8.5 text-xs px-2.5 font-mono w-32 bg-white"
                />
                <button
                  type="button"
                  onClick={() => agregarHora('manana')}
                  className="btn btn-borde h-8.5 px-3 text-xs font-semibold"
                >
                  + Añadir tramo
                </button>
              </div>
            </div>

            {/* SECCIÓN TURNO DE TARDE */}
            <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draftTardeActiva}
                    onChange={(e) =>
                      setHorarioDraft((prev) => ({ ...asegurarHorario(prev), tardeActiva: e.target.checked }))
                    }
                    className="h-4 w-4 rounded accent-rojo cursor-pointer"
                  />
                  <span className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                    <span>🌙</span> Habilitar horario de Tarde
                  </span>
                </label>
                {draftTardeActiva && (
                  <span className="text-xs text-blue-800 font-medium">
                    {draftTarde.length} tramos
                  </span>
                )}
              </div>

              {draftTardeActiva && (
                <>
                  {/* Chips de horas */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {draftTarde.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-xs font-mono font-bold text-blue-900 shadow-2xs"
                      >
                        {h}
                        <button
                          type="button"
                          onClick={() => quitarHora('tarde', h)}
                          className="text-blue-600 hover:text-rojo text-sm font-bold ml-0.5"
                          title="Eliminar hora"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Añadir hora tarde */}
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="time"
                      value={nuevaHoraTarde}
                      onChange={(e) => setNuevaHoraTarde(e.target.value)}
                      className="campo h-8.5 text-xs px-2.5 font-mono w-32 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => agregarHora('tarde')}
                      className="btn btn-borde h-8.5 px-3 text-xs font-semibold"
                    >
                      + Añadir tramo
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-between items-center pt-2 border-t border-borde flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHorarioDraft(HORARIO_DEFECTO)}
                className="text-xs text-t3 hover:text-rojo font-medium underline"
              >
                Restablecer horarios por defecto
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalHorarios(false)}
                  className="btn btn-borde h-10 px-4 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={guardarHorariosTaller}
                  className="btn btn-rojo h-10 px-4 text-sm font-semibold"
                >
                  Guardar horarios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
