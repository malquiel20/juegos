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
  async function conClave(fn, args, silencioso) {
    for (let intento = 0; intento < 2; intento++) {
      let c = intento ? "" : (localStorage.getItem(CLAVE_KEY) || "");
      if (!c) {
        if (silencioso && Date.now() - canceloClave < 30000) return { ok: false, error: "cancelado" };
        c = (prompt("Escribe tu clave del organizador.\n(Solo se pide una vez en este dispositivo.)") || "").trim();
        if (!c) { canceloClave = Date.now(); return { ok: false, error: "cancelado" }; }
      }
      const j = await rpc(fn, Object.assign({}, args, { p_clave: c }));
      if (j && j.ok) { try { localStorage.setItem(CLAVE_KEY, c); } catch (e) { /* ok */ } return j; }
      if (j && j.error === "clave") { try { localStorage.removeItem(CLAVE_KEY); } catch (e) { /* ok */ } alert("La clave no es correcta."); continue; }
      return j;
    }
    return { ok: false, error: "clave" };
  }

  /* ---------- modo de prueba (reglas iguales a las del servidor) ---------- */
  function registrarDemo(d) {
    const lista = lsGet(DEMO_KEY, []), propios = lista.filter(x => x.doc === d.doc).map(x => x.juego);
    if (propios.includes(d.juego)) return { ok: false, duplicado: true, juego: d.juego };
    if (d.juego !== "Bingo") { const otro = propios.find(j => j !== "Bingo"); if (otro) return { ok: false, duplicado: true, juego: otro }; }
    lista.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), fecha: new Date().toISOString(), nombre: d.nombre, ficha: d.ficha, doc: d.doc, juego: d.juego, companero: d.comp, companeroNombre: d.compNombre });
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
    if (D.modo === "nube") return rpc("registrar", { p_nombre: d.nombre, p_ficha: d.ficha, p_doc: d.doc, p_juego: d.juego, p_comp: d.comp || "", p_comp_nombre: d.compNombre || "" });
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

  D.vaciar = async function () {
    if (D.modo === "nube") return conClave("vaciar", {});
    if (D.modo === "servidor") return (await fetch("/api/vaciar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmar: "BORRAR" }) })).json();
    lsSet(DEMO_KEY, []); return { ok: true };
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
    const filas = [["Fecha", "Nombre", "Ficha", "Cédula", "Juego", "Cédula del compañero", "Nombre del compañero"]]
      .concat(lista.map(p => [p.fecha || "", p.nombre, p.ficha, p.doc, p.juego, p.companero, p.companeroNombre]));
    return "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
  };

  window.Datos = D;
})();
