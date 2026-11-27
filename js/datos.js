/*
 * Capa de datos del torneo. Elige sola dónde guardar:
 *   1) "nube"     -> Supabase (si js/config.js tiene supabase.url y supabase.key)
 *   2) "servidor" -> el programa local (server.js)
 *   3) "demo"     -> solo en este navegador (modo de prueba)
 */
(function () {
  const CFG = window.TORNEO || {}, SB = CFG.supabase || {};
  const DEMO_KEY = "torneo-demo", LS_ESTADO = "torneo_admin_v1", CLAVE_KEY = "torneo-clave";
  const usaNube = !!(SB.url && SB.key);
  const JUEGOS = ["Ajedrez", "Dominó", "Bingo"];
  const D = { modo: "demo" };
  const lsGet = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  /* ---------- Supabase (REST/RPC con fetch) ---------- */
  function cabeceras() {
    const h = { apikey: SB.key, "Content-Type": "application/json" };
    if (SB.key.split(".").length === 3) h.Authorization = "Bearer " + SB.key;   // llaves antiguas (JWT)
    return h;
  }
  async function rpc(fn, args) {
    const r = await fetch(SB.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, { method: "POST", headers: cabeceras(), body: JSON.stringify(args || {}) });
    let j; try { j = await r.json(); } catch (e) { throw new Error("respuesta"); }
    if (!r.ok) throw new Error((j && j.message) || "http");
    return j;
  }
  let canceloClave = 0;
  // Borrar y guardar el estado del panel: primero se intenta SIN pedir nada. Si la base de datos no exige clave
  // (supabase/sin-clave.sql), listo. Si la exige, se pide una sola vez en este dispositivo y se recuerda.
  async function conClave(fn, args, silencioso) {
    const guardada = localStorage.getItem(CLAVE_KEY) || "";
    const j0 = await rpc(fn, Object.assign({}, args, { p_clave: guardada }));
    if (!j0 || j0.ok || j0.error !== "clave") return j0;
    if (guardada) { try { localStorage.removeItem(CLAVE_KEY); } catch (e) { /* ok */ } }
    for (let intento = 0; intento < 2; intento++) {
      if (silencioso && Date.now() - canceloClave < 30000) return { ok: false, error: "cancelado" };
      const c = (prompt("Escribe tu clave del organizador.\n(Solo se pide una vez en este dispositivo.)") || "").trim();
      if (!c) { canceloClave = Date.now(); return { ok: false, error: "cancelado" }; }
      const j = await rpc(fn, Object.assign({}, args, { p_clave: c }));
      if (j && j.ok) { try { localStorage.setItem(CLAVE_KEY, c); } catch (e) { /* ok */ } return j; }
      if (j && j.error === "clave") { alert("La clave no es correcta."); continue; }
      return j;
    }
    return { ok: false, error: "clave" };
  }

  /* ---------- modo de prueba (reglas iguales a las del servidor) ---------- */
  function registrarDemo(d) {
    const lista = lsGet(DEMO_KEY, []), propios = lista.filter(x => x.doc === d.doc).map(x => x.juego);
    if (propios.includes(d.juego)) return { ok: false, duplicado: true, juego: d.juego };
    if (propios.length) return { ok: false, duplicado: true, juego: propios[0] };
    lista.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), fecha: new Date().toISOString(), nombre: d.nombre, ficha: d.ficha, doc: d.doc, juego: d.juego });
    lsSet(DEMO_KEY, lista);
    return { ok: true };
  }

  /* ---------- API pública ---------- */
  D.iniciar = async function () {
    if (usaNube) return (D.modo = "nube");
    try { const r = await fetch("/api/ping", { cache: "no-store" }); const j = await r.json(); if (j && j.servidor) return (D.modo = "servidor"); } catch (e) { /* sin programa local */ }
    return (D.modo = "demo");
  };

  D.registrar = async function (d) {   // d: { nombre, ficha, doc, juego, comp, compNombre }
    if (D.modo === "nube") return rpc("registrar", { p_nombre: d.nombre, p_ficha: d.ficha, p_doc: d.doc, p_juego: d.juego });
    if (D.modo === "servidor") { const r = await fetch("/api/registro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); return r.json(); }
    return registrarDemo(d);
  };

  D.listar = async function () {
    if (D.modo === "nube") return rpc("listar");
    if (D.modo === "servidor") { const j = await (await fetch("/api/inscritos", { cache: "no-store" })).json(); if (!j.ok) throw new Error(j.error || "error"); return j.inscritos; }
    return lsGet(DEMO_KEY, []);
  };

  D.borrar = async function (id) {
    if (D.modo === "nube") return conClave("borrar", { p_id: id });
    if (D.modo === "servidor") return (await fetch("/api/inscritos/" + encodeURIComponent(id), { method: "DELETE" })).json();
    lsSet(DEMO_KEY, lsGet(DEMO_KEY, []).filter(x => x.id !== id)); return { ok: true };
  };

  // Pasar a una persona de un juego a otro (organizador). Mismas reglas que al registrarse.
  D.mover = async function (id, juego) {
    if (D.modo === "nube") {
      try { return await conClave("mover", { p_id: id, p_juego: juego }); }
      catch (e) { return { ok: false, error: /find the function|PGRST202|mover/i.test(String(e.message)) ? "sql" : "red" }; }
    }
    if (D.modo === "servidor") return (await fetch("/api/mover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, juego }) })).json();
    const lista = lsGet(DEMO_KEY, []), p = lista.find(x => x.id === id);
    if (!p) return { ok: false, error: "no_existe" };
    if (p.juego === juego) return { ok: false, error: "mismo" };
    const mios = lista.filter(x => x.doc === p.doc);
    if (mios.some(x => x.juego === juego)) return { ok: false, error: "ya_esta", juego };
    if (juego !== "Bingo") { const otro = mios.find(x => x.id !== p.id && x.juego !== "Bingo"); if (otro) return { ok: false, error: "excluyente", juego: otro.juego }; }
    const de = p.juego; p.juego = juego; if (juego === "Bingo") p.fecha = new Date().toISOString();
    lsSet(DEMO_KEY, lista); return { ok: true, de, a: juego };
  };

  D.vaciar = async function () {
    if (D.modo === "nube") return conClave("vaciar", {});
    if (D.modo === "servidor") return (await fetch("/api/vaciar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmar: "BORRAR" }) })).json();
    lsSet(DEMO_KEY, []); return { ok: true };
  };

  // Empezar de cero: borra los inscritos y todo lo del panel (equipos, llaves, ajedrez, bingo).
  D.reiniciarTodo = async function () {
    const r = await D.vaciar();
    if (!r || r.ok === false) return r || { ok: false };
    lsSet(LS_ESTADO, {});
    const e = await D.guardarEstado({});
    return e && e.ok === false ? e : { ok: true };
  };

  D.leerEstado = async function () {
    if (D.modo === "nube") { try { const e = await rpc("leer_estado"); return e && typeof e === "object" ? e : {}; } catch (err) { return lsGet(LS_ESTADO, {}); } }
    if (D.modo === "servidor") { const j = await (await fetch("/api/estado", { cache: "no-store" })).json(); return (j && j.estado) || {}; }
    return lsGet(LS_ESTADO, {});
  };

  D.guardarEstado = async function (estado) {
    lsSet(LS_ESTADO, estado);   // copia local de respaldo
    if (D.modo === "nube") return conClave("guardar_estado", { p_datos: estado }, true);
    if (D.modo === "servidor") return (await fetch("/api/estado", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(estado) })).json();
    return { ok: true };
  };

  D.csv = function (lista) {
    const celda = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const filas = [["Fecha", "Nombre", "Ficha", "Cédula", "Juego"]]
      .concat(lista.map(p => [p.fecha || "", p.nombre, p.ficha, p.doc, p.juego]));
    return "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
  };

  window.Datos = D;
})();
