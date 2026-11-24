# Torneo de Juegos

Programa web con **base de datos propia** (sin Google). Un solo programa que:
- recibe las **inscripciones** de los jugadores (página de registro),
- las guarda en una **base de datos** (carpeta `datos/`),
- y te muestra todo en el **panel del organizador**: inscritos por juego, equipos de dominó, clasificación de ajedrez, rondas de bingo y llaves.

El registro y el panel usan **los mismos datos**, y el panel **no pide contraseña**.

## Cómo usarlo (Windows)
1. Instala **Node.js** (versión LTS) desde https://nodejs.org, una sola vez.
2. Descarga este proyecto (en GitHub: botón verde **Code > Download ZIP**) y descomprímelo.
3. Haz **doble clic en `iniciar.bat`**. Se abre una ventana negra (no la cierres) y el panel se abre solo en el navegador.
4. Si Windows pregunta por el **Firewall**, pulsa **Permitir acceso** (redes privadas). Es lo que deja entrar a los celulares de los jugadores.
5. En la ventana negra aparece la dirección para los jugadores, por ejemplo `http://192.168.1.20:3000/`. **Compártela solo con los jugadores** (deben estar conectados al **mismo Wi-Fi** que tu computador).

En otros sistemas: `node server.js`.

Para apagarlo: cierra la ventana negra (o `Ctrl + C`). Los datos quedan guardados.

## Direcciones
| Para | Dirección |
|---|---|
| Jugadores (registro) | `http://TU-IP:3000/` (la muestra la ventana negra) |
| Organizador (panel) | `http://localhost:3000/admin.html` |

## Dónde se guardan los datos
En la carpeta **`datos/`** junto al programa:
- `inscritos.json`: la lista de inscritos (la base de datos). Se guarda una copia de seguridad `.bak` en cada cambio.
- `estado.json`: parejas de dominó, llaves, ajedrez y bingo del panel.

Desde el panel puedes **descargar la lista en Excel/CSV**, **quitar** a una persona (✕) o **vaciar** toda la lista (pide escribir `BORRAR`).

## Reglas de inscripción
- Una **cédula** no se repite en el mismo juego.
- **Ajedrez y Dominó son excluyentes**: una persona solo puede estar en uno de los dos.
- El **Bingo se puede sumar** (una vez) aunque la persona ya esté en otro juego.
- En **Dominó** se piden además el **nombre y apellido** y la **cédula** del compañero. La ficha se elige de una lista (`js/config.js`) y puede repetirse.

## Panel del organizador
- **Inscritos:** quién se registró en cada juego (con buscador).
- **Equipos (dominó):** los arman los participantes: una pareja queda confirmada cuando los dos se escriben mutuamente. Los demás quedan *pendientes* y puedes unirlos a mano.
- **Ajedrez:** sistema suizo. Eliges las rondas, el programa empareja y tú marcas cada resultado (1-0, ½, 0-1). Victoria 1, tablas ½, descanso 1. Desempate Buchholz.
- **Bingo:** escribes cuántos **cartones** hay. Cada ronda juegan tantos jugadores como cartones: primero los que solo se inscribieron en Bingo (por orden de registro), luego los que ya estaban en otro juego, y al final los que agregues a mano.
- **Llaves (dominó):** eliminación directa con las parejas confirmadas. Toca una pareja para marcarla ganadora.

## Privacidad
- Los jugadores solo necesitan el enlace del **registro**. **No compartas el del panel**: quien lo abra puede ver las cédulas.
- Si quieres que el panel **solo abra en tu computador**, inicia con `SOLO_ESTE_EQUIPO=1` (en `iniciar.bat` añade la línea `set SOLO_ESTE_EQUIPO=1` antes de `node server.js`).
- El programa solo entrega las páginas (`index.html`, `admin.html`, `js/`). Los archivos internos y la carpeta `datos/` no se pueden descargar desde la red.

## ¿Jugadores fuera de tu Wi-Fi? Link público
Haz doble clic en **`compartir-internet.bat`** (en vez de `iniciar.bat`). La primera vez instala **cloudflared** (gratis, sin cuenta) y te pide abrir el archivo otra vez. Después muestra una dirección como `https://algo-aleatorio.trycloudflare.com`:
- **Esa dirección es el REGISTRO**: compártela con los jugadores (funciona desde cualquier lugar, con datos o Wi-Fi).
- **El PANEL** queda **solo en tu computador**: `http://localhost:3000/admin.html`. Nadie entra al panel por el link público.
- La dirección cambia cada vez que lo abres, y solo funciona mientras tu computador y las dos ventanas estén abiertos.

## Archivos
`server.js` (el programa y la base de datos) · `index.html` (registro) · `admin.html` (panel) · `js/config.js` (fichas) · `iniciar.bat` (arranque en Windows) · `compartir-internet.bat` (arranque con link público) · `package.json`

> La versión publicada en GitHub Pages (solo páginas, sin el programa) funciona en *modo de prueba*: guarda en el navegador y no comparte datos.
