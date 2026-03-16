@echo off
chcp 65001 >nul
title 🔐 POS License Generator
echo.
echo ══════════════════════════════════════════
echo   🔐  POS License Generator
echo ══════════════════════════════════════════
echo.

set /p NAME="  📝 Customer Name: "
echo.
set /p MACHINE="  🖥️  Machine ID: "
echo.
set /p MONTHS="  📅 Number of Months (0 = open forever): "
echo.
set /p DEVICES="  💻 Max Devices (Enter = 3): "

if "%DEVICES%"=="" set DEVICES=3

if "%MONTHS%"=="0" (
    set MONTHS=1200
    echo.
    echo   ♾️  Open License ^(100 years^)
)

echo.
echo ──────────────────────────────────────────
echo   Generating license...
echo ──────────────────────────────────────────
echo.

node generate-license.js -m "%MACHINE%" -n "%NAME%" --months %MONTHS% -d %DEVICES%

echo.
pause
