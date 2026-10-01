-- 1. Permisos completos en public.personas
grant select, insert, update, delete on public.personas to authenticated;

-- 2. Políticas RLS en public.personas
drop policy if exists "personas: las ve el equipo" on public.personas;
drop policy if exists "personas: todos con rol leen" on public.personas;
create policy "personas: todos con rol leen" on public.personas for select to authenticated
  using ((select privado.rol()) <> '');

drop policy if exists "personas: dueño puede modificar" on public.personas;
drop policy if exists "personas: dueño inserta" on public.personas;
create policy "personas: dueño inserta" on public.personas for insert to authenticated
  with check ((select privado.rol()) = 'dueno');

drop policy if exists "personas: dueño modifica" on public.personas;
create policy "personas: dueño modifica" on public.personas for update to authenticated
  using ((select privado.rol()) = 'dueno')
  with check ((select privado.rol()) = 'dueno');

drop policy if exists "personas: dueño borra" on public.personas;
create policy "personas: dueño borra" on public.personas for delete to authenticated
  using ((select privado.rol()) = 'dueno' and id <> 'paco');

-- 3. Función RPC segura para crear o actualizar trabajador (y su cuenta en auth.users)
create or replace function public.crear_trabajador(
  p_id text,
  p_nombre text,
  p_nombre_completo text,
  p_rol text,
  p_rol_etiqueta text,
  p_clave text default null
)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := gen_random_uuid();
  v_clave text := coalesce(nullif(p_clave, ''), p_id || '-taller-2026');
begin
  if privado.rol() <> 'dueno' then
    raise exception 'Solo el dueño puede dar de alta trabajadores' using errcode = '42501';
  end if;

  p_id := lower(trim(p_id));
  if p_id !~ '^[a-z0-9_-]{2,30}$' then
    raise exception 'El identificador de usuario debe tener entre 2 y 30 caracteres (solo letras minúsculas, números o guiones)' using errcode = '22023';
  end if;

  if p_rol not in ('dueno', 'recepcion', 'mecanico') then
    raise exception 'El rol no es válido' using errcode = '22023';
  end if;

  -- 1. Insertar o actualizar en public.personas
  insert into public.personas (id, nombre, nombre_completo, rol, rol_etiqueta)
  values (p_id, trim(p_nombre), trim(p_nombre_completo), p_rol, trim(p_rol_etiqueta))
  on conflict (id) do update set
    nombre = excluded.nombre,
    nombre_completo = excluded.nombre_completo,
    rol = excluded.rol,
    rol_etiqueta = excluded.rol_etiqueta;

  -- 2. Crear usuario en auth.users si no existe para que pueda iniciar sesión
  if not exists (select 1 from auth.users where email = p_id || '@taller.invalid') then
    if char_length(v_clave) < 10 then
      v_clave := p_id || '-taller-2026';
    end if;

    perform set_config('taller.alta', 'permitida', true);

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      p_id || '@taller.invalid', extensions.crypt(v_clave, extensions.gen_salt('bf', 10)), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'persona', p_id, 'rol', p_rol),
      '{}'::jsonb, now(), now()
    );

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (v_uid, v_uid, json_build_object('sub', v_uid::text, 'email', p_id || '@taller.invalid'), 'email', v_uid::text, now(), now(), now());
  else
    -- Si ya existe en auth.users, actualizar el rol en metadata
    update auth.users
    set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('rol', p_rol, 'persona', p_id),
        updated_at = now()
    where email = p_id || '@taller.invalid';
  end if;
end $$;

revoke all on function public.crear_trabajador(text, text, text, text, text, text) from public, anon;
grant execute on function public.crear_trabajador(text, text, text, text, text, text) to authenticated;

-- 4. Función RPC segura para eliminar un trabajador
create or replace function public.eliminar_trabajador(p_persona text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid;
begin
  if privado.rol() <> 'dueno' then
    raise exception 'Solo el dueño puede eliminar trabajadores' using errcode = '42501';
  end if;

  p_persona := lower(trim(p_persona));
  if p_persona = 'paco' or p_persona = privado.persona() then
    raise exception 'No puedes eliminar la cuenta principal del dueño' using errcode = '22023';
  end if;

  -- Comprobar si tiene órdenes activas abiertas en el taller
  if exists (select 1 from public.ordenes where mecanico_id = p_persona and estado <> 'entregado') then
    raise exception 'No se puede eliminar a este mecánico porque tiene órdenes de trabajo abiertas en el taller. Asígnalas a otro mecánico antes de eliminarlo.' using errcode = '22023';
  end if;

  -- Si tiene órdenes entregadas pasadas, reasignarlas a paco para no violar foreign key
  if exists (select 1 from public.ordenes where mecanico_id = p_persona) then
    update public.ordenes set mecanico_id = 'paco' where mecanico_id = p_persona;
  end if;

  -- 1. Eliminar de public.personas
  delete from public.personas where id = p_persona;

  -- 2. Eliminar de auth.users y auth.identities
  select u.id into v_uid from auth.users u where email = p_persona || '@taller.invalid';
  if v_uid is not null then
    delete from auth.identities where user_id = v_uid;
    delete from auth.sessions where user_id = v_uid;
    delete from auth.users where id = v_uid;
  end if;
end $$;

revoke all on function public.eliminar_trabajador(text) from public, anon;
grant execute on function public.eliminar_trabajador(text) to authenticated;
