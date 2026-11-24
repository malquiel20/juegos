# Torneo de Juegos

Dos páginas que usan **la misma lista** (una hoja de Google Sheets tuya). Funciona igual que la invitación de la boda.

- **Registro (jugadores):** `https://malquiel20.github.io/juegos/`
- **Panel del organizador:** `https://malquiel20.github.io/juegos/admin.html` (entra directo, sin pedir clave)

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
- **Bingo:** escribes cuántos **cartones** hay. Cada ronda juega ese número de personas: primero los inscritos, **en el orden en que se registraron**, y al final los que agregues a mano (*Agregar jugador sin inscribir*). Con 20 inscritos y 8 cartones: ronda 1 = 8, ronda 2 = 8, ronda 3 = los 4 que faltan (y, si agregaste a alguien más, entran después de ellos). Marca cada ronda como jugada y pasa a la siguiente.
- **Llaves de dominó:** eliminación directa con las parejas confirmadas. Toca una pareja para marcarla ganadora.

## Privacidad (importante)
- El panel **no pide clave**: usa la `claveAdmin` que está en `js/config.js`, que es pública en GitHub. Por eso **cualquiera que conozca el enlace del panel (o del script) puede ver la lista de inscritos con sus cédulas**. No compartas el enlace del panel con los jugadores; compárteles solo el del registro.
- Si más adelante quieres volver a proteger la lista, borra `claveAdmin` de `js/config.js` y pon una clave nueva en `CLAVE_ADMIN` del script (el panel la pedirá).
- Equipos, llaves y resultados de ajedrez se guardan en el navegador del organizador: usa siempre el mismo dispositivo. Los inscritos no se pierden, están en tu hoja de Google.
