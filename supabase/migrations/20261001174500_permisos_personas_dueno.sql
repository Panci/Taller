-- Permitir que el dueño del taller pueda actualizar los datos de la tabla personas
grant select, update on public.personas to authenticated;

drop policy if exists "personas: dueño puede modificar" on public.personas;
create policy "personas: dueño puede modificar" on public.personas for update to authenticated
  using ((select privado.rol()) = 'dueno')
  with check ((select privado.rol()) = 'dueno');
