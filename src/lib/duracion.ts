export function duracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 3600)} h ${String(Math.floor(s % 3600 / 60)).padStart(2, '0')} min ${String(s % 60).padStart(2, '0')} s`;
}

export function segundosTramo(inicio: string, fin: string | null, ahora: number): number {
  const desde = Date.parse(inicio);
  const hasta = fin ? Date.parse(fin) : ahora;
  return Number.isFinite(desde) && Number.isFinite(hasta) ? Math.max(0, (hasta - desde) / 1000) : 0;
}

export function revisionTiempos(tramos: { mecanico_id: string; inicio: string; fin: string | null }[]): string {
  const texto = JSON.stringify(tramos.map((t) => [t.mecanico_id, t.inicio, t.fin]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  let a = 2166136261, b = 5381;
  for (let i = 0; i < texto.length; i++) { a = Math.imul(a ^ texto.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ texto.charCodeAt(i); }
  return `${tramos.length}-${a >>> 0}-${b >>> 0}`;
}
