@echo off
title Lika CRM
cd /d "%~dp0"

echo ========================================================
echo        LIKA CRM - GESTION COMMERCIALE ET FACTURATION
echo ========================================================
echo.

rem 1. Si Lika CRM repond deja sur le port 3001, ouvrir le navigateur et quitter
set HTTP_STATUS=000
for /f %%c in ('curl.exe -s -o NUL -w "%%{http_code}" http://localhost:3001 2^>nul') do set HTTP_STATUS=%%c
if "%HTTP_STATUS%"=="200" (
    echo [OK] Lika CRM est deja en cours d'execution !
    echo [INFO] Ouverture de votre navigateur sur http://localhost:3001 ...
    start http://localhost:3001
    exit /b 0
)

rem 2. Si le port 3001 est bloque par un processus qui ne repond pas, le liberer
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Demarrage du serveur Lika CRM sur http://localhost:3001 ...
echo [INFO] Votre navigateur va s'ouvrir automatiquement.
echo.
echo ========================================================
echo  NE FERMEZ PAS CETTE FENETRE PENDANT L'UTILISATION
echo ========================================================
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:3001'"

node server/index.js
pause
