@echo off
chcp 65001 >nul
echo ========================================================
echo   PUBLICATION SUR GITHUB : LIKA CRM (bianzoumbefata-jpg)
echo ========================================================
echo.
echo Depot cible : https://github.com/bianzoumbefata-jpg/LIKA-CRM.git
echo.
git branch -M main
git remote set-url origin https://github.com/bianzoumbefata-jpg/LIKA-CRM.git
git push -u origin main
echo.
echo ========================================================
pause
