@echo off
chcp 65001 >nul
echo ========================================================
echo   PUBLICATION SUR GITHUB : Lika CRM (bianzoumbefata-jpg)
echo ========================================================
echo.
echo Depot cible : https://github.com/bianzoumbefata-jpg/Lika-CRM.git
echo.
git branch -M main
git remote set-url origin https://github.com/bianzoumbefata-jpg/Lika-CRM.git
git push -u origin main
echo.
echo ========================================================
pause
