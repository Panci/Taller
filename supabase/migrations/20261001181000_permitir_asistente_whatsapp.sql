-- Permitir al rol asistente leer ajustes (horarios, datos taller, ia, whatsapp)
drop policy if exists "ajustes: taller lee y cambia" on public.ajustes;
create policy "ajustes: todos con rol leen" on public.ajustes for select to authenticated
  using ((select privado.rol()) <> '');
create policy "ajustes: taller cambia" on public.ajustes for all to authenticated
  using ((select privado.es_taller())) with check ((select privado.es_taller()));

-- Permitir al rol asistente gestionar conversaciones de WhatsApp
drop policy if exists "conversaciones: taller y asistente (web) ven" on public.conversaciones;
create policy "conversaciones: taller y asistente (web) ven" on public.conversaciones for select to authenticated
  using ((select privado.es_taller()) or ((select privado.rol()) = 'asistente' and canal in ('Web', 'WhatsApp')));

drop policy if exists "conversaciones: el asistente abre chats de la web" on public.conversaciones;
create policy "conversaciones: el asistente abre chats de la web" on public.conversaciones for insert to authenticated
  with check ((select privado.rol()) = 'asistente' and canal in ('Web', 'WhatsApp') and cliente_id is null and not prueba);

drop policy if exists "conversaciones: taller y asistente (web) cambian" on public.conversaciones;
create policy "conversaciones: taller y asistente (web) cambian" on public.conversaciones for update to authenticated
  using ((select privado.es_taller()) or ((select privado.rol()) = 'asistente' and canal in ('Web', 'WhatsApp')))
  with check ((select privado.es_taller()) or ((select privado.rol()) = 'asistente' and canal in ('Web', 'WhatsApp')));

-- Asignar nombre por defecto para conversaciones de WhatsApp si no viene especificado
create or replace function privado.nueva_conversacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if privado.cargando() then return new; end if;
  if new.canal = 'Web' and btrim(coalesce(new.nombre, '')) = '' then
    new.nombre := 'Visitante web ' || nextval('public.visitante_web');
  elsif new.canal = 'WhatsApp' and btrim(coalesce(new.nombre, '')) = '' then
    new.nombre := coalesce(nullif(btrim(new.contacto), ''), 'Cliente WhatsApp');
  end if;
  if privado.rol() <> '' then
    new.creada := now();
    new.actualizada := now();
  end if;
  return new;
end $$;
