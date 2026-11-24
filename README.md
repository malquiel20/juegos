# Torneo de Juegos

Dos enlaces, **los mismos datos** (la hoja de respuestas de tu Google Form):

- **Registro (jugadores):** `https://malquiel20.github.io/juegos/`
- **Panel de juegos (organizador):** `https://malquiel20.github.io/juegos/admin.html`

Para activar los enlaces: en GitHub, **Settings > Pages > Build and deployment > Source: Deploy from a branch > main / (root) > Save**.

Son **dos archivos separados**, para que los jugadores solo vean el registro:

| Archivo | Quién lo usa | Qué tiene |
|---|---|---|
| `index.html` | **Jugadores** (este es el único que compartes) | Solo el formulario de registro. |
| `admin.html` | **Solo el organizador** (no compartas su enlace) | Inscritos, equipos de dominó, clasificación de ajedrez y llaves de dominó. |

## Registro (index.html)
Nombre y apellido, ficha (lista), cédula y juego (lista). Si el juego es **Dominó**, aparece además la **cédula del compañero**: los participantes arman sus parejas como quieran.
- La única validación es la **cédula**: no puede repetirse en ningún juego. La ficha se elige de una lista (`FICHAS` en `CONFIG`) y puede repetirse.

## Equipos de dominó (admin.html > Equipos)
Una pareja queda confirmada cuando **los dos se escriben mutuamente** (A pone la cédula de B y B pone la de A). Los que no coinciden aparecen como *Pendientes* con el motivo, y puedes **unirlos a mano**.

## Clasificación de ajedrez (admin.html > Ajedrez)
Sistema suizo: eliges el número de rondas, el programa empareja a los que van con puntos parecidos (sin repetir rivales mientras se pueda) y tú marcas cada resultado (1-0, ½, 0-1). Victoria 1 punto, tablas ½, descanso (si son impares) 1 punto. Empates se desempatan con Buchholz. Al terminar las rondas muestra al campeón.

## Llaves de dominó (admin.html > Llaves)
Eliminación directa con las parejas confirmadas. Toca una pareja para marcarla ganadora.

## Conectar con Google
1. Crea el Form con **5 preguntas de respuesta corta, en este orden**: *Nombre y apellido*, *Número de ficha*, *Número de cédula*, *Juego*, *Cédula del compañero (dominó)* (esta última no obligatoria).
2. Menú ⋮ > **Obtener enlace rellenado previamente**, llena cada campo con un texto de prueba y **Obtener enlace**. En la URL verás `entry.123456=...` para cada pregunta.
3. En `index.html`, bloque `CONFIG`: cambia `FORM_URL` (link del Form terminado en `/formResponse`) y los 5 `entry.XXXX`.
4. (Opcional, recomendado) Para bloquear cédulas repetidas desde cualquier celular: pega `Code.gs` en la hoja de respuestas (Extensiones > Apps Script), publícalo como aplicación web y pon su URL en `CHECK_URL`.
5. Para que `admin.html` vea a los inscritos: en la hoja de respuestas, Archivo > Compartir > **Publicar en la web** > CSV. Abre `admin.html`, pulsa **🔗 Conectar hoja de inscritos** y pega ese enlace. Queda guardado solo en tu dispositivo (no en GitHub).

## Datos compartidos y seguridad
- **Inscripciones:** el registro las manda al Google Form; el panel las lee de esa misma hoja. Son los mismos datos en los dos enlaces.
- **Equipos, llaves y resultados de ajedrez** se guardan solo en el navegador del organizador. Úsalos siempre desde el mismo dispositivo; si borras los datos del navegador se pierden.
- El enlace del panel es público en GitHub Pages, pero **sin el enlace de la hoja no muestra inscritos**, y cualquier cosa que alguien cambie ahí solo afecta a su propio navegador, nunca a tus resultados. No compartas el enlace de la hoja ni el del panel.
- El Google Form es público por naturaleza (alguien podría enviarle datos por fuera de la página); por eso se revisa la cédula con `Code.gs`.
