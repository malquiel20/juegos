@echo off
chcp 65001 >nul
title Torneo de Juegos - Compartir por internet
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b
)
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo Instalando cloudflared ^(una sola vez, es gratis^)...
  winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
  echo.
  echo Listo. CIERRA esta ventana y vuelve a abrir este archivo.
  pause
  exit /b
)
echo Abriendo el programa del torneo en otra ventana...
start "Programa del torneo" cmd /k "set SOLO_ESTE_EQUIPO=1&& node server.js"
timeout /t 4 /nobreak >nul
echo.
echo ============================================================
echo  Abajo aparece una direccion que termina en trycloudflare.com
echo  - REGISTRO ^(jugadores^):  esa direccion
echo  - PANEL ^(solo tu^):        http://localhost:3000/admin.html
echo  No cierres esta ventana ni la otra mientras haya registros.
echo ============================================================
echo.
cloudflared tunnel --url http://localhost:3000
pause
