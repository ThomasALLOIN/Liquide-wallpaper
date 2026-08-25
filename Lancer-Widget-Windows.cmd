@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0Liquide-Wallpaper-Tray.ps1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Liquide-Wallpaper-Tray.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0platforms\windows\Liquide-Wallpaper-Tray.ps1"
)
