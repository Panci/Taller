import type { EstadoId, EstadoOrden, EstadoPieza, Persona, PersonaId } from './tipos';

export const TALLER = {
  nombre: 'Talleres Ruiz',
  lema: 'Mecánica y electricidad del automóvil',
  ciudad: 'Getafe',
  direccion: 'C/ de Toledo, 48 · Pol. Ind. Los Olivos',
  cp: '28906 Getafe (Madrid)',
  telefono: '916 95 23 40',
  email: 'taller@talleresruiz.es',
  web: 'talleresruiz.es',
  garantia: 'Garantía de 3 meses o 2.000 km en los trabajos realizados.',
};

export interface EstiloEstado {
  id: EstadoOrden;
  nombre: string;
  c: string;
  bg: string;
  bd: string;
}

export const ESTADOS: Record<EstadoOrden, EstiloEstado> = {
  recibido: { id: 'recibido', nombre: 'Recibido', c: '#475569', bg: '#F1F5F9', bd: '#CBD5E1' },
  diagnostico: { id: 'diagnostico', nombre: 'Diagnóstico', c: '#6D28D9', bg: '#F5F3FF', bd: '#DDD6FE' },
  pieza: { id: 'pieza', nombre: 'Esperando pieza', c: '#B45309', bg: '#FFFBEB', bd: '#FDE68A' },
  reparacion: { id: 'reparacion', nombre: 'En reparación', c: '#1D4ED8', bg: '#EFF6FF', bd: '#BFDBFE' },
  listo: { id: 'listo', nombre: 'Listo para recoger', c: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
  entregado: { id: 'entregado', nombre: 'Entregado', c: '#57534E', bg: '#F5F5F4', bd: '#D6D3CE' },
};

export const ESTADOS_TABLERO: EstadoId[] = ['recibido', 'diagnostico', 'pieza', 'reparacion', 'listo'];

export const ESTADOS_PIEZA: Record<EstadoPieza, string> = {
  pendiente: 'Pendiente de pedir',
  pedida: 'Pedida',
  recibida: 'Recibida',
  stock: 'En stock',
};

export const PERSONAS: Persona[] = [
  { id: 'paco', nombre: 'Paco', nombreCompleto: 'Paco Ruiz', rol: 'dueno', rolEtiqueta: 'Dueño' },
  { id: 'lucia', nombre: 'Lucía', nombreCompleto: 'Lucía Serrano', rol: 'recepcion', rolEtiqueta: 'Recepción' },
  { id: 'javi', nombre: 'Javi', nombreCompleto: 'Javi Martín', rol: 'mecanico', rolEtiqueta: 'Mecánico' },
  { id: 'ruben', nombre: 'Rubén', nombreCompleto: 'Rubén Ortega', rol: 'mecanico', rolEtiqueta: 'Mecánico' },
  { id: 'marta', nombre: 'Marta', nombreCompleto: 'Marta Villalba', rol: 'mecanico', rolEtiqueta: 'Mecánica' },
];

export const MECANICOS = PERSONAS.filter((p) => p.rol === 'mecanico');

export function actualizarMemoriaTaller(datos: Partial<typeof TALLER>) {
  Object.assign(TALLER, datos);
}

export function actualizarMemoriaTrabajadores(lista: Persona[]) {
  if (lista && lista.length > 0) {
    PERSONAS.length = 0;
    PERSONAS.push(...lista);
    MECANICOS.length = 0;
    MECANICOS.push(...PERSONAS.filter((p) => p.rol === 'mecanico'));
  }
}

export function persona(id: PersonaId | string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function nombrePersona(id: PersonaId | string): string {
  return persona(id)?.nombre ?? String(id);
}

/** Entradas de coches: huecos de mañana y tarde, de lunes a viernes. */
export const HUECOS_MANANA = ['08:30', '09:00', '09:30', '10:00'];
export const HUECOS_TARDE = ['15:30', '16:00', '16:30', '17:00'];
export const HUECOS = [...HUECOS_MANANA, ...HUECOS_TARDE];

export interface HorarioTaller {
  tardeActiva: boolean;
  huecosManana: string[];
  huecosTarde: string[];
}

export const HORARIO_DEFECTO: HorarioTaller = {
  tardeActiva: true,
  huecosManana: HUECOS_MANANA,
  huecosTarde: HUECOS_TARDE,
};

export function huecosActivos(horario?: Partial<HorarioTaller> | null): string[] {
  const h = { ...HORARIO_DEFECTO, ...horario };
  const lista = [...(h.huecosManana ?? HUECOS_MANANA)];
  if (h.tardeActiva) {
    lista.push(...(h.huecosTarde ?? HUECOS_TARDE));
  }
  return [...new Set(lista)].sort();
}

/** A partir de estos días en el taller, el tablero lo marca en rojo. */
export const DIAS_ALERTA = 5;

export const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP'];
