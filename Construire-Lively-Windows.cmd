@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -File "%~dp0scripts\package-windows.ps1"
if errorlevel 1 (
  echo.
  echo La creation du paquet Lively a echoue.
  pause
  exit /b 1
)

echo.
echo Le paquet est disponible dans le dossier dist\windows.
pause
