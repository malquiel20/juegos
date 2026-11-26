-- =====================================================================
--  TORNEO DE JUEGOS · base de datos en Supabase
--  Pégalo completo en Supabase > SQL Editor > New query > Run.
--  ANTES de ejecutarlo escribe tu clave en el lugar marcado "TU CLAVE AQUÍ"
--  (solo ahí, una sola vez). La clave solo se pide para BORRAR inscritos
--  o GUARDAR resultados del panel. Ver y registrarse no piden clave.
-- =====================================================================

-- ---------- tablas ----------
create table if not exists public.inscritos (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  nombre text not null,
  ficha text not null,
  doc text not null,
  juego text not null check (juego in ('Ajedrez', 'Dominó', 'Bingo'))
);
create unique index if not exists inscritos_doc_juego on public.inscritos (doc, juego);

create table if not exists public.estado (
  id int primary key check (id = 1),
  datos jsonb not null default '{}'::jsonb
);
insert into public.estado (id, datos) values (1, '{}'::jsonb) on conflict (id) do nothing;

create table if not exists public.ajustes (
  id int primary key check (id = 1),
  clave text not null
);

-- ---------- tu clave (cámbiala SOLO aquí) ----------
do $clave$
declare
  v_clave text := 'TU CLAVE AQUÍ';   -- <- escribe aquí tu clave, entre las comillas
begin
  if v_clave = 'TU CLAVE' || ' AQUÍ' or length(trim(v_clave)) < 4 then
    raise exception 'Antes de ejecutar, cambia TU CLAVE AQUÍ por una clave tuya (mínimo 4 caracteres).';
  end if;
  insert into public.ajustes (id, clave) values (1, trim(v_clave))
  on conflict (id) do update set clave = excluded.clave;
end
$clave$;

-- Nadie accede a las tablas directamente: todo pasa por las funciones de abajo.
alter table public.inscritos enable row level security;
alter table public.estado enable row level security;
alter table public.ajustes enable row level security;
revoke all on public.inscritos, public.estado, public.ajustes from anon, authenticated;

-- ---------- funciones ----------
create or replace function public.clave_ok(p_clave text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.ajustes where id = 1 and clave = coalesce(p_clave, ''));
$$;

-- Inscribir: una cédula no se repite en el mismo juego; Ajedrez y Dominó son excluyentes; el Bingo se puede sumar.
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
  if p_juego <> 'Bingo' then
    select juego into v_otro from public.inscritos where doc = v_doc and juego <> 'Bingo' limit 1;
    if v_otro is not null then
      return jsonb_build_object('ok', false, 'duplicado', true, 'juego', v_otro);
    end if;
  end if;

  insert into public.inscritos (nombre, ficha, doc, juego) values (v_nombre, v_ficha, v_doc, p_juego);
  return jsonb_build_object('ok', true);
end $$;

-- Lista de inscritos (la usa el panel; no pide clave).
create or replace function public.listar() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'fecha', fecha, 'nombre', nombre, 'ficha', ficha, 'doc', doc, 'juego', juego) order by fecha, id), '[]'::jsonb)
  from public.inscritos;
$$;

create or replace function public.borrar(p_id uuid, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.clave_ok(p_clave) then return jsonb_build_object('ok', false, 'error', 'clave'); end if;
  delete from public.inscritos where id = p_id;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'borrados', n);
end $$;

create or replace function public.vaciar(p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.clave_ok(p_clave) then return jsonb_build_object('ok', false, 'error', 'clave'); end if;
  delete from public.inscritos where true;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'borrados', n);
end $$;

-- Estado del panel (parejas, llaves, ajedrez, bingo): se lee libre, se guarda con clave.
create or replace function public.leer_estado() returns jsonb
language sql security definer set search_path = public as $$
  select datos from public.estado where id = 1;
$$;

create or replace function public.guardar_estado(p_datos jsonb, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.clave_ok(p_clave) then return jsonb_build_object('ok', false, 'error', 'clave'); end if;
  update public.estado set datos = coalesce(p_datos, '{}'::jsonb) where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- Pasar a una persona de un juego a otro (la usa el panel del organizador).
create or replace function public.mover(p_id uuid, p_juego text, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.inscritos%rowtype; v_otro text;
begin
  if not public.clave_ok(p_clave) then return jsonb_build_object('ok', false, 'error', 'clave'); end if;
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


grant execute on function public.clave_ok(text), public.registrar(text, text, text, text), public.listar(),
  public.borrar(uuid, text), public.vaciar(text), public.leer_estado(), public.guardar_estado(jsonb, text), public.mover(uuid, text, text) to anon, authenticated;
