@echo off
title OpenFlex CRM - Demarrage du Serveur
echo ===================================================
echo     OpenFlex CRM - Gestion Commerciale & Ventes
echo ===================================================
echo Demarrage du serveur sur http://localhost:3001 ...
echo.

start http://localhost:3001
node server/index.js
pause
