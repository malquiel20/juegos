-- =====================================================================
--  QUITAR LA CLAVE (borrar y guardar el panel solo piden confirmar Sí/No)
--  Pégalo en Supabase > SQL Editor > New query > Run.
--
--  OJO: sin clave, cualquier persona que conozca la dirección de tu base de datos
--  (está en el código público de la página) podría borrar los inscritos o cambiar
--  los resultados. Verlos y registrarse ya eran libres.
--  Para volver a proteger con clave: ejecuta de nuevo supabase/instalar.sql.
-- =====================================================================

create or replace function public.borrar(p_id uuid, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.inscritos where id = p_id;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'borrados', n);
end $$;

create or replace function public.vaciar(p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.inscritos where true;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'borrados', n);
end $$;

create or replace function public.guardar_estado(p_datos jsonb, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update public.estado set datos = coalesce(p_datos, '{}'::jsonb) where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- Pasar a una persona de un juego a otro (sin clave)
create or replace function public.mover(p_id uuid, p_juego text, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.inscritos%rowtype; v_otro text;
begin
  if p_juego not in ('Ajedrez', 'Dominó', 'Bingo') then return jsonb_build_object('ok', false, 'error', 'datos'); end if;
  perform pg_advisory_xact_lock(hashtext('torneo-inscribir'));
  select * into v_row from public.inscritos where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if v_row.juego = p_juego then return jsonb_build_object('ok', false, 'error', 'mismo'); end if;
  -- ya está inscrito en el juego de destino
  if exists (select 1 from public.inscritos where doc = v_row.doc and juego = p_juego) then
    return jsonb_build_object('ok', false, 'error', 'ya_esta', 'juego', p_juego);
  end if;
  -- Ajedrez y Dominó no pueden juntarse (el Bingo sí se suma a cualquiera)
  if p_juego <> 'Bingo' then
    select juego into v_otro from public.inscritos where doc = v_row.doc and id <> p_id and juego <> 'Bingo' limit 1;
    if v_otro is not null then return jsonb_build_object('ok', false, 'error', 'excluyente', 'juego', v_otro); end if;
  end if;
  -- se conserva todo (nombre, ficha, cédula, fecha); solo al entrar al Bingo se toma la hora actual para ir al final de la fila
  update public.inscritos set juego = p_juego, fecha = case when p_juego = 'Bingo' then now() else fecha end where id = p_id;
  return jsonb_build_object('ok', true, 'de', v_row.juego, 'a', p_juego);
end $$;


grant execute on function public.mover(uuid, text, text) to anon, authenticated;
grant execute on function public.borrar(uuid, text), public.vaciar(text), public.guardar_estado(jsonb, text) to anon, authenticated;
