@echo off
chcp 65001 >nul
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall.ps1" %*
set "rc=%ERRORLEVEL%"
echo.
pause
exit /b %rc%
