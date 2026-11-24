// ===== Lista interna del torneo (reemplaza al Google Form) =====
// Pasos (3 minutos): ver README.md > "Crear la lista".
// 1) Cambia CLAVE por una clave tuya (solo tú la usas en el panel).
// 2) Implementar > Nueva implementación > Aplicación web > Ejecutar como: Yo · Acceso: Cualquier persona.
const CLAVE = "cambia-esta-clave";
const HOJA = "Inscritos";
const JUEGOS = ["Ajedrez", "Dominó", "Bingo"];

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if (!sh) {
    sh = ss.insertSheet(HOJA);
    sh.getRange("A1:F1").setValues([["Fecha", "Nombre", "Ficha", "Cédula", "Juego", "Compañero"]]).setFontWeight("bold");
    sh.getRange("C:D").setNumberFormat("@");   // texto, para no perder ceros ni formatos
    sh.getRange("F:F").setNumberFormat("@");
    sh.setFrozenRows(1);
  }
  return sh;
}
const solo_ = v => String(v || "").replace(/\D/g, "");
const salida_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

// Registro: lo llama la página de los jugadores. La cédula no se puede repetir (en ningún juego).
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return salida_({ ok: false, error: "datos" }); }
  const nombre = String(d.nombre || "").trim().replace(/\s+/g, " "), ficha = String(d.ficha || "").trim();
  const doc = solo_(d.doc), juego = String(d.juego || ""), comp = solo_(d.comp);
  if (nombre.indexOf(" ") < 0 || !ficha || doc.length < 5 || JUEGOS.indexOf(juego) < 0) return salida_({ ok: false, error: "datos" });
  if (juego === "Dominó" && (comp.length < 5 || comp === doc)) return salida_({ ok: false, error: "companero" });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = hoja_();
    const dup = sh.getDataRange().getValues().slice(1).find(r => solo_(r[3]) === doc);
    if (dup) return salida_({ ok: false, duplicado: true, juego: String(dup[4]) });
    sh.appendRow([new Date(), nombre, ficha, doc, juego, juego === "Dominó" ? comp : ""]);
    return salida_({ ok: true });
  } finally { lock.releaseLock(); }
}

// Lista: la lee el panel del organizador y SOLO responde si trae la clave.
function doGet(e) {
  const p = e.parameter || {};
  if (p.accion === "lista") {
    if (p.clave !== CLAVE) return salida_({ ok: false, error: "clave" });
    const inscritos = hoja_().getDataRange().getValues().slice(1)
      .map(r => ({ nombre: String(r[1]), ficha: String(r[2]), doc: solo_(r[3]), juego: String(r[4]), companero: solo_(r[5]) }));
    return salida_({ ok: true, inscritos: inscritos });
  }
  return salida_({ ok: true, mensaje: "Lista del torneo activa" });
}
