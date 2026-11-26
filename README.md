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

**Pasar a una persona de un juego a otro (solo el organizador):** en **Inscritos**, el botón **⇄** de cada persona abre las opciones de destino. Se aplican las mismas reglas del registro: no puede quedar dos veces en el mismo juego, y Ajedrez y Dominó no pueden juntarse (el Bingo sí se suma). Se conservan su nombre, ficha y cédula; al entrar al Bingo va al final de la fila. Si era de Dominó y tenía equipo, el equipo se deshace; si hay llaves de Ajedrez ya generadas, hay que regenerarlas. Con Supabase hay que ejecutar **una vez** `supabase/mover.sql` (SQL Editor > Run; no borra ni cambia a nadie).

**Bingo con premios:** escribes los **cartones** y los **premios** a entregar. Cada premio es una ronda y en cada ronda juegan tantas personas como cartones haya, así que el panel calcula las rondas, **cuántas personas pueden participar en total** (cartones × premios) y los cupos libres. Quien no alcanza cupo queda en *Sin cupo*.

**Quitar la clave (solo Sí/No al borrar):** en Supabase > SQL Editor ejecuta `supabase/sin-clave.sql`. Desde ese momento borrar y guardar solo piden confirmar. Ten en cuenta que entonces cualquiera que conozca la dirección de la base de datos (está en el código público) podría borrar inscritos o cambiar resultados. Para volver a proteger con clave, ejecuta de nuevo `supabase/instalar.sql`.

Supabase gratuito **pausa el proyecto tras 1 semana sin usarse**; se reactiva con un clic desde su página.

### B) Programa en tu computador (sin cuentas) — todos los dispositivos ven los mismos registros
Los registros se guardan en tu computador y los celulares entran por tu Wi-Fi. Todo lo que se registre desde cualquier celular lo ves en tu panel.
1. Instala **Node.js** (versión LTS) desde https://nodejs.org, una sola vez.
2. Descomprime el ZIP del proyecto y haz **doble clic en `iniciar.bat`** (o `node server.js`). Se abre una ventana negra (no la cierres) y el panel se abre solo.
3. Si Windows pregunta por el **Firewall**, pulsa **Permitir acceso** (redes privadas). Si no lo permites, los celulares no podrán entrar.
4. En el panel, arriba en **Inscritos**, aparece **"Link para los jugadores"** con un **código QR**. Pásales ese link (o que escaneen el QR con la cámara). **Deben estar conectados al mismo Wi-Fi que tu computador.**
5. Abre **tú** el panel en `http://localhost:3000/admin.html` (en el computador). **No uses `localhost` en el celular**: en el celular `localhost` es el propio celular.

Mientras el computador y la ventana negra estén abiertos, el registro funciona desde cualquier celular de la red. `compartir-internet.bat` da un link público temporal para jugadores fuera de tu Wi-Fi. Los datos quedan en la carpeta `datos/`. En este modo el panel no pide clave.

## Dónde se guardan los datos
**Con Supabase:** en tu proyecto de Supabase (tablas `inscritos`, `estado` y `ajustes`). **Con el programa local:** en la carpeta **`datos/`**:
- `inscritos.json`: la lista de inscritos (la base de datos). Se guarda una copia de seguridad `.bak` en cada cambio.
- `estado.json`: parejas de dominó, llaves, ajedrez y bingo del panel.

Desde el panel, en **Inscritos**: **filtras por juego con una lista desplegable** (por defecto *Todos los juegos*; también Ajedrez, Dominó o Bingo, con su conteo), **filtras por ficha con otra lista desplegable** (eliges la ficha y ves cuántos hay y quiénes son; en *Todas* salen agrupados por ficha); **descargas un Excel** (`inscritos-por-ficha.xlsx`) con la hoja *Por ficha* (todos, ordenados por ficha), una hoja por juego (Ajedrez, Dominó con su equipo, Bingo) y un *Resumen* con el conteo de cada ficha en cada juego. La primera hoja, **Por ficha**, es interactiva: al abrirla salen **todos** los inscritos, ordenados por ficha, y dos **listas desplegables** (celda B1 = ficha, celda B2 = juego) los van filtrando, solas o combinadas, con el conteo de cuántos se muestran. Las hojas de cada juego tienen **filtro** en el encabezado, con la **Ficha en la columna A**. También puedes **quitar** a una persona concreta (botón 🗑 al lado de cada nombre; solo se quita de ese juego), **Borrar registros** (todos los inscritos) o **Borrar todo** (inscritos, equipos y resultados); los tres piden una confirmación Sí/No. Los filtros por ficha también están en las pantallas de Ajedrez, Equipos (Dominó) y Bingo.

## Reglas de inscripción
- Una **cédula** no se repite en el mismo juego.
- **Ajedrez y Dominó son excluyentes**: una persona solo puede estar en uno de los dos.
- El **Bingo se puede sumar** (una vez) aunque la persona ya esté en otro juego.
- El registro es solo: **nombre y apellido, ficha (lista), cédula y juego**. La ficha se elige de una lista (`js/config.js`) y puede repetirse.

## Panel del organizador
- **Inscritos:** quién se registró en cada juego (con buscador).
- **Equipos (dominó):** los creas tú en el panel: **1)** tocas a los **dos jugadores** de la lista de inscritos en Dominó, **2)** escribes el **nombre del equipo** (obligatorio, para identificarlo) y pulsas **Crear equipo**. Puedes cambiar el nombre (**✎**) o **deshacer** un equipo (**✂**). Los jugadores que ya están en un equipo salen de la lista.
- **Ajedrez (eliminatoria individual):** igual que las llaves de Dominó, pero cada jugador va solo. Pulsas **Generar llaves** y los inscritos se acomodan al azar en el cuadro (si no son 4, 8, 16… algunos pasan directo). En cada partida tocas al **ganador**: quien pierde queda **eliminado** y el ganador pasa a la siguiente ronda, hasta el **campeón**. Si hay tablas, juegan un desempate y marcas al ganador. No se usan puntos.
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
