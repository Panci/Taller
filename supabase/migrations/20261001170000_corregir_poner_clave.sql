-- Corregir poner_clave para cualificar extensions.crypt y extensions.gen_salt
create or replace function public.poner_clave(p_persona text, p_clave text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid;
begin
  if privado.rol() <> 'dueno' then
    raise exception 'Solo el dueño puede cambiar la contraseña de otra persona' using errcode = '42501';
  end if;
  if p_persona = privado.persona() then
    raise exception 'Tu propia contraseña se cambia desde «Mi contraseña»' using errcode = '22023';
  end if;
  if p_clave is null or char_length(p_clave) < 10 or octet_length(p_clave) > 72 then
    raise exception 'La contraseña tiene que tener entre 10 y 72 caracteres' using errcode = '22023';
  end if;
  select u.id into v_uid from auth.users u
  where u.raw_app_meta_data ->> 'persona' = p_persona
    and u.raw_app_meta_data ->> 'rol' in ('dueno', 'recepcion', 'mecanico');
  if v_uid is null then
    raise exception 'Usuario no encontrado' using errcode = '22023';
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(p_clave, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = v_uid;
  delete from auth.sessions where user_id = v_uid;
end $$;

revoke all on function public.poner_clave(text, text) from public, anon;
grant execute on function public.poner_clave(text, text) to authenticated;
