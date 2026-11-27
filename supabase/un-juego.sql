-- UN SOLO JUEGO POR PERSONA en el registro.
-- Pega y ejecuta (Run) en Supabase > SQL Editor. NO borra ni cambia a nadie: solo reemplaza la regla de registrarse.
-- (Quien ya esté en dos juegos se queda como está; el organizador puede quitarle uno desde el panel.)
drop function if exists public.registrar(text, text, text, text, text, text);          -- versiones anteriores
drop function if exists public.registrar(text, text, text, text, text, text, text);
drop function if exists public.registrar(text, text, text, text, text, text, text, text);
create or replace function public.registrar(p_nombre text, p_ficha text, p_doc text, p_juego text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_nombre text := left(regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g'), 120);
  v_ficha text := left(trim(coalesce(p_ficha, '')), 40);
  v_doc text := left(regexp_replace(coalesce(p_doc, ''), '\D', '', 'g'), 20);
  v_otro text;
begin
  if position(' ' in v_nombre) = 0 or v_ficha = '' or length(v_doc) < 5 or p_juego not in ('Ajedrez', 'Dominó', 'Bingo') then
    return jsonb_build_object('ok', false, 'error', 'datos');
  end if;

  perform pg_advisory_xact_lock(hashtext('torneo-inscribir'));   -- evita dos registros a la vez con la misma cédula

  if exists (select 1 from public.inscritos where doc = v_doc and juego = p_juego) then
    return jsonb_build_object('ok', false, 'duplicado', true, 'juego', p_juego);
  end if;
  -- una persona = un solo juego (solo el organizador puede pasarla a otro desde el panel)
  select juego into v_otro from public.inscritos where doc = v_doc limit 1;
  if v_otro is not null then
    return jsonb_build_object('ok', false, 'duplicado', true, 'juego', v_otro);
  end if;

  insert into public.inscritos (nombre, ficha, doc, juego) values (v_nombre, v_ficha, v_doc, p_juego);
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.registrar(text, text, text, text) to anon, authenticated;
