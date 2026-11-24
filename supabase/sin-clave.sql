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

grant execute on function public.borrar(uuid, text), public.vaciar(text), public.guardar_estado(jsonb, text) to anon, authenticated;
