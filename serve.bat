@echo off
title Codivium Local Server
color 0A
echo.
echo  ==========================================
echo   Codivium Local Server
echo  ==========================================
echo.
echo  Starting...
echo.
echo  Once you see the URL below, open it in Chrome.
echo  Press Ctrl+C to stop.
echo.
echo  ------------------------------------------
echo.
node start-server.cjs
echo.
echo  Server stopped.
pause
