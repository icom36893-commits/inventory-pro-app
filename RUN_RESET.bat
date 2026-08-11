@echo off
echo ===========================================
echo    Resetting the System to Factory Default
echo ===========================================
cd /d "%~dp0"
call .\node_modules\.bin\electron.cmd reset_system.js
echo.
echo Press any key to close this window...
pause >nul
