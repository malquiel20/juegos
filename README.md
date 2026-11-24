# Torneo de Juegos

Programa web con **base de datos** (Supabase o archivo propio; **sin Google**). Un solo programa que:
- recibe las **inscripciones** de los jugadores (página de registro),
- las guarda en una **base de datos** (carpeta `datos/`),
- y te muestra todo en el **panel del organizador**: inscritos por juego, creación de equipos de dominó, clasificación de ajedrez, rondas de bingo y llaves.

El registro y el panel usan **los mismos datos**, y el panel **no pide contraseña**.

## Dos formas de usarlo
### A) En GitHub + base de datos en la nube (Supabase) — links que abren desde cualquier celular
Las páginas se publican en GitHub Pages y los datos se guardan en una base de datos gratuita de **Supabase** (PostgreSQL). Los links:
- **Registro (jugadores):** `https://malquiel20.github.io/juegos/`
- **Panel (organizador):** `https://malquiel20.github.io/juegos/admin.html`

Preparación (una sola vez, ~5 minutos):
1. Entra a https://supabase.com, **Start your project** e inicia sesión con tu cuenta de GitHub.
2. **New project**: ponle nombre (por ejemplo `torneo`), una contraseña de base de datos (guárdala) y la región más cercana. Pulsa **Create** y espera 1–2 minutos.
3. Menú izquierdo **SQL Editor > New query**. Abre `supabase/instalar.sql`, **escribe tu clave** en la línea `v_clave text := 'TU CLAVE AQUÍ';`, pega todo el archivo y pulsa **Run**. Debe decir *Success*.
4. **Project Settings (engranaje) > API Keys** (o *Data API*): copia la **Project URL** y la llave **anon public** (o **publishable**).
5. Pégalas en `js/config.js`, en `supabase: { url: "...", key: "..." }`, y guarda (*Commit changes* en GitHub). En 1–2 minutos los links ya guardan en tu base de datos.

**Clave:** ver la lista de inscritos y registrarse **no piden clave**. La clave solo se pide para **borrar** inscritos o **guardar** cambios del panel (equipos, llaves, ajedrez, bingo), y queda recordada en ese dispositivo. Así ningún jugador puede alterar resultados ni vaciar la lista.

Supabase gratuito **pausa el proyecto tras 1 semana sin usarse**; se reactiva con un clic desde su página.

### B) Programa en tu computador (sin internet ni cuentas)
1. Instala **Node.js** (LTS) desde https://nodejs.org, una sola vez.
2. Descarga el proyecto (**Code > Download ZIP**), descomprímelo y haz doble clic en **`iniciar.bat`** (o `node server.js`).
3. Sigue la dirección que muestra la ventana negra. `localhost` solo sirve **en ese computador**. Para los celulares usa la dirección con tu IP (ejemplo `http://192.168.1.20:3000/`), en el mismo Wi-Fi. `compartir-internet.bat` da un link público temporal.
4. Los datos quedan en la carpeta `datos/`. En este modo el panel no pide clave.

## Dónde se guardan los datos
**Con Supabase:** en tu proyecto de Supabase (tablas `inscritos`, `estado` y `ajustes`). **Con el programa local:** en la carpeta **`datos/`**:
- `inscritos.json`: la lista de inscritos (la base de datos). Se guarda una copia de seguridad `.bak` en cada cambio.
- `estado.json`: parejas de dominó, llaves, ajedrez y bingo del panel.

Desde el panel, en **Inscritos**, puedes **descargar la lista en Excel/CSV**, **quitar** a una persona (✕), **Borrar registros** (botón rojo con ícono de basura; borra todos los inscritos) o **Borrar todo** (inscritos, equipos y resultados). Los dos piden una confirmación Sí/No. Úsalos al terminar las pruebas.

## Reglas de inscripción
- Una **cédula** no se repite en el mismo juego.
- **Ajedrez y Dominó son excluyentes**: una persona solo puede estar en uno de los dos.
- El **Bingo se puede sumar** (una vez) aunque la persona ya esté en otro juego.
- El registro es solo: **nombre y apellido, ficha (lista), cédula y juego**. La ficha se elige de una lista (`js/config.js`) y puede repetirse.

## Panel del organizador
- **Inscritos:** quién se registró en cada juego (con buscador).
- **Equipos (dominó):** los creas tú en el panel: **1)** tocas a los **dos jugadores** de la lista de inscritos en Dominó, **2)** escribes el **nombre del equipo** (obligatorio, para identificarlo) y pulsas **Crear equipo**. Puedes cambiar el nombre (**✎**) o **deshacer** un equipo (**✂**). Los jugadores que ya están en un equipo salen de la lista.
- **Ajedrez:** sistema suizo. Eliges las rondas, el programa empareja y tú marcas cada resultado (1-0, ½, 0-1). Victoria 1, tablas ½, descanso 1. Desempate Buchholz.
- **Bingo:** escribes cuántos **cartones** hay. Cada ronda juegan tantos jugadores como cartones: primero los que solo se inscribieron en Bingo (por orden de registro), luego los que ya estaban en otro juego, y al final los que agregues a mano.
- **Llaves (dominó):** eliminación directa con los equipos creados. Toca un equipo para marcarlo ganador.

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
`js/datos.js` (conexión a la base de datos) · `supabase/instalar.sql` (crea la base de datos en Supabase) · `server.js` (el programa y la base de datos) · `index.html` (registro) · `admin.html` (panel) · `js/config.js` (fichas) · `iniciar.bat` (arranque en Windows) · `compartir-internet.bat` (arranque con link público) · `package.json`

> Mientras `js/config.js` no tenga los datos de Supabase (y no haya programa local), las páginas funcionan en *modo de prueba*: guardan solo en el navegador y no comparten datos.
