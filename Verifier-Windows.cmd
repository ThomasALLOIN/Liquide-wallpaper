@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js 18 ou plus recent est requis pour lancer les tests.
  pause
  exit /b 1
)

call npm test
if errorlevel 1 goto :failure

call npm run validate
if errorlevel 1 goto :failure

echo.
echo Validation Windows terminee avec succes.
pause
exit /b 0

:failure
echo.
echo La validation a echoue. Consultez les messages ci-dessus.
pause
exit /b 1
