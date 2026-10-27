@echo off
chcp 65001 >nul
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" %*
set "rc=%ERRORLEVEL%"
echo.
if not "%rc%"=="0" (
  echo Fairy Mode install did not finish. Exit code: %rc%
) else (
  echo Fairy Mode install finished.
)
pause
exit /b %rc%
