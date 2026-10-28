'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { EstadoPill, Matricula, Numero } from '@/components/ui';
import type { DatosTaller } from '@/lib/ajustes';

interface Props {
  taller: DatosTaller;
}

interface SlideMeta {
  id: string;
  etiqueta: string;
  tituloCorto: string;
}

const SLIDES: SlideMeta[] = [
  { id: 'portada', etiqueta: '01 · Visión', tituloCorto: 'El Taller Inteligente' },
  { id: 'problema', etiqueta: '02 · El cuello de botella', tituloCorto: 'El día a día hoy' },
  { id: 'filosofia', etiqueta: '03 · Filosofía AI Partner', tituloCorto: 'Por qué un AI Partner' },
  { id: 'pilar-mecanico', etiqueta: '04 · En el foso', tituloCorto: 'Voz a Ficha con IA' },
  { id: 'pilar-recepcion', etiqueta: '05 · En recepción', tituloCorto: 'Atención 24/7 (WhatsApp/Web)' },
  { id: 'pilar-informes', etiqueta: '06 · En la entrega', tituloCorto: 'Informes y Transparencia' },
  { id: 'seguridad', etiqueta: '07 · Control total', tituloCorto: 'IA con Guardarraíles' },
  { id: 'impacto', etiqueta: '08 · Retorno (ROI)', tituloCorto: 'Impacto en el Negocio' },
  { id: 'modelo', etiqueta: '09 · Cómo trabajamos', tituloCorto: 'Base + Acompañamiento' },
  { id: 'cierre', etiqueta: '10 · Siguiente paso', tituloCorto: 'Demo en Vivo' },
];

export function PresentacionDeck({ taller }: Props) {
  const [actual, setActual] = useState(0);
  const [modoImpresion, setModoImpresion] = useState(false);
  const [indiceAbierto, setIndiceAbierto] = useState(false);

  // Estado interactivo para la slide del mecánico (Pilar 1)
  const [hoveredRef, setHoveredRef] = useState<number | null>(null);
  // Estado interactivo para la slide de recepción (Pilar 2)
  const [escenarioChat, setEscenarioChat] = useState<'estado' | 'cita' | 'humano'>('estado');
  // Estado interactivo para la slide de informes (Pilar 3)
  const [vistaInforme, setVistaInforme] = useState<'cliente' | 'interno'>('cliente');

  const total = SLIDES.length;

  const irA = useCallback((idx: number) => {
    setActual(Math.max(0, Math.min(total - 1, idx)));
    setIndiceAbierto(false);
  }, [total]);

  const siguiente = useCallback(() => irA(actual + 1), [actual, irA]);
  const anterior = useCallback(() => irA(actual - 1), [actual, irA]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modoImpresion) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        siguiente();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        anterior();
      } else if (e.key === 'Home') {
        e.preventDefault();
        irA(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        irA(total - 1);
      } else if (e.key === 'Escape') {
        setIndiceAbierto(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [siguiente, anterior, irA, total, modoImpresion]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const imprimir = () => {
    setModoImpresion(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const renderSlide = (idx: number) => {
    switch (idx) {
      case 0:
        return <SlidePortada taller={taller} onStart={siguiente} />;
      case 1:
        return <SlideProblema />;
      case 2:
        return <SlideFilosofia />;
      case 3:
        return <SlidePilarMecanico hoveredRef={hoveredRef} setHoveredRef={setHoveredRef} />;
      case 4:
        return <SlidePilarRecepcion escenario={escenarioChat} setEscenario={setEscenarioChat} taller={taller} />;
      case 5:
        return <SlidePilarInformes vista={vistaInforme} setVista={setVistaInforme} />;
      case 6:
        return <SlideSeguridad />;
      case 7:
        return <SlideImpacto />;
      case 8:
        return <SlideModelo />;
      case 9:
        return <SlideCierre taller={taller} />;
      default:
        return null;
    }
  };

  if (modoImpresion) {
    return (
      <div className="bg-white text-tinta min-h-screen">
        <div className="no-imprimir sticky top-0 z-50 bg-tinta text-white px-6 py-3 flex items-center justify-between border-b border-borde">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Vista completa de todas las diapositivas (lista para imprimir o guardar en PDF)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => window.print()} className="btn btn-rojo h-9 px-4 text-sm">
              Imprimir / Guardar PDF
            </button>
            <button type="button" onClick={() => setModoImpresion(false)} className="btn btn-borde h-9 px-4 text-sm">
              Volver a modo diapositivas
            </button>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-borde">
          {SLIDES.map((s, i) => (
            <section
              key={s.id}
              className="py-10 px-8 max-w-[1200px] mx-auto w-full break-after-page flex flex-col justify-center min-h-[92vh]"
            >
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-t4 mb-4 pb-2 border-b border-linea">
                <span>{s.etiqueta}</span>
                <span>AI Partner para Talleres · Diapositiva {i + 1} / {total}</span>
              </div>
              <div className="flex-1 flex flex-col justify-center">{renderSlide(i)}</div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const slideMeta = SLIDES[actual];

  return (
    <div className="min-h-dvh bg-fondo text-tinta flex flex-col select-none sm:select-auto">
      {/* Barra superior */}
      <header className="no-imprimir bg-white border-b border-borde px-4 sm:px-7 h-14 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-rojo rounded text-white font-bold text-xs flex items-center justify-center shrink-0 font-mono">
            AI
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm sm:text-base truncate">AI Partner para Talleres</span>
            <span className="hidden md:inline text-t5">·</span>
            <span className="hidden md:inline text-xs font-mono uppercase tracking-wider text-rojo font-semibold bg-rojo-50 border border-rojo-200 px-2 py-0.5 rounded">
              {slideMeta.etiqueta}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndiceAbierto(!indiceAbierto)}
            className="btn btn-borde h-9 px-3 text-xs sm:text-sm font-medium"
            title="Ver índice de diapositivas"
          >
            <span className="font-mono font-bold text-rojo">{actual + 1}/{total}</span>
            <span className="hidden sm:inline">· {slideMeta.tituloCorto}</span>
            <span className="text-[10px] text-t4 ml-1">▼</span>
          </button>

          <button
            type="button"
            onClick={imprimir}
            className="btn btn-borde h-9 px-3 text-xs sm:text-sm hidden sm:inline-flex"
            title="Ver todas las diapositivas o exportar a PDF"
          >
            PDF / Vista completa
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-borde h-9 px-2.5 text-xs sm:text-sm hidden md:inline-flex"
            title="Pantalla completa"
          >
            ⛶
          </button>

          <Link href="/" className="btn btn-negro h-9 px-3 text-xs sm:text-sm">
            Ir a la App →
          </Link>
        </div>
      </header>

      {/* Menú desplegable de índice */}
      {indiceAbierto && (
        <div className="no-imprimir fixed inset-0 z-40 bg-black/30 flex items-start justify-center pt-16 px-4" onClick={() => setIndiceAbierto(false)}>
          <div
            className="bg-white border border-borde rounded-xl shadow-xl max-w-lg w-full p-4 flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-linea">
              <span className="titulo-seccion">Índice de la presentación</span>
              <span className="text-xs text-t4">Usa ← → en el teclado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SLIDES.map((s, i) => {
                const activo = i === actual;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => irA(i)}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-colors flex flex-col gap-0.5 ${
                      activo
                        ? 'bg-rojo-50 border-rojo text-tinta'
                        : 'bg-papel border-transparent hover:border-borde-2 text-t2'
                    }`}
                  >
                    <span className={`text-[11px] font-mono uppercase ${activo ? 'text-rojo font-bold' : 'text-t4'}`}>
                      {s.etiqueta}
                    </span>
                    <span className="text-sm font-semibold">{s.tituloCorto}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso fina */}
      <div className="no-imprimir h-1 bg-borde w-full shrink-0">
        <div
          className="h-full bg-rojo transition-all duration-300"
          style={{ width: `${((actual + 1) / total) * 100}%` }}
        />
      </div>

      {/* Contenedor central de la diapositiva */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-14 py-6 sm:py-8 max-w-[1260px] w-full mx-auto overflow-y-auto">
        {renderSlide(actual)}
      </main>

      {/* Controles de navegación inferiores */}
      <footer className="no-imprimir bg-white border-t border-borde px-4 sm:px-7 h-14 flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={anterior}
          disabled={actual === 0}
          className="btn btn-borde h-9 px-3.5 text-sm"
        >
          ← Anterior
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => irA(i)}
              title={`${i + 1}. ${s.tituloCorto}`}
              className={`h-2.5 rounded-full transition-all ${
                i === actual ? 'w-7 bg-rojo' : 'w-2.5 bg-borde-3 hover:bg-t4'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={siguiente}
          disabled={actual === total - 1}
          className="btn btn-rojo h-9 px-4 text-sm"
        >
          {actual === total - 2 ? 'Ver Demo →' : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 1: PORTADA
 * ========================================================================== */
function SlidePortada({ taller, onStart }: { taller: DatosTaller; onStart: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="inline-flex items-center gap-2 self-start bg-rojo-50 border border-rojo-200 text-rojo px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rojo animate-pulse" />
          Tu Socio Tecnológico de Inteligencia Artificial
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-tinta">
          No te vendemos otro programa más.{' '}
          <span className="text-rojo">Somos el AI Partner de tu taller.</span>
        </h1>

        <p className="text-base sm:text-lg text-t2 leading-relaxed max-w-2xl">
          Transformamos el taller tradicional eliminando el cuello de botella del teléfono, los post-its y las fichas sin apuntar.{' '}
          <strong className="text-tinta font-semibold">Los mecánicos hablan, la IA atiende y el dueño recupera el control.</strong>
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="button" onClick={onStart} className="btn btn-rojo h-12 px-6 text-base shadow-sm">
            Empezar presentación →
          </button>
          <Link href="/chat" target="_blank" className="btn btn-borde h-12 px-5 text-base">
            Probar chat cliente en vivo ↗
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-borde mt-2">
          <div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-tinta">10 seg</div>
            <div className="text-xs text-t3">para actualizar una orden por voz desde el foso</div>
          </div>
          <div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-tinta">24/7</div>
            <div className="text-xs text-t3">atención en WhatsApp y Web sin interrumpir</div>
          </div>
          <div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-rojo">0 €</div>
            <div className="text-xs text-t3">inventados: precios blindados según tu tarifa</div>
          </div>
        </div>
      </div>

      {/* Tarjeta visual derecha simulando el ecosistema en tiempo real */}
      <div className="lg:col-span-5">
        <div className="tarjeta p-5 shadow-sm flex flex-col gap-4 bg-white border-borde-2">
          <div className="flex items-center justify-between border-b border-linea pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-tinta text-white font-bold text-xs flex items-center justify-center">
                TR
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-t4">Caso real en vivo</div>
                <div className="text-sm font-bold">{taller.nombre} · {taller.ciudad}</div>
              </div>
            </div>
            <EstadoPill estado="reparacion" fuerte />
          </div>

          {/* Flujo de 3 capas conectadas */}
          <div className="flex flex-col gap-3">
            <div className="bg-papel border border-borde rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-rojo">1 · En el elevador (Móvil Mecánico)</span>
                <span className="text-xs text-t4 font-mono">🎙️ 0:08s</span>
              </div>
              <p className="text-xs sm:text-sm italic text-t2 bg-white p-2.5 rounded border border-linea">
                «He cambiado el aceite y filtro del Seat León, marca 91.400 km. Las pastillas delanteras están para cambiar pronto. Ya está listo.»
              </p>
            </div>

            <div className="flex justify-center -my-1.5 z-10">
              <span className="bg-tinta text-white text-[11px] font-mono font-semibold px-3 py-1 rounded-full shadow-xs">
                ↓ IA estructura, cruza con tarifa y valida ↓
              </span>
            </div>

            <div className="bg-rojo-50 border border-rojo-200 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-rojo-oscuro">2 · Orden OT-1042 actualizada</span>
                <Matricula valor="4821 KLP" tam="xs" />
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>✓ Aceite y filtro (Tarifa oficial)</span>
                <span className="font-mono">89,00 €</span>
              </div>
              <div className="flex justify-between text-xs text-rojo-oscuro">
                <span>✓ Recomendación: Pastillas delanteras</span>
                <span className="font-mono">115,00 €</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-rojo-200/70">
                <span className="text-xs text-t3">Estado pasa automáticamente a:</span>
                <EstadoPill estado="listo" tam="sm" fuerte />
              </div>
            </div>

            <div className="bg-papel border border-borde rounded-lg p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase text-t3">3 · Recepción y Cliente</div>
                <div className="text-xs text-t2 mt-0.5">
                  Informe sin jerga redactado y WhatsApp respondido al instante.
                </div>
              </div>
              <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full shrink-0">
                Listo para entregar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 2: EL PROBLEMA
 * ========================================================================== */
function SlideProblema() {
  const dolores = [
    {
      quien: 'Recepción saturada',
      icono: '📞',
      cita: '«¿Cómo va mi coche? ¿Cuánto cuesta cambiar el embrague? ¿Tenéis hueco mañana?»',
      impacto: 'Decenas de interrupciones por hora entre WhatsApp y teléfono. Se pierden citas por no contestar a tiempo.',
      metrica: '+2,5 horas/día perdidas al teléfono',
    },
    {
      quien: 'El mecánico en el foso',
      icono: '🔧',
      cita: '«Con las manos llenas de grasa no me voy a sentar en el ordenador a teclear códigos.»',
      impacto: 'Las cosas se apuntan tarde, de memoria o en un papel. Trabajos y piezas pequeñas que se olvidan de cobrar.',
      metrica: '1 de cada 8 horas u observaciones se queda sin registrar',
    },
    {
      quien: 'El cliente a ciegas',
      icono: '🧾',
      cita: '«No entiendo qué le habéis hecho ni por qué sube tanto la factura.»',
      impacto: 'Falta de tiempo para explicar con calma cada reparación y dejar por escrito las recomendaciones futuras.',
      metrica: 'Oportunidades de mantenimiento preventivo perdidas',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <span className="titulo-seccion text-rojo">El diagnóstico real del sector</span>
        <h2 className="text-2xl sm:text-4xl font-bold mt-1 leading-tight">
          El problema de un taller no es saber reparar coches.{' '}
          <span className="text-t3">Es todo el ruido que rodea a la reparación.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {dolores.map((d) => (
          <div key={d.quien} className="tarjeta p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-t3 bg-suave px-2.5 py-1 rounded">
                  {d.quien}
                </span>
                <span className="text-2xl">{d.icono}</span>
              </div>
              <blockquote className="text-base font-semibold text-tinta leading-snug bg-papel border-l-3 border-rojo pl-3 py-1.5">
                {d.cita}
              </blockquote>
              <p className="text-sm text-t2 leading-relaxed">{d.impacto}</p>
            </div>
            <div className="pt-3 border-t border-linea flex items-center gap-2 text-xs font-mono font-bold text-rojo">
              <span>⚠</span>
              <span>{d.metrica}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-tinta text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-rojo-300 font-bold">Por qué fracasa el software tradicional</div>
          <div className="text-base sm:text-lg font-semibold mt-0.5">
            Los ERPs clásicos están pensados para contables, no para talleres con grasa, ruido y prisa.
          </div>
        </div>
        <span className="text-xs font-mono bg-white/10 px-3 py-1.5 rounded text-t6 shrink-0">
          Más pantallas = Más trabajo administrativo
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 3: FILOSOFÍA AI PARTNER
 * ========================================================================== */
function SlideFilosofia() {
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <span className="titulo-seccion text-rojo">Cambio de paradigma</span>
        <h2 className="text-2xl sm:text-4xl font-bold mt-1 leading-tight">
          ¿Qué diferencia a un proveedor de software de un <span className="text-rojo">AI Partner</span>?
        </h2>
        <p className="text-sm sm:text-base text-t2 mt-2">
          Un programa tradicional te pide que metas datos. Un AI Partner captura la información por ti y se adapta a la forma de trabajar de tu taller.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Software viejo */}
        <div className="bg-papel border border-borde rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-borde pb-3">
            <span className="text-sm font-bold uppercase tracking-wider text-t3">Software de gestión tradicional</span>
            <span className="text-xs font-mono text-t4 bg-gris px-2 py-0.5 rounded">Pasivo · Rígido</span>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-t2">
            <li className="flex items-start gap-2.5">
              <span className="text-rojo font-bold">✕</span>
              <span>Te sueltan una licencia compleja y un manual de 80 páginas. Si el equipo no lo usa, es tu problema.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rojo font-bold">✕</span>
              <span>Obliga al mecánico a buscar códigos, escribir en teclados pequeños y rellenar 15 campos obligatorios.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rojo font-bold">✕</span>
              <span>El WhatsApp y el teléfono siguen sonando aparte: recepción tiene que copiar datos de un lado a otro.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rojo font-bold">✕</span>
              <span>Cualquier cambio en tu operativa requiere meses o directamente es imposible.</span>
            </li>
          </ul>
        </div>

        {/* Columna derecha: AI Partner */}
        <div className="bg-white border-2 border-rojo rounded-xl p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-rojo-200 pb-3">
            <span className="text-sm font-bold uppercase tracking-wider text-rojo">Tu AI Partner + Plataforma viva</span>
            <span className="text-xs font-mono text-rojo font-bold bg-rojo-50 border border-rojo-200 px-2.5 py-0.5 rounded">
              Activo · A tu medida
            </span>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-tinta">
            <li className="flex items-start gap-2.5">
              <span className="text-[#15803D] font-bold">✓</span>
              <span><strong>Plataforma lista desde el Día 1:</strong> Tablero visual, vista móvil de mecánico, agenda, clientes y chat IA funcionando en horas.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#15803D] font-bold">✓</span>
              <span><strong>Cero fricción en el taller:</strong> El mecánico solo pulsa un botón y habla natural. La IA traduce su voz a líneas de orden y tarifa.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#15803D] font-bold">✓</span>
              <span><strong>Configurado con tus reglas:</strong> Tu tarifa con IVA, tus horarios de recepción de coches, el tono de tu taller y tus mecánicos.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#15803D] font-bold">✓</span>
              <span><strong>Evolución continua:</strong> Revisamos las conversaciones reales de tus clientes y afinamos tu asistente mes a mes.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 3 Pilares */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-white border border-borde rounded-lg px-4 py-3 flex items-center gap-3">
          <Numero n={1} />
          <div className="text-xs sm:text-sm">
            <strong className="block text-tinta">Pilar 1 · En el foso</strong>
            <span className="text-t3">De nota de voz a ficha valorada</span>
          </div>
        </div>
        <div className="bg-white border border-borde rounded-lg px-4 py-3 flex items-center gap-3">
          <Numero n={2} />
          <div className="text-xs sm:text-sm">
            <strong className="block text-tinta">Pilar 2 · En recepción</strong>
            <span className="text-t3">Asistente 24/7 en WhatsApp y Web</span>
          </div>
        </div>
        <div className="bg-white border border-borde rounded-lg px-4 py-3 flex items-center gap-3">
          <Numero n={3} />
          <div className="text-xs sm:text-sm">
            <strong className="block text-tinta">Pilar 3 · En la entrega</strong>
            <span className="text-t3">Informes claros que venden más</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 4: PILAR 1 - MECÁNICO (VOZ A FICHA CON CITAS NUMERADAS)
 * ========================================================================== */
function SlidePilarMecanico({
  hoveredRef,
  setHoveredRef,
}: {
  hoveredRef: number | null;
  setHoveredRef: (n: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <span className="titulo-seccion text-rojo">Pilar 1 · Copiloto de Voz en el Taller</span>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
          El mecánico habla 10 segundos. La IA rellena la orden y la cruza con la tarifa.
        </h2>
        <p className="text-sm sm:text-base text-t2 leading-relaxed">
          Diseñado específicamente para usarse con una sola mano desde el móvil. Sin menús interminables. Cada mecánico ve <strong>únicamente sus coches asignados</strong>.
        </p>

        <div className="flex flex-col gap-2.5 text-sm">
          <div className="bg-white border border-borde rounded-lg p-3 flex items-start gap-3">
            <span className="font-mono font-bold text-rojo">01</span>
            <div>
              <strong>Transcripción técnica precisa:</strong> Entiende marcas, referencias de piezas y kilometrajes en ambiente de taller.
            </div>
          </div>
          <div className="bg-white border border-borde rounded-lg p-3 flex items-start gap-3">
            <span className="font-mono font-bold text-rojo">02</span>
            <div>
              <strong>Cruce automático con tu tarifa:</strong> Si el trabajo está en tu tarifa, aplica el precio exacto. Nunca inventa un importe.
            </div>
          </div>
          <div className="bg-white border border-borde rounded-lg p-3 flex items-start gap-3">
            <span className="font-mono font-bold text-rojo">03</span>
            <div>
              <strong>Trazabilidad palabra por palabra:</strong> Pasa el ratón por los números <Numero n={1} /> a la derecha para ver cómo justifica cada cambio.
            </div>
          </div>
        </div>
      </div>

      {/* Simulador interactivo del componente Revision */}
      <div className="lg:col-span-7">
        <div className="tarjeta p-4 sm:p-5 bg-white border-borde-2 flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-linea pb-2.5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rojo">Pantalla real del móvil · Revisa antes de guardar</div>
              <div className="text-base font-bold mt-0.5 flex items-center gap-2">
                <Matricula valor="8934 LMN" tam="xs" />
                <span>Seat León 2.0 TDI · OT-1041</span>
              </div>
            </div>
            <span className="text-xs font-bold text-rojo bg-rojo-50 border border-rojo-200 px-2.5 py-1 rounded-full">
              5 cambios detectados
            </span>
          </div>

          {/* Caja de transcripción con resaltado interactivo */}
          <div className="bg-papel border border-borde rounded-xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="titulo-seccion">Lo que ha dicho Javi (nota de voz)</span>
              <span className="text-[11px] text-t4">Pasa el cursor sobre cada cambio</span>
            </div>
            <p className="text-sm sm:text-[15px] leading-[1.75] text-tinta">
              «Ya le{' '}
              <span
                onMouseEnter={() => setHoveredRef(1)}
                onMouseLeave={() => setHoveredRef(null)}
                className={`cursor-pointer transition-colors px-0.5 rounded ${
                  hoveredRef === 1 ? 'bg-rojo text-white' : 'bg-rojo-100 border-b-2 border-rojo'
                }`}
              >
                he cambiado el aceite y el filtro
              </span>{' '}
              <Numero n={1} /> y también{' '}
              <span
                onMouseEnter={() => setHoveredRef(2)}
                onMouseLeave={() => setHoveredRef(null)}
                className={`cursor-pointer transition-colors px-0.5 rounded ${
                  hoveredRef === 2 ? 'bg-rojo text-white' : 'bg-rojo-100 border-b-2 border-rojo'
                }`}
              >
                las dos ruedas delanteras
              </span>{' '}
              <Numero n={2} />. He visto que{' '}
              <span
                onMouseEnter={() => setHoveredRef(3)}
                onMouseLeave={() => setHoveredRef(null)}
                className={`cursor-pointer transition-colors px-0.5 rounded ${
                  hoveredRef === 3 ? 'bg-rojo text-white' : 'bg-rojo-100 border-b-2 border-rojo'
                }`}
              >
                las pastillas traseras están a medio uso, convendría cambiarlas en la próxima revisión
              </span>{' '}
              <Numero n={3} />. Marca{' '}
              <span
                onMouseEnter={() => setHoveredRef(4)}
                onMouseLeave={() => setHoveredRef(null)}
                className={`cursor-pointer transition-colors px-0.5 rounded ${
                  hoveredRef === 4 ? 'bg-rojo text-white' : 'bg-rojo-100 border-b-2 border-rojo'
                }`}
              >
                114.250 km
              </span>{' '}
              <Numero n={4} /> y{' '}
              <span
                onMouseEnter={() => setHoveredRef(5)}
                onMouseLeave={() => setHoveredRef(null)}
                className={`cursor-pointer transition-colors px-0.5 rounded ${
                  hoveredRef === 5 ? 'bg-rojo text-white' : 'bg-rojo-100 border-b-2 border-rojo'
                }`}
              >
                por mí ya está terminado para entregar
              </span>{' '}
              <Numero n={5} />.»
            </p>
          </div>

          {/* Propuestas estructuradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onMouseEnter={() => setHoveredRef(1)}
              onMouseLeave={() => setHoveredRef(null)}
              className={`bg-rojo-50 border rounded-lg p-2.5 flex flex-col gap-0.5 transition-all ${
                hoveredRef === 1 ? 'border-rojo ring-2 ring-rojo/20' : 'border-rojo-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Numero n={1} /> Cambio de aceite y filtro
                </span>
                <span className="text-xs font-mono font-bold">89,00 €</span>
              </div>
              <span className="text-[11px] text-rojo-oscuro">Trabajo hecho · Precio de la tarifa</span>
            </div>

            <div
              onMouseEnter={() => setHoveredRef(2)}
              onMouseLeave={() => setHoveredRef(null)}
              className={`bg-rojo-50 border rounded-lg p-2.5 flex flex-col gap-0.5 transition-all ${
                hoveredRef === 2 ? 'border-rojo ring-2 ring-rojo/20' : 'border-rojo-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Numero n={2} /> Neumático 205/55 R16 (2 uds.)
                </span>
                <span className="text-xs font-mono font-bold">190,00 €</span>
              </div>
              <span className="text-[11px] text-rojo-oscuro">Trabajo hecho · 95,00 €/ud. en tarifa</span>
            </div>

            <div
              onMouseEnter={() => setHoveredRef(3)}
              onMouseLeave={() => setHoveredRef(null)}
              className={`bg-rojo-50 border rounded-lg p-2.5 flex flex-col gap-0.5 sm:col-span-2 transition-all ${
                hoveredRef === 3 ? 'border-rojo ring-2 ring-rojo/20' : 'border-rojo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rojo">Recomendación · Sale en el informe al cliente</span>
                <span className="text-[11px] font-mono text-rojo-oscuro">Según tarifa: Pastillas traseras · 95,00 €</span>
              </div>
              <span className="text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                <Numero n={3} /> Pastillas de freno traseras a medio uso; revisar en próximo mantenimiento.
              </span>
            </div>

            <div
              onMouseEnter={() => setHoveredRef(4)}
              onMouseLeave={() => setHoveredRef(null)}
              className={`bg-rojo-50 border rounded-lg p-2.5 flex items-center justify-between transition-all ${
                hoveredRef === 4 ? 'border-rojo ring-2 ring-rojo/20' : 'border-rojo-300'
              }`}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Numero n={4} /> Kilómetros
              </span>
              <span className="text-xs font-mono">
                <span className="line-through text-t4 mr-1.5">114.200 km</span>
                <strong>114.250 km</strong>
              </span>
            </div>

            <div
              onMouseEnter={() => setHoveredRef(5)}
              onMouseLeave={() => setHoveredRef(null)}
              className={`bg-rojo-50 border rounded-lg p-2.5 flex items-center justify-between transition-all ${
                hoveredRef === 5 ? 'border-rojo ring-2 ring-rojo/20' : 'border-rojo-300'
              }`}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Numero n={5} /> Estado
              </span>
              <div className="flex items-center gap-1.5">
                <EstadoPill estado="reparacion" tam="sm" />
                <span className="text-xs">→</span>
                <EstadoPill estado="listo" tam="sm" fuerte />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-linea text-xs text-t3">
            <span>Nada se guarda sin que el mecánico pulse Confirmar.</span>
            <a
              href="/api/demo?usuario=javi&destino=/movil"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-rojo hover:underline"
            >
              Entrar como Javi (1 clic) ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 5: PILAR 2 - RECEPCIÓN 24/7 (WHATSAPP + WEB)
 * ========================================================================== */
function SlidePilarRecepcion({
  escenario,
  setEscenario,
  taller,
}: {
  escenario: 'estado' | 'cita' | 'humano';
  setEscenario: (e: 'estado' | 'cita' | 'humano') => void;
  taller: DatosTaller;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <span className="titulo-seccion text-rojo">Pilar 2 · Recepcionista IA 24/7</span>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
          Atiende WhatsApp y Web al instante. Y sabe exactamente cuándo callarse y pasar a recepción.
        </h2>
        <p className="text-sm sm:text-base text-t2 leading-relaxed">
          El asistente filtra el 80% de las consultas repetitivas para que recepción se centre en recibir coches y facturar.
        </p>

        {/* Selector de escenarios */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-t3">Haz clic para ver cómo actúa en cada caso:</span>
          <button
            type="button"
            onClick={() => setEscenario('estado')}
            className={`text-left p-3 rounded-lg border transition-all ${
              escenario === 'estado' ? 'bg-rojo-50 border-rojo' : 'bg-white border-borde hover:border-borde-3'
            }`}
          >
            <div className="text-sm font-bold text-tinta">1. Consulta de estado verificada (Matrícula + Código OT)</div>
            <div className="text-xs text-t2 mt-0.5">Solo revela datos si el cliente demuestra tener su resguardo.</div>
          </button>

          <button
            type="button"
            onClick={() => setEscenario('cita')}
            className={`text-left p-3 rounded-lg border transition-all ${
              escenario === 'cita' ? 'bg-rojo-50 border-rojo' : 'bg-white border-borde hover:border-borde-3'
            }`}
          >
            <div className="text-sm font-bold text-tinta">2. Presupuesto de tarifa y reserva de cita en agenda</div>
            <div className="text-xs text-t2 mt-0.5">Mira los huecos reales de mañana/tarde y bloquea la cita sola.</div>
          </button>

          <button
            type="button"
            onClick={() => setEscenario('humano')}
            className={`text-left p-3 rounded-lg border transition-all ${
              escenario === 'humano' ? 'bg-rojo-50 border-rojo' : 'bg-white border-borde hover:border-borde-3'
            }`}
          >
            <div className="text-sm font-bold text-tinta">3. Queja o caso complejo → Traspaso inmediato a humano</div>
            <div className="text-xs text-t2 mt-0.5">Nunca discute ni inventa plazos. Marca «Necesita una persona».</div>
          </button>
        </div>
      </div>

      {/* Simulación de conversación */}
      <div className="lg:col-span-7">
        <div className="tarjeta overflow-hidden bg-white border-borde-2 flex flex-col">
          <div className="bg-tinta text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              <div>
                <div className="text-sm font-bold">{taller.nombre} · Asistente IA</div>
                <div className="text-[11px] text-t5">Canal WhatsApp / Web en vivo</div>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-white/10 px-2.5 py-1 rounded">
              {escenario === 'humano' ? '⚠️ Pasado a Lucía (Recepción)' : '🤖 Atendido por IA'}
            </span>
          </div>

          <div className="p-4 sm:p-5 bg-fondo flex flex-col gap-3 min-h-[300px] justify-center">
            {escenario === 'estado' && (
              <>
                <Burbuja de="cliente" hora="11:14">
                  Hola, quería saber cómo va mi coche y cuánto sube la factura. Matrícula 4821 KLP, código OT-1042.
                </Burbuja>
                <div className="text-[11px] font-mono text-center text-t3 bg-white border border-borde rounded px-2.5 py-1 self-center">
                  🔒 Verificación RPC en BD: 4821 KLP + OT-1042 coinciden → Acceso concedido a esa orden
                </div>
                <Burbuja de="ia" hora="11:14">
                  Hola. Tu Seat León (4821 KLP) ya está listo para recoger. Javi le ha hecho el cambio de aceite y filtro (89,00 €) y el cambio de las dos ruedas delanteras (190,00 €). El total hasta ahora es de 279,00 € (IVA incluido). Puedes pasar cuando quieras dentro de nuestro horario.
                </Burbuja>
              </>
            )}

            {escenario === 'cita' && (
              <>
                <Burbuja de="cliente" hora="17:40">
                  Buenas tardes, ¿cuánto cuesta la revisión con cambio de aceite y cuándo os lo puedo llevar?
                </Burbuja>
                <Burbuja de="ia" hora="17:40">
                  Buenas tardes. El cambio de aceite y filtro son 89,00 € y la revisión general 145,00 € (IVA incluido). Para dejar el coche tengo libres estos huecos: jueves a las 09:00, jueves a las 16:00 o viernes a las 08:30. ¿Cuál te viene mejor? Dime también tu nombre, teléfono y matrícula.
                </Burbuja>
                <Burbuja de="cliente" hora="17:42">
                  El jueves a las 09:00 perfecto. Soy Carlos Gómez, 654 11 22 33, matrícula 9012 MNP (Ford Focus).
                </Burbuja>
                <Burbuja de="ia" hora="17:42">
                  Hecho, Carlos. Te he reservado cita el jueves a las 09:00 para el Ford Focus (9012 MNP). Si necesitas cambiarla, escríbenos por aquí.
                </Burbuja>
              </>
            )}

            {escenario === 'humano' && (
              <>
                <Burbuja de="cliente" hora="10:05">
                  Oye, me cambiasteis el alternador la semana pasada y hoy me vuelve a hacer un ruido raro al arrancar. Quiero hablar con el encargado.
                </Burbuja>
                <div className="text-[11px] font-mono text-center text-rojo bg-rojo-50 border border-rojo-200 rounded px-2.5 py-1 self-center">
                  🛑 Detector de reclamación / petición de persona activado → IA se detiene
                </div>
                <Burbuja de="ia" hora="10:05">
                  Siento mucho las molestias. Se lo paso a Lucía, de recepción, para que lo vea contigo. Te contesta por aquí en cuanto pueda.
                </Burbuja>
                <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs rounded-lg p-2.5 flex items-center justify-between">
                  <span>🔔 En el panel del taller salta aviso: <strong>«Necesita una persona · Queja del cliente»</strong></span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Burbuja({ de, hora, children }: { de: 'cliente' | 'ia'; hora: string; children: React.ReactNode }) {
  const esCliente = de === 'cliente';
  return (
    <div className={`flex flex-col max-w-[85%] ${esCliente ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
          esCliente ? 'bg-tinta text-white' : 'bg-white border border-borde text-tinta'
        }`}
      >
        {children}
      </div>
      <span className="text-[10px] text-t4 mt-0.5 px-1">
        {esCliente ? 'Cliente' : 'Asistente IA'} · {hora}
      </span>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 6: PILAR 3 - INFORMES Y TRANSPARENCIA
 * ========================================================================== */
function SlidePilarInformes({
  vista,
  setVista,
}: {
  vista: 'cliente' | 'interno';
  setVista: (v: 'cliente' | 'interno') => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <span className="titulo-seccion text-rojo">Pilar 3 · Entrega y Fidelización</span>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
          Una misma orden genera dos informes: uno sin jerga para el cliente y otro técnico para ti.
        </h2>
        <p className="text-sm sm:text-base text-t2 leading-relaxed">
          Cuando el cliente entiende por qué se ha hecho cada trabajo y ve las recomendaciones explicadas con claridad, confía en el taller y vuelve para el mantenimiento preventivo.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setVista('cliente')}
            className={`btn flex-1 h-11 text-sm ${vista === 'cliente' ? 'btn-rojo' : 'btn-borde'}`}
          >
            📄 Versión para el Cliente
          </button>
          <button
            type="button"
            onClick={() => setVista('interno')}
            className={`btn flex-1 h-11 text-sm ${vista === 'interno' ? 'btn-negro' : 'btn-borde'}`}
          >
            🔧 Versión Interna (Taller)
          </button>
        </div>

        <div className="bg-papel border border-borde rounded-lg p-3.5 text-xs sm:text-sm text-t2 flex flex-col gap-1.5">
          <strong className="text-tinta">¿Cómo evita errores la IA aquí?</strong>
          <span>
            La IA <strong>solo redacta la explicación</strong> de cada línea. Los importes, sumas e IVA los calcula e inyecta directamente el código del sistema. Además, una firma criptográfica detecta si la orden cambió tras generar el informe.
          </span>
        </div>
      </div>

      {/* Hoja de informe simulada */}
      <div className="lg:col-span-7">
        <div className="tarjeta p-5 sm:p-6 bg-white border-borde-2 shadow-xs flex flex-col gap-4">
          <div className="flex items-start justify-between border-b border-borde pb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-rojo font-bold">
                {vista === 'cliente' ? 'Informe de entrega al cliente (Listo para imprimir / PDF)' : 'Informe técnico interno de taller'}
              </div>
              <div className="text-lg font-bold mt-0.5">Orden OT-1041 · Volkswagen Golf 1.6 TDI</div>
              <div className="text-xs text-t3">Matrícula 7721 HJK · 142.800 km</div>
            </div>
            <EstadoPill estado="listo" tam="sm" fuerte />
          </div>

          {vista === 'cliente' ? (
            <div className="flex flex-col gap-3.5 text-sm">
              <div className="bg-papel border border-linea rounded-lg p-3">
                <div className="text-xs font-bold uppercase text-t3 mb-1">Resumen de la visita (explicado sin jerga)</div>
                <p className="text-tinta leading-relaxed text-xs sm:text-sm">
                  Trajiste el coche porque notabas un chirrido al frenar y tocaba el mantenimiento anual. Hemos sustituido las pastillas delanteras desgastadas y renovado el aceite y los filtros; el coche queda revisado y frenando con total seguridad.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-t3">Trabajos realizados</div>
                <div className="border border-linea rounded-lg p-3 flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-tinta">Pastillas de freno delanteras</div>
                    <div className="text-xs text-t2 mt-0.5">
                      Se han colocado pastillas nuevas en las ruedas delanteras para eliminar el ruido y recuperar toda la eficacia de frenado.
                    </div>
                  </div>
                  <span className="font-mono font-bold whitespace-nowrap">115,00 €</span>
                </div>
                <div className="border border-linea rounded-lg p-3 flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-tinta">Cambio de aceite y filtro</div>
                    <div className="text-xs text-t2 mt-0.5">
                      Aceite limpio y filtro nuevo para mantener el motor bien lubricado y protegido en frío.
                    </div>
                  </div>
                  <span className="font-mono font-bold whitespace-nowrap">89,00 €</span>
                </div>
              </div>

              <div className="bg-rojo-50 border border-rojo-200 rounded-lg p-3 flex justify-between items-start gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rojo">Para tener en cuenta más adelante</div>
                  <div className="font-semibold text-tinta text-xs sm:text-sm mt-0.5">
                    Kit de distribución (le quedan unos 8.000 km de margen)
                  </div>
                  <div className="text-xs text-rojo-oscuro mt-0.5">
                    Conviene cambiar la correa de distribución antes de los 150.000 km para evitar una avería grave en el motor.
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rojo-oscuro whitespace-nowrap">Tarifa: 490,00 €</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 text-sm">
              <div className="bg-papel border border-linea rounded-lg p-3">
                <div className="text-xs font-bold uppercase text-t3 mb-1">Diagnóstico y cierre técnico</div>
                <p className="text-tinta leading-relaxed text-xs sm:text-sm">
                  Entrada por ruido metálico en frenada delantera y revisión periódica. Pastillas eje delantero al límite de ferodo (discos dentro de tolerancia). Sustitución de juego delantero y mantenimiento de aceite 5W30 + filtro. Prueba en vía correcta.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-t3">Puntos de control interno</div>
                <ul className="flex flex-col gap-1.5 text-xs sm:text-sm text-t2 bg-papel border border-linea rounded-lg p-3">
                  <li>• <strong>Hecho por:</strong> Rubén Ortega (Mecánico asignado).</li>
                  <li>• <strong>Seguimiento comercial:</strong> Presupuestado cambio de distribución a los 150.000 km (490,00 €).</li>
                  <li>• <strong>Facturación:</strong> Todos los trabajos tienen precio asignado según tarifa vigente.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 7: SEGURIDAD Y CONTROL (GUARDARRAÍLES)
 * ========================================================================== */
function SlideSeguridad() {
  const controles = [
    {
      titulo: 'Prohibido inventar precios',
      sub: 'Validador determinista de importes',
      desc: 'Antes de que un mensaje salga al cliente, el código extrae cada cifra en euros y comprueba que exista exactamente en tu tarifa o en la orden verificada. Si la IA intenta inventar un descuento o un presupuesto a ojo, se bloquea.',
    },
    {
      titulo: 'Privacidad blindada en el chat',
      sub: 'Doble llave: Matrícula + Código OT',
      desc: 'La cuenta de base de datos del asistente público NO tiene permiso para listar clientes ni coches. Solo recibe los datos de una orden mediante una función segura cuando el cliente escribe matrícula y código de resguardo y ambos coinciden.',
    },
    {
      titulo: 'El humano siempre tiene el mando',
      sub: 'Confirmación en taller y en recepción',
      desc: 'En el foso, la IA propone cambios pero el mecánico confirma. En recepción, basta con escribir en una conversación para que la IA se retire al instante. Si alguien prueba más de 3 códigos o se queja, pasa directo a recepción.',
    },
    {
      titulo: 'Permisos por rol en Base de Datos (RLS)',
      sub: 'Cada persona ve solo lo que debe',
      desc: 'Un mecánico solo ve y edita sus coches abiertos en su móvil. Recepción gestiona tablero, citas y clientes pero no puede alterar la tarifa. El historial de cada orden es inmutable: nadie puede borrar quién hizo qué.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <span className="titulo-seccion text-rojo">Por qué puedes confiar en el sistema</span>
        <h2 className="text-2xl sm:text-4xl font-bold mt-1 leading-tight">
          Una IA sin control es un peligro en un taller.{' '}
          <span className="text-rojo">La nuestra lleva guardarraíles por código.</span>
        </h2>
        <p className="text-sm sm:text-base text-t2 mt-1.5">
          El mayor miedo de un dueño de taller es: <em>«¿Y si la IA le da un precio falso a un cliente o le promete que el coche está hoy?»</em>. Aquí es técnicamente imposible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {controles.map((c, i) => (
          <div key={c.titulo} className="tarjeta p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-rojo bg-rojo-50 border border-rojo-200 px-2.5 py-0.5 rounded">
                Candado 0{i + 1} · {c.sub}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-tinta mt-1">{c.titulo}</h3>
            <p className="text-xs sm:text-sm text-t2 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-papel border border-borde rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <span>
          <strong>Modo «Probar Asistente» incluido para el dueño:</strong> Prueba el chat como si fueras un cliente sin ensuciar la agenda ni las citas reales.
        </span>
        <span className="font-mono text-xs font-bold text-t3">100% auditable</span>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 8: IMPACTO Y RETORNO (ROI)
 * ========================================================================== */
function SlideImpacto() {
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <span className="titulo-seccion text-rojo">Retorno de la inversión (ROI)</span>
        <h2 className="text-2xl sm:text-4xl font-bold mt-1 leading-tight">
          Se paga solo con recuperar 2 horas de taller a la semana o 3 recomendaciones aceptadas al mes.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tarjeta p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase text-t3">Ahorro en recepción</span>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-rojo">-75%</div>
          <p className="text-xs sm:text-sm text-t2">
            de llamadas de <em>«¿cómo va mi coche?»</em> y consultas de precios de mantenimiento básico.
          </p>
        </div>

        <div className="tarjeta p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase text-t3">Tiempo en el foso</span>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-tinta">10 seg</div>
          <p className="text-xs sm:text-sm text-t2">
            por orden para dejar trabajos, piezas, kilómetros y estado actualizados por voz sin tocar un teclado.
          </p>
        </div>

        <div className="tarjeta p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase text-t3">Ticket medio y retorno</span>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-[#15803D]">+18%</div>
          <p className="text-xs sm:text-sm text-t2">
            en reparaciones preventivas gracias a que cada observación del mecánico sale valorada en el informe del cliente.
          </p>
        </div>

        <div className="tarjeta p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase text-t3">Coches atascados</span>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-tinta">0 olvidos</div>
          <p className="text-xs sm:text-sm text-t2">
            El tablero marca en rojo cualquier coche que supere los 5 días en el taller o tenga piezas con retraso.
          </p>
        </div>
      </div>

      {/* Comparativa visual de un día en el taller */}
      <div className="tarjeta p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-t4">Antes (Un martes cualquiera a las 18:30)</span>
          <p className="text-xs sm:text-sm text-t2 leading-relaxed">
            3 clientes esperando para pagar, pero las fichas siguen vacías porque los mecánicos no han tenido tiempo de pasarlas al ordenador. Recepción tiene que ir corriendo al taller a preguntar qué se le ha hecho a cada coche y si las piezas estaban en stock.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:border-l md:border-linea md:pl-5">
          <span className="text-xs font-bold uppercase tracking-wider text-rojo">Con nosotros como AI Partner</span>
          <p className="text-xs sm:text-sm text-tinta leading-relaxed">
            En cuanto el mecánico baja el coche del elevador, dicta una nota de 10 segundos. La orden pasa a «Listo para recoger», los precios están puestos según tarifa y recepción imprime el informe para el cliente en un clic.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 9: MODELO DE TRABAJO (PLATAFORMA + AI PARTNER)
 * ========================================================================== */
function SlideModelo() {
  const fases = [
    {
      num: 'Fase 1 · Semana 1',
      titulo: 'Implantación Llave en Mano',
      sub: 'Plataforma base lista para operar',
      items: [
        'Cargamos los datos de tu taller, tu catálogo de servicios/tarifa con IVA y tus mecánicos.',
        'Configuramos tus tramos horarios de entrada de vehículos (mañana y tarde).',
        'Conectamos tu canal de WhatsApp Business y el enlace público para tu web / Google Maps.',
        'Formación práctica de 30 minutos con los mecánicos desde sus propios móviles.',
      ],
    },
    {
      num: 'Fase 2 · Mes 1',
      titulo: 'Entrenamiento a Medida',
      sub: 'Adaptamos la IA a tu forma de trabajar',
      items: [
        'Ajustamos el vocabulario técnico habitual de tus mecánicos (alias de piezas, marcas frecuentes).',
        'Revisamos juntos las conversaciones reales en el simulador «Probar asistente».',
        'Personalizamos las reglas de traspaso a recepción según tus preferencias.',
        'Acompañamiento directo por WhatsApp con el dueño y recepción.',
      ],
    },
    {
      num: 'Fase 3 · Continuo',
      titulo: 'Tu Socio de IA a Largo Plazo',
      sub: 'Evolución y nuevas automatizaciones',
      items: [
        'Monitorización mensual de conversaciones y mejora continua de respuestas.',
        'Actualización automática a los últimos modelos de IA (voz y texto) sin costes ocultos.',
        'Desarrollo de flujos a medida: recordatorios de ITV/mantenimiento, avisos automáticos de recogida o conexión con tu gestoría.',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <span className="titulo-seccion text-rojo">Cómo trabajamos juntos</span>
        <h2 className="text-2xl sm:text-4xl font-bold mt-1 leading-tight">
          Tecnología probada desde el primer día + acompañamiento continuo como tu <span className="text-rojo">AI Partner</span>.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {fases.map((f, i) => (
          <div
            key={f.num}
            className={`tarjeta p-5 flex flex-col justify-between gap-4 ${
              i === 2 ? 'border-2 border-rojo bg-rojo-50/30' : 'bg-white'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-rojo bg-rojo-50 border border-rojo-200 px-2.5 py-0.5 rounded">
                  {f.num}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-tinta">{f.titulo}</h3>
                <div className="text-xs font-semibold text-t3">{f.sub}</div>
              </div>
              <ul className="flex flex-col gap-2 text-xs sm:text-sm text-t2 pt-2 border-t border-linea">
                {f.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-rojo font-bold">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * DIAPOSITIVA 10: CIERRE Y DEMO EN VIVO
 * ========================================================================== */
function SlideCierre({ taller }: { taller: DatosTaller }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-7 flex flex-col gap-5">
        <span className="titulo-seccion text-rojo">El siguiente paso</span>
        <h2 className="text-3xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
          No hace falta que te lo imagines.{' '}
          <span className="text-rojo">Vamos a probarlo ahora mismo en vivo.</span>
        </h2>
        <p className="text-base sm:text-lg text-t2 leading-relaxed">
          Tenemos el entorno completo funcionando con datos reales de taller ({taller.nombre}). En 5 minutos puedes ver exactamente cómo lo usarían tu recepción, tus mecánicos y tus clientes.
        </p>

        <div className="bg-white border border-borde rounded-xl p-5 flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-rojo">Propuesta de Piloto sin riesgo</div>
          <div className="text-sm sm:text-base text-tinta font-semibold">
            Configuramos el sistema con la tarifa y los horarios reales de tu taller en 48 horas para que tu equipo lo pruebe en su día a día.
          </div>
        </div>
      </div>

      {/* Accesos rápidos para hacer la demo en vivo frente al cliente */}
      <div className="lg:col-span-5 flex flex-col gap-3.5">
        <div className="tarjeta p-5 bg-white border-borde-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-t3">
              Lanzar Demo en 1 Clic (Sin teclear claves)
            </span>
            <span className="text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded">
              Auto-Login activo
            </span>
          </div>

          <Link
            href="/chat"
            target="_blank"
            className="p-3.5 rounded-lg border border-borde hover:border-rojo bg-papel hover:bg-rojo-50/40 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-sm font-bold text-tinta group-hover:text-rojo">1. Chat público para Clientes (/chat)</div>
              <div className="text-xs text-t2">Pide precio, reserva cita o consulta un coche con código OT</div>
            </div>
            <span className="text-rojo font-bold">↗</span>
          </Link>

          <a
            href="/api/demo?usuario=paco&destino=/tablero"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg border border-borde hover:border-rojo bg-papel hover:bg-rojo-50/40 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-sm font-bold text-tinta group-hover:text-rojo">2. Entrar como Dueño · Paco (/tablero)</div>
              <div className="text-xs text-t2">Abre sesión automáticamente con acceso total y tarifa</div>
            </div>
            <span className="text-rojo font-bold">↗</span>
          </a>

          <a
            href="/api/demo?usuario=lucia&destino=/conversaciones"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg border border-borde hover:border-rojo bg-papel hover:bg-rojo-50/40 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-sm font-bold text-tinta group-hover:text-rojo">3. Entrar como Recepción · Lucía (/conversaciones)</div>
              <div className="text-xs text-t2">Bandeja de WhatsApp/Web, agenda de citas y clientes</div>
            </div>
            <span className="text-rojo font-bold">↗</span>
          </a>

          <a
            href="/api/demo?usuario=javi&destino=/movil"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg border border-borde hover:border-rojo bg-papel hover:bg-rojo-50/40 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-sm font-bold text-tinta group-hover:text-rojo">4. Entrar como Mecánico · Javi (/movil)</div>
              <div className="text-xs text-t2">Vista móvil del foso con micrófono y dictado por voz a IA</div>
            </div>
            <span className="text-rojo font-bold">↗</span>
          </a>

          <a
            href="/api/demo?usuario=paco&destino=/probar-asistente"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg border border-borde hover:border-rojo bg-papel hover:bg-rojo-50/40 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-sm font-bold text-tinta group-hover:text-rojo">5. Simulador «Probar Asistente» (Paco)</div>
              <div className="text-xs text-t2">Entorno de pruebas del dueño sin ocupar huecos reales</div>
            </div>
            <span className="text-rojo font-bold">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
