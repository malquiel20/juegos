# Torneo de Juegos

Dos páginas que usan **la misma lista** (una hoja de Google Sheets tuya). Funciona igual que la invitación de la boda.

- **Registro (jugadores):** `https://malquiel20.github.io/juegos/`
- **Panel del organizador:** `https://malquiel20.github.io/juegos/admin.html` (pide tu clave)

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Registro: nombre y apellido, ficha (lista), cédula y juego (lista). En Dominó pide además la cédula del compañero. |
| `admin.html` | Panel: inscritos por juego, equipos de dominó, clasificación de ajedrez y llaves de dominó. |
| `js/config.js` | **Lo único que editas**: la URL de tu script y las fichas. |
| `google-apps-script/Codigo.gs` | Script que guarda las inscripciones en tu hoja y evita cédulas repetidas. |

## Modo de prueba
Mientras `urlGoogleScript` esté vacío en `js/config.js`, las páginas funcionan en **modo de prueba**: las inscripciones se guardan solo en el navegador (sirve para probar el recorrido completo en un mismo celular o computador). Un aviso lo indica.

## Guardar las inscripciones en Google Sheets (una vez, ~5 minutos)
1. Entra a [sheets.google.com](https://sheets.google.com) y crea una **hoja de cálculo nueva** (por ejemplo "Torneo").
2. Menú **Extensiones → Apps Script**. Borra lo que aparece y pega **todo** el contenido de `google-apps-script/Codigo.gs`.
3. En la línea `var CLAVE_ADMIN = "cambia-esta-clave";` escribe una clave tuya (la usarás en el panel). Guarda con el ícono del disquete.
4. **Implementar → Nueva implementación**: en el engranaje elige **Aplicación web**, *Ejecutar como*: **Yo**, *Quién tiene acceso*: **Cualquier usuario**, y **Implementar**.
5. Google pedirá permisos. Si dice "Google no ha verificado esta app": **Configuración avanzada → Ir a (nombre del proyecto) → Permitir**. Es tu propio script.
6. Copia la **URL de la aplicación web** (termina en `/exec`).
7. Pégala en `js/config.js`:
   ```js
   urlGoogleScript: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
8. Para probar, abre esa URL en el navegador: debe decir *"El script del torneo está funcionando."*

Se crea sola la pestaña **Inscritos** en tu hoja (una fila por persona). Si después cambias el script: **Implementar → Administrar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar** (la URL no cambia).

## Cómo funciona
- **Una cédula, un solo registro:** el script rechaza la cédula si ya está en cualquier juego. Es lo único que se valida; la ficha puede repetirse.
- **Equipos de dominó:** los arman los participantes. Una pareja queda confirmada cuando los dos se escriben mutuamente (A pone la cédula de B y B la de A). Los demás aparecen como *Pendientes*, y puedes unirlos a mano.
- **Ajedrez:** sistema suizo. Eliges las rondas, el programa empareja a los que van con puntos parecidos y tú marcas cada resultado (1-0, ½, 0-1). Victoria 1, tablas ½, descanso 1. Desempate Buchholz.
- **Llaves de dominó:** eliminación directa con las parejas confirmadas. Toca una pareja para marcarla ganadora.

## Privacidad
- **Público:** lo que está en los archivos de la página (`config.js` con la URL del script y las fichas).
- **Privado:** la lista de inscritos con sus cédulas. Vive en **tu** hoja y el panel solo la muestra con tu clave (el script no responde la lista sin ella, y no funciona mientras tenga la clave de ejemplo). Usa una clave difícil de adivinar.
- Los jugadores solo ven el registro. `admin.html` está marcado para que los buscadores no lo muestren.
- Equipos, llaves y resultados de ajedrez se guardan en el navegador del organizador: usa siempre el mismo dispositivo. Los inscritos no se pierden, están en tu hoja.
