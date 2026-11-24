@echo off
chcp 65001 >nul
title Torneo de Juegos
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b
)
set ABRIR_NAVEGADOR=1
node server.js
pause
