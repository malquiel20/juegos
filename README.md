# Torneo de Juegos

Dos enlaces que usan **la misma lista interna** (una hoja de cálculo tuya, sin Google Form):

- **Registro (jugadores):** `https://malquiel20.github.io/juegos/`
- **Panel de juegos (organizador):** `https://malquiel20.github.io/juegos/admin.html`

| Archivo | Para quién | Qué hace |
|---|---|---|
| `index.html` | Jugadores | Solo el formulario: nombre y apellido, ficha (lista), cédula y juego (lista). Si eliges Dominó pide además la cédula de tu compañero. |
| `admin.html` | Organizador | Inscritos por juego, equipos de dominó, clasificación de ajedrez y llaves de dominó. |
| `Code.gs` | Se pega una vez en tu hoja | Guarda las inscripciones y evita que una cédula se repita en cualquier juego. |

## Crear la lista (una sola vez, 3 minutos)
1. Abre https://sheets.new (crea una hoja de cálculo nueva) y ponle un nombre, por ejemplo *Torneo*.
2. Menú **Extensiones > Apps Script**. Borra lo que aparezca y pega todo el contenido de `Code.gs`.
3. En la primera línea de código cambia `cambia-esta-clave` por **una clave tuya** (solo la usarás tú en el panel). Pulsa el ícono de guardar.
4. Arriba a la derecha: **Implementar > Nueva implementación**. En el engranaje elige **Aplicación web**. Pon *Ejecutar como*: **Yo** y *Quién tiene acceso*: **Cualquier persona**. Pulsa **Implementar** y autoriza los permisos (si aparece "aplicación no verificada": *Avanzado > Ir a… > Permitir*).
5. Copia la **URL de la aplicación web** (termina en `/exec`).
6. **Registro:** en `index.html`, cambia `API_URL` por esa URL (edítalo en GitHub con el ícono del lápiz y guarda con *Commit changes*).
7. **Panel:** abre `admin.html`, pulsa **🔗 Conectar con la lista**, pega la URL y escribe tu clave.

Si más adelante cambias `Code.gs`, hay que publicar de nuevo: **Implementar > Administrar implementaciones > editar (lápiz) > Versión: Nueva > Implementar**.

## Cómo funciona
- **Una cédula, un solo registro:** la lista rechaza la cédula si ya está en cualquier juego. Es lo único que se valida; la ficha puede repetirse.
- **Equipos de dominó:** los arman los participantes. Una pareja queda confirmada cuando los dos se escriben mutuamente (A pone la cédula de B y B la de A). Los demás aparecen como *Pendientes* y puedes unirlos a mano.
- **Ajedrez:** sistema suizo. Eliges las rondas, el programa empareja a los que van con puntos parecidos y tú marcas cada resultado (1-0, ½, 0-1). Victoria 1, tablas ½, descanso 1. Desempate por Buchholz.
- **Llaves de dominó:** eliminación directa con las parejas confirmadas. Toca una pareja para marcarla ganadora.

## Seguridad y datos
- Los jugadores solo ven el registro. Para leer la lista hace falta **tu clave**: sin ella el panel no muestra nada, aunque alguien conozca el enlace.
- El enlace de la lista y la clave se guardan solo en el navegador donde usas el panel (no están en GitHub).
- Equipos, llaves y resultados de ajedrez se guardan en el navegador del organizador. Usa siempre el mismo dispositivo; si borras los datos del navegador se pierden esos resultados (los inscritos no, están en tu hoja).
- Todos los inscritos quedan en tu hoja de cálculo (pestaña *Inscritos*): puedes verlos, ordenarlos o descargarlos cuando quieras.
