// Base de datos en memoria para Modo Demo Instantáneo (sin necesitar contraseñas de Supabase).
// Permite enseñar todas las pantallas (Tablero, Conversaciones, Citas, Clientes, Tarifa, Móvil Mecánico)
// cambiando de perfil en 1 clic.

import 'server-only';
import { randomUUID } from 'node:crypto';
import { crearDatosEjemplo } from '../datos-ejemplo';
import { deCita, deCliente, deCoche, deOrden, deServicio } from '../filas';
import type { Db } from './servidor';

interface EstadoMemoria {
  clientes: Record<string, unknown>[];
  coches: Record<string, unknown>[];
  tarifa: Record<string, unknown>[];
  ordenes: Record<string, unknown>[];
  citas: Record<string, unknown>[];
  conversaciones: Record<string, unknown>[];
  mensajes: Record<string, unknown>[];
  ajustes: Record<string, unknown>[];
  personas: Record<string, unknown>[];
  siguienteOrden: number;
  visitantesWeb: number;
}

declare global {
  var __trMemoriaDemo: EstadoMemoria | undefined;
}

function claveMatricula(m: string): string {
  return String(m ?? '').replace(/[\s-]/g, '').toUpperCase();
}

function inicializarMemoria(): EstadoMemoria {
  const base = crearDatosEjemplo();
  return {
    clientes: base.clientes.map((c) => ({ ...deCliente(c), creado: base.creada })),
    coches: base.coches.map((c) => ({
      ...deCoche(c),
      matricula_clave: claveMatricula(c.matricula),
      creado: base.creada,
    })),
    tarifa: base.tarifa.map((s, i) => ({ ...deServicio(s), posicion: i + 1 })),
    ordenes: base.ordenes.map((o) => ({ ...deOrden(o), version: o.version ?? 1 })),
    citas: base.citas.map((c) => ({ ...deCita(c) })),
    conversaciones: base.conversaciones.map((c) => ({
      id: c.id,
      cliente_id: c.clienteId ?? null,
      nombre: c.nombre,
      canal: c.canal,
      contacto: c.contacto ?? null,
      modo: c.modo,
      necesita_persona: c.necesitaPersona,
      motivo: c.motivo ?? null,
      ia_pensando_desde: null,
      actualizada: c.actualizada,
      creada: c.creada,
      prueba: Boolean(c.prueba),
    })),
    mensajes: base.conversaciones.flatMap((c) =>
      c.mensajes.map((m, idx) => ({
        n: idx + 1,
        id: m.id,
        conversacion_id: c.id,
        de: m.de,
        texto: m.texto,
        cuando: m.cuando,
        autor: m.autor ?? null,
      }))
    ),
    ajustes: [],
    personas: [
      { id: 'paco', nombre: 'Paco', nombre_completo: 'Paco Ruiz', rol: 'dueno', rol_etiqueta: 'Dueño' },
      { id: 'lucia', nombre: 'Lucía', nombre_completo: 'Lucía Serrano', rol: 'recepcion', rol_etiqueta: 'Recepción' },
      { id: 'javi', nombre: 'Javi', nombre_completo: 'Javi Martín', rol: 'mecanico', rol_etiqueta: 'Mecánico' },
      { id: 'ruben', nombre: 'Rubén', nombre_completo: 'Rubén Ortega', rol: 'mecanico', rol_etiqueta: 'Mecánico' },
      { id: 'marta', nombre: 'Marta', nombre_completo: 'Marta Villalba', rol: 'mecanico', rol_etiqueta: 'Mecánica' },
    ],
    siguienteOrden: base.siguienteOrden,
    visitantesWeb: base.visitantesWeb,
  };
}

export function estadoDemo(): EstadoMemoria {
  globalThis.__trMemoriaDemo ??= inicializarMemoria();
  return globalThis.__trMemoriaDemo;
}

type Filtro = (fila: Record<string, unknown>) => boolean;

class ConstructorConsulta {
  private tabla: keyof EstadoMemoria;
  private operacion: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private columnas = '*';
  private opcionesSelect: { count?: string; head?: boolean } = {};
  private filtros: Filtro[] = [];
  private ordenes: { col: string; asc: boolean; ref?: string }[] = [];
  private limite: number | null = null;
  private payload: unknown = null;
  private modoSingle: 'none' | 'single' | 'maybeSingle' = 'none';

  constructor(tabla: string) {
    this.tabla = tabla as keyof EstadoMemoria;
  }

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    this.columnas = cols;
    if (opts) this.opcionesSelect = opts;
    return this;
  }

  insert(valores: unknown) {
    this.operacion = 'insert';
    this.payload = valores;
    return this;
  }

  update(valores: unknown) {
    this.operacion = 'update';
    this.payload = valores;
    return this;
  }

  upsert(valores: unknown) {
    this.operacion = 'upsert';
    this.payload = valores;
    return this;
  }

  delete() {
    this.operacion = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filtros.push((f) => f[col] === val);
    return this;
  }

  neq(col: string, val: unknown) {
    this.filtros.push((f) => f[col] !== val);
    return this;
  }

  in(col: string, vals: unknown[]) {
    const set = new Set(vals);
    this.filtros.push((f) => set.has(f[col]));
    return this;
  }

  is(col: string, val: unknown) {
    this.filtros.push((f) => (val === null ? f[col] === null || f[col] === undefined : f[col] === val));
    return this;
  }

  gte(col: string, val: string | number) {
    this.filtros.push((f) => String(f[col] ?? '') >= String(val));
    return this;
  }

  lte(col: string, val: string | number) {
    this.filtros.push((f) => String(f[col] ?? '') <= String(val));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; referencedTable?: string }) {
    this.ordenes.push({ col, asc: opts?.ascending !== false, ref: opts?.referencedTable });
    return this;
  }

  limit(n: number, opts?: { referencedTable?: string }) {
    if (!opts?.referencedTable) this.limite = n;
    return this;
  }

  single() {
    this.modoSingle = 'single';
    return this;
  }

  maybeSingle() {
    this.modoSingle = 'maybeSingle';
    return this;
  }

  private ejecutar(): { data: unknown; error: null; count?: number } {
    const mem = estadoDemo();
    const lista = (mem[this.tabla] as Record<string, unknown>[]) ?? [];
    const cumple = (f: Record<string, unknown>) => this.filtros.every((fn) => fn(f));

    if (this.operacion === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const insertados: Record<string, unknown>[] = [];
      for (const item of items) {
        const nuevo = { ...(item as Record<string, unknown>) };
        if (this.tabla === 'ordenes') {
          if (!nuevo.id) nuevo.id = `OT-${mem.siguienteOrden++}`;
          nuevo.entrada ??= new Date().toISOString();
          nuevo.trabajos ??= [];
          nuevo.piezas ??= [];
          nuevo.observaciones ??= [];
          nuevo.historial ??= [];
          nuevo.informes ??= {};
          nuevo.version = 1;
        } else if (this.tabla === 'coches') {
          nuevo.matricula_clave = claveMatricula(String(nuevo.matricula ?? ''));
          nuevo.creado ??= new Date().toISOString();
        } else if (this.tabla === 'conversaciones') {
          if (!nuevo.nombre) nuevo.nombre = `Visitante web ${++mem.visitantesWeb}`;
          nuevo.creada ??= new Date().toISOString();
          nuevo.actualizada ??= new Date().toISOString();
          nuevo.necesita_persona ??= false;
          nuevo.prueba ??= false;
        } else if (this.tabla === 'mensajes') {
          nuevo.n = mem.mensajes.length + 1;
          nuevo.cuando ??= new Date().toISOString();
          if (nuevo.de === 'persona' && !nuevo.autor) nuevo.autor = 'Taller';
          const conv = mem.conversaciones.find((c) => c.id === nuevo.conversacion_id);
          if (conv) conv.actualizada = nuevo.cuando;
        } else if (this.tabla === 'tarifa') {
          nuevo.posicion ??= mem.tarifa.length + 1;
        }
        lista.push(nuevo);
        insertados.push(nuevo);
      }
      return this.formatearSalida(insertados);
    }

    if (this.operacion === 'upsert') {
      const item = { ...(this.payload as Record<string, unknown>) };
      const pk = this.tabla === 'ajustes' ? 'clave' : 'id';
      const idx = lista.findIndex((f) => f[pk] === item[pk]);
      if (idx >= 0) lista[idx] = { ...lista[idx], ...item };
      else lista.push(item);
      return this.formatearSalida([item]);
    }

    if (this.operacion === 'update') {
      const cambios = this.payload as Record<string, unknown>;
      const actualizados: Record<string, unknown>[] = [];
      for (let i = 0; i < lista.length; i++) {
        if (!cumple(lista[i])) continue;
        const actualizado = { ...lista[i], ...cambios };
        if (this.tabla === 'ordenes') {
          actualizado.version = Number(lista[i].version ?? 1) + 1;
        }
        if (this.tabla === 'coches' && cambios.matricula) {
          actualizado.matricula_clave = claveMatricula(String(cambios.matricula));
        }
        lista[i] = actualizado;
        actualizados.push(actualizado);
      }
      return this.formatearSalida(actualizados);
    }

    if (this.operacion === 'delete') {
      const restantes = lista.filter((f) => !cumple(f));
      (mem[this.tabla] as Record<string, unknown>[]) = restantes;
      return { data: null, error: null };
    }

    // SELECT
    let res = lista.filter(cumple).map((f) => ({ ...f }));

    if (this.opcionesSelect.head && this.opcionesSelect.count) {
      return { data: null, error: null, count: res.length };
    }

    // Join especial para bandeja de conversaciones: mensajes(id, de, texto, cuando, autor)
    if (this.tabla === 'conversaciones' && this.columnas.includes('mensajes(')) {
      res = res.map((c) => {
        const msgs = mem.mensajes
          .filter((m) => m.conversacion_id === c.id)
          .sort((a, b) => Number(b.n ?? 0) - Number(a.n ?? 0))
          .slice(0, 1);
        return { ...c, mensajes: msgs };
      });
    }

    for (const ord of [...this.ordenes].reverse()) {
      if (ord.ref) continue;
      res.sort((a, b) => {
        const va = a[ord.col];
        const vb = b[ord.col];
        if (va === vb) return 0;
        const cmp = va! > vb! ? 1 : -1;
        return ord.asc ? cmp : -cmp;
      });
    }

    if (this.limite !== null) res = res.slice(0, this.limite);
    return this.formatearSalida(res);
  }

  private formatearSalida(filas: Record<string, unknown>[]): { data: unknown; error: null; count?: number } {
    if (this.modoSingle === 'single') {
      return { data: filas[0] ?? null, error: null };
    }
    if (this.modoSingle === 'maybeSingle') {
      return { data: filas[0] ?? null, error: null };
    }
    return { data: filas, error: null, count: filas.length };
  }

  then<TResult1 = { data: unknown; error: null; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.ejecutar()).then(onfulfilled, onrejected);
  }
}

export function crearClienteDemo(personaId = 'paco', rol = 'dueno'): Db {
  const mem = estadoDemo();
  const mock = {
    from: (tabla: string) => new ConstructorConsulta(tabla),
    rpc: async (fn: string, args: Record<string, unknown> = {}) => {
      if (fn === 'huecos_ocupados') {
        const desde = String(args.p_desde ?? '');
        const hasta = String(args.p_hasta ?? '');
        const data = mem.citas
          .filter((c) => String(c.fecha) >= desde && String(c.fecha) <= hasta)
          .map((c) => ({ fecha: c.fecha, hora: c.hora }));
        return { data, error: null };
      }
      if (fn === 'asistente_orden') {
        const codigo = String(args.p_codigo ?? '').trim().toUpperCase();
        const matriculas = ((args.p_matriculas as string[]) ?? []).map(claveMatricula);
        const orden = mem.ordenes.find((o) => String(o.id).toUpperCase() === codigo);
        if (!orden) return { data: null, error: null };
        const coche = mem.coches.find((c) => c.id === orden.coche_id);
        if (!coche || !matriculas.includes(claveMatricula(String(coche.matricula)))) {
          return { data: null, error: null };
        }
        return {
          data: {
            id: orden.id,
            estado: orden.estado,
            km: orden.km,
            mecanico_id: orden.mecanico_id,
            entrada: orden.entrada,
            cierre: orden.cierre ?? null,
            motivo: orden.motivo,
            trabajos: orden.trabajos,
            piezas: orden.piezas,
            coche: { matricula: coche.matricula, modelo: coche.modelo },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: `demo-${personaId}`, app_metadata: { persona: personaId, rol } } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: { id: randomUUID(), app_metadata: { persona: personaId, rol } } }, error: null }),
      updateUser: async () => ({ data: {}, error: null }),
    },
  };
  return mock as unknown as Db;
}
