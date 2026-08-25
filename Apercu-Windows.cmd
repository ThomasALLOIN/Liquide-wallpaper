@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js 18 ou plus recent est requis pour l'apercu local.
  echo Le fond installe dans Lively ne necessite pas Node.js.
  pause
  exit /b 1
)

start "" "http://127.0.0.1:4173/?layout=auto&debug=1"
call npm run dev
