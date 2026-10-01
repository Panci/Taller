-- Tabla de ajustes del taller (horarios de citas, etc.)
create table if not exists public.ajustes (
  clave text primary key check (length(clave) between 1 and 60),
  valor jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

grant select, insert, update on public.ajustes to authenticated;
alter table public.ajustes enable row level security;

drop policy if exists "ajustes: taller lee y cambia" on public.ajustes;
create policy "ajustes: taller lee y cambia" on public.ajustes for all to authenticated
  using ((select privado.es_taller())) with check ((select privado.es_taller()));
