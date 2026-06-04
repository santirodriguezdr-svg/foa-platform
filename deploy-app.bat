@echo off
echo Subiendo cambios a Apps Script...
cd /d "%~dp0foa-app"
clasp push
echo.
echo Deployando nueva version...
clasp deploy --description "Deploy %date% %time%"
echo.
echo Listo! La app fue actualizada.
pause
