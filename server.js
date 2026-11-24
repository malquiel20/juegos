/*
 * =====================================================================
 *  TORNEO DE JUEGOS · programa web con base de datos propia
 *  Sin dependencias: solo necesita Node.js (versión 18 o mayor).
 *  Uso:  node server.js      (o doble clic en iniciar.bat en Windows)
 *
 *  Guarda todo en la carpeta "datos/":
 *    datos/inscritos.json  -> la lista de inscritos (la base de datos)
 *    datos/estado.json     -> parejas, llaves, ajedrez y bingo del panel
 * =====================================================================
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");

const PORT = Number(process.env.PORT) || 3000;
const SOLO_ESTE_EQUIPO = process.env.SOLO_ESTE_EQUIPO === "1";   // 1 = el panel solo abre en el equipo donde corre el programa
const RAIZ = __dirname;
const DATOS = process.env.DATOS_DIR || path.join(RAIZ, "datos");
const F_INSCRITOS = path.join(DATOS, "inscritos.json");
const F_ESTADO = path.join(DATOS, "estado.json");
const JUEGOS = ["Ajedrez", "Dominó", "Bingo"];
const MAX_INSCRITOS = 5000;

fs.mkdirSync(DATOS, { recursive: true });

/* ---------- base de datos (archivos JSON, escritura segura) ---------- */
function leer(archivo, porDefecto) {
  try { return JSON.parse(fs.readFileSync(archivo, "utf8")); } catch (e) { return porDefecto; }
}
function escribir(archivo, datos) {
  const tmp = archivo + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(datos, null, 1));
  try { if (fs.existsSync(archivo)) fs.copyFileSync(archivo, archivo + ".bak"); } catch (e) { /* sin copia */ }
  fs.renameSync(tmp, archivo);
}
let inscritos = leer(F_INSCRITOS, []);
let estado = leer(F_ESTADO, null);

/* ---------- reglas de inscripción ---------- */
const soloNumeros = v => String(v == null ? "" : v).replace(/\D/g, "");
const texto = (v, max) => String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, max || 120);

function registrar(d) {
  d = d || {};
  const nombre = texto(d.nombre), ficha = texto(d.ficha, 40), doc = soloNumeros(d.doc).slice(0, 20), juego = texto(d.juego, 20);
  const comp = soloNumeros(d.comp).slice(0, 20), compNombre = texto(d.compNombre), compFicha = texto(d.compFicha, 40);
  if (!nombre.includes(" ") || !ficha || doc.length < 5 || !JUEGOS.includes(juego)) return { ok: false, error: "datos" };
  if (juego === "Dominó" && (comp.length < 5 || comp === doc)) return { ok: false, error: "companero" };
  if (juego === "Dominó" && (!compNombre.includes(" ") || !compFicha)) return { ok: false, error: "companero" };
  if (inscritos.length >= MAX_INSCRITOS) return { ok: false, error: "lleno" };

  // Una cédula no se repite en el mismo juego; Ajedrez y Dominó son excluyentes; el Bingo se puede sumar.
  const existentes = inscritos.filter(p => p.doc === doc).map(p => p.juego);
  if (existentes.includes(juego)) return { ok: false, duplicado: true, juego };
  if (juego !== "Bingo") {
    const otro = existentes.find(j => j !== "Bingo");
    if (otro) return { ok: false, duplicado: true, juego: otro };
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  inscritos.push({
    id, fecha: new Date().toISOString(), nombre, ficha, doc, juego,
    companero: juego === "Dominó" ? comp : "", companeroNombre: juego === "Dominó" ? compNombre : "", companeroFicha: juego === "Dominó" ? compFicha : "",
  });
  escribir(F_INSCRITOS, inscritos);
  return { ok: true };
}

function csv() {
  const celda = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const filas = [["Fecha", "Nombre", "Ficha", "Cédula", "Juego", "Cédula del compañero", "Nombre del compañero", "Ficha del compañero"]]
    .concat(inscritos.map(p => [p.fecha, p.nombre, p.ficha, p.doc, p.juego, p.companero, p.companeroNombre, p.companeroFicha]));
  return "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
}

/* ---------- servidor ---------- */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };
const PUBLICOS = ["index.html", "admin.html"];   // y todo lo que esté dentro de js/

function esLocal(req) {
  // Si la visita llega por un túnel de internet (Cloudflare/ngrok) trae estas cabeceras: no cuenta como "este equipo".
  if (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]) return false;
  const a = req.socket.remoteAddress || "";
  return a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1";
}
function json(res, codigo, obj) {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function cuerpo(req, limite) {
  return new Promise((resolve, reject) => {
    let total = 0; const partes = [];
    req.on("data", c => { total += c.length; if (total > limite) { reject(new Error("grande")); req.destroy(); } else partes.push(c); });
    req.on("end", () => { try { resolve(partes.length ? JSON.parse(Buffer.concat(partes).toString("utf8")) : {}); } catch (e) { reject(new Error("json")); } });
    req.on("error", reject);
  });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const ruta = decodeURIComponent(url.pathname);
  try {
    if (ruta.startsWith("/api/")) {
      // Registro y ping: abiertos para los jugadores
      if (ruta === "/api/ping") return json(res, 200, { ok: true, servidor: true });
      if (ruta === "/api/registro" && req.method === "POST") return json(res, 200, registrar(await cuerpo(req, 20000)));
      // Panel del organizador
      if (SOLO_ESTE_EQUIPO && !esLocal(req)) return json(res, 403, { ok: false, error: "solo-este-equipo" });
      if (ruta === "/api/inscritos" && req.method === "GET") return json(res, 200, { ok: true, inscritos });
      if (ruta.startsWith("/api/inscritos/") && req.method === "DELETE") {
        const id = ruta.slice("/api/inscritos/".length), antes = inscritos.length;
        inscritos = inscritos.filter(p => p.id !== id);
        if (inscritos.length !== antes) escribir(F_INSCRITOS, inscritos);
        return json(res, 200, { ok: true, borrados: antes - inscritos.length });
      }
      if (ruta === "/api/vaciar" && req.method === "POST") {
        const d = await cuerpo(req, 2000);
        if (d.confirmar !== "BORRAR") return json(res, 400, { ok: false, error: "confirmar" });
        const n = inscritos.length; inscritos = []; escribir(F_INSCRITOS, inscritos);
        return json(res, 200, { ok: true, borrados: n });
      }
      if (ruta === "/api/estado" && req.method === "GET") return json(res, 200, { ok: true, estado });
      if (ruta === "/api/estado" && req.method === "PUT") { estado = await cuerpo(req, 3000000); escribir(F_ESTADO, estado); return json(res, 200, { ok: true }); }
      if (ruta === "/api/exportar.csv" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="inscritos.csv"', "Cache-Control": "no-store" });
        return res.end(csv());
      }
      return json(res, 404, { ok: false, error: "no-existe" });
    }
    // Archivos de las páginas
    const nombre = ruta === "/" ? "index.html" : ruta.replace(/^\/+/, "");
    const permitido = PUBLICOS.includes(nombre) || (nombre.startsWith("js/") && !nombre.includes(".."));
    const archivo = path.join(RAIZ, nombre);
    if (!permitido || !archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || !fs.statSync(archivo).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado");
    }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(archivo).pipe(res);
  } catch (e) {
    json(res, 400, { ok: false, error: e.message === "grande" ? "demasiado-grande" : "datos" });
  }
});

servidor.on("error", e => {
  if (e.code === "EADDRINUSE") console.error(`\nEl puerto ${PORT} ya está en uso. Cierra el otro programa o abre este con otro puerto (ejemplo: PORT=3001 node server.js).`);
  else console.error(e);
  process.exit(1);
});

servidor.listen(PORT, "0.0.0.0", () => {
  const redes = [];
  Object.values(os.networkInterfaces()).forEach(l => (l || []).forEach(i => { if (i.family === "IPv4" && !i.internal) redes.push(i.address); }));
  console.log("\n  TORNEO DE JUEGOS · programa en marcha\n");
  console.log("  En este equipo:");
  console.log(`    Panel del organizador:  http://localhost:${PORT}/admin.html`);
  console.log(`    Registro:               http://localhost:${PORT}/`);
  if (redes.length) {
    console.log("\n  Para los jugadores (mismo Wi-Fi), comparte SOLO esta dirección:");
    redes.forEach(ip => console.log(`    Registro:               http://${ip}:${PORT}/`));
  }
  console.log(`\n  Inscritos guardados: ${inscritos.length}   ·   Base de datos: ${DATOS}`);
  if (SOLO_ESTE_EQUIPO) console.log("  El panel solo abre en este equipo.");
  console.log("  Para cerrar el programa: Ctrl + C\n");
  if (process.env.ABRIR_NAVEGADOR === "1" && process.platform === "win32") exec(`start "" "http://localhost:${PORT}/admin.html"`);
});
