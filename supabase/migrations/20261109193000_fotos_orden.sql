-- Las fotografías no son públicas: el informe se comparte como PDF desde el taller.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-orden', 'fotos-orden', false, 3145728, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.fotos_orden (
  id uuid primary key,
  orden_id text not null references public.ordenes(id) on delete cascade,
  ruta text not null unique,
  descripcion text not null default '' check (length(descripcion) <= 160),
  creada timestamptz not null default now(),
  constraint foto_ruta check (ruta = orden_id || '/' || id::text || '.jpg')
);
create index fotos_orden_orden_idx on public.fotos_orden(orden_id);
alter table public.fotos_orden enable row level security;
grant select, insert, delete on public.fotos_orden to authenticated;
create policy "fotos: leer orden visible" on public.fotos_orden for select to authenticated
  using (exists (select 1 from public.ordenes o where o.id = orden_id));
create policy "fotos: insertar en orden abierta" on public.fotos_orden for insert to authenticated
  with check (exists (select 1 from public.ordenes o where o.id = orden_id and o.estado <> 'entregado'
    and ((select privado.es_taller()) or ((select privado.rol()) = 'mecanico' and o.mecanico_id = (select privado.persona())))));
create policy "fotos: borrar de orden abierta" on public.fotos_orden for delete to authenticated
  using (exists (select 1 from public.ordenes o where o.id = orden_id and o.estado <> 'entregado'
    and ((select privado.es_taller()) or ((select privado.rol()) = 'mecanico' and o.mecanico_id = (select privado.persona())))));

create policy "fotos objetos: lectura" on storage.objects for select to authenticated
  using (bucket_id = 'fotos-orden' and exists (select 1 from public.ordenes o where o.id = (storage.foldername(name))[1]));
create policy "fotos objetos: insertar" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-orden' and array_length(storage.foldername(name), 1) = 1
    and exists (select 1 from public.ordenes o where o.id = (storage.foldername(name))[1] and o.estado <> 'entregado'
      and ((select privado.es_taller()) or ((select privado.rol()) = 'mecanico' and o.mecanico_id = (select privado.persona())))));
create policy "fotos objetos: borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-orden' and exists (select 1 from public.ordenes o where o.id = (storage.foldername(name))[1] and o.estado <> 'entregado'
    and ((select privado.es_taller()) or ((select privado.rol()) = 'mecanico' and o.mecanico_id = (select privado.persona())))));
