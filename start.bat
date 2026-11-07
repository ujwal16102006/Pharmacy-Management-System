@echo off
title Online Pharmacy Management System
echo ========================================================
echo   Starting Online Pharmacy Management System
echo ========================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Start Server
echo Starting Express Server on http://localhost:3000 ...
echo Press Ctrl+C in this window to stop the server.
echo.
node server.js
pause

