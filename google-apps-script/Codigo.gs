/**
 * =====================================================================
 *  GUARDAR LAS INSCRIPCIONES DEL TORNEO EN GOOGLE SHEETS
 * =====================================================================
 *  1. Entra a script.google.com > Nuevo proyecto (o, si prefieres, abre una hoja
 *     de cálculo nueva > Extensiones > Apps Script). Borra lo que aparece y pega
 *     todo este archivo. La hoja "Torneo - Inscritos" se crea sola en tu Drive.
 *  3. Cambia la CLAVE_ADMIN de abajo por una clave tuya.
 *  4. Implementar > Nueva implementación > Tipo: Aplicación web.
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *  5. Copia la URL que termina en /exec y pégala en js/config.js,
 *     en urlGoogleScript.
 *
 *  Se crea sola la pestaña "Inscritos" (una fila por persona).
 *  La cédula no se puede repetir en ningún juego.
 * =====================================================================
 */

var CLAVE_ADMIN = "cambia-esta-clave";

var HOJA_INSCRITOS = "Inscritos";
var COLUMNAS_INSCRITOS = ["Fecha", "Nombre", "Ficha", "Cédula", "Juego", "Compañero (dominó)"];
var JUEGOS = ["Ajedrez", "Dominó", "Bingo"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    var nombre = texto(d.nombre).replace(/\s+/g, " "), ficha = texto(d.ficha);
    var doc = soloNumeros(d.doc), juego = texto(d.juego), comp = soloNumeros(d.comp);
    if (nombre.indexOf(" ") < 0 || !ficha || doc.length < 5 || JUEGOS.indexOf(juego) < 0) throw new Error("Datos incompletos");
    if (juego === "Dominó" && (comp.length < 5 || comp === doc)) throw new Error("Falta la cédula del compañero");

    var h = hoja();
    var filas = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, COLUMNAS_INSCRITOS.length).getValues() : [];
    for (var i = 0; i < filas.length; i++) {
      if (soloNumeros(filas[i][3]) === doc) return json({ ok: false, duplicado: true, juego: String(filas[i][4]) });
    }
    h.appendRow([new Date(), nombre, ficha, doc, juego, juego === "Dominó" ? comp : ""]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.accion === "lista") {
      verificarClave(p.clave);
      var h = hoja();
      var filas = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, COLUMNAS_INSCRITOS.length).getValues() : [];
      return json({
        ok: true,
        inscritos: filas.map(function (f) {
          return { nombre: String(f[1]), ficha: String(f[2]), doc: soloNumeros(f[3]), juego: String(f[4]), companero: soloNumeros(f[5]) };
        }),
      });
    }
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
  return json({ ok: true, mensaje: "El script del torneo está funcionando." });
}

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------

function verificarClave(clave) {
  if (CLAVE_ADMIN === "cambia-esta-clave") throw new Error("Primero cambia la CLAVE_ADMIN en el script");
  if (clave !== CLAVE_ADMIN) throw new Error("Clave incorrecta");
}

function texto(v) {
  return String(v == null ? "" : v).trim().slice(0, 300);
}

function soloNumeros(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}

// Si el script está pegado dentro de una hoja, usa esa hoja.
// Si es un proyecto suelto (script.google.com), crea solo la hoja "Torneo - Inscritos" en tu Drive.
function libro() {
  var activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("LIBRO_ID");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) { /* se vuelve a crear */ } }
  var nuevo = SpreadsheetApp.create("Torneo - Inscritos");
  props.setProperty("LIBRO_ID", nuevo.getId());
  return nuevo;
}

function hoja() {
  var libro_ = libro();
  var h = libro_.getSheetByName(HOJA_INSCRITOS);
  if (!h) {
    h = libro_.getSheetByName("Hoja 1") || libro_.getSheetByName("Sheet1") || libro_.insertSheet(HOJA_INSCRITOS);
    h.setName(HOJA_INSCRITOS);
    h.appendRow(COLUMNAS_INSCRITOS);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, COLUMNAS_INSCRITOS.length).setFontWeight("bold").setBackground("#e6ecd9");
    h.getRange("C:D").setNumberFormat("@");   // texto: no pierde ceros ni formato
    h.getRange("F:F").setNumberFormat("@");
  }
  return h;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
