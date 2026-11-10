-- Un tramo abierto por mecánico. El servidor decide las horas y serializa los cambios.
create table public.tiempos_trabajo (
  id bigint generated always as identity primary key,
  orden_id text not null references public.ordenes(id) on delete cascade,
  mecanico_id text not null,
  inicio timestamptz not null default clock_timestamp(),
  fin timestamptz,
  constraint tiempos_fechas_validas check (fin is null or fin >= inicio)
);
create unique index tiempos_uno_activo_por_mecanico on public.tiempos_trabajo(mecanico_id) where fin is null;
create index tiempos_por_orden on public.tiempos_trabajo(orden_id);
alter table public.tiempos_trabajo enable row level security;
grant select on public.tiempos_trabajo to authenticated;
create policy "tiempos: equipo consulta" on public.tiempos_trabajo for select to authenticated
  using ((select privado.es_taller()) or ((select privado.rol()) = 'mecanico' and mecanico_id = (select privado.persona())));

create or replace function public.cambiar_trabajo_activo(p_orden text default null, p_esperada text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  trabajador text := privado.persona();
  instante timestamptz;
begin
  if privado.rol() <> 'mecanico' or trabajador is null then
    raise exception 'Solo un mecánico puede registrar su tiempo' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tiempo:' || trabajador, 0));
  if p_orden is null and (p_esperada is null or not exists
    (select 1 from public.tiempos_trabajo where mecanico_id = trabajador and orden_id = p_esperada and fin is null)) then
    return;
  end if;
  if p_orden is not null then
    perform 1 from public.ordenes where id = p_orden and mecanico_id = trabajador and estado <> 'entregado' for update;
    if not found then raise exception 'La orden no está abierta o no está asignada a este mecánico' using errcode = '42501'; end if;
    if exists (select 1 from public.tiempos_trabajo where mecanico_id = trabajador and orden_id = p_orden and fin is null) then
      return;
    end if;
  end if;
  instante := clock_timestamp();
  update public.tiempos_trabajo set fin = greatest(instante, inicio) where mecanico_id = trabajador and fin is null;
  if p_orden is not null then
    insert into public.tiempos_trabajo (orden_id, mecanico_id, inicio) values (p_orden, trabajador, instante);
  end if;
end $$;
revoke all on function public.cambiar_trabajo_activo(text, text) from public;
grant execute on function public.cambiar_trabajo_activo(text, text) to authenticated;

-- Cerrar o reasignar una orden detiene el reloj incluso si se hace desde otra pantalla.
create or replace function privado.detener_tiempo_orden() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'entregado' or new.mecanico_id is distinct from old.mecanico_id then
    update public.tiempos_trabajo set fin = greatest(clock_timestamp(), inicio) where orden_id = old.id and fin is null;
  end if;
  return new;
end $$;
create trigger detener_tiempo_orden after update of estado, mecanico_id on public.ordenes
  for each row execute function privado.detener_tiempo_orden();
