@echo off
setlocal enabledelayedexpansion
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
set /p MONTHS="  📅 Number of Months (0 = open forever, Enter = 12 Month): "
echo.
set /p DEVICES="  💻 Max Devices (Enter = 3): "

if "%DEVICES%"=="" set DEVICES=3

if "%MONTHS%"=="" set MONTHS=12

if "%MONTHS%"=="0" (
    set MONTHS=1200
    echo.
    echo   ♾️  Open License ^(100 years^)
)

echo.
echo   📦 Select Modules:
echo      [1] Sales (المبيعات)
echo      [2] Inventory (المخزون)
echo      [3] Purchases (المشتريات)
echo      [4] Finance (المالية)
echo      [5] Employees (شئون العاملين)
echo      [6] Reports (التقارير)
echo.
set /p MODULE_SELECTION="  📌 Enter numbers (e.g. 124) or leave blank for ALL: "

set "FEATURES="
if "%MODULE_SELECTION%"=="" (
    set "FEATURES=sales,inventory,purchases,finance,employees,reports"
) else (
    echo %MODULE_SELECTION%| find "1" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,sales"

    echo %MODULE_SELECTION%| find "2" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,inventory"

    echo %MODULE_SELECTION%| find "3" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,purchases"

    echo %MODULE_SELECTION%| find "4" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,finance"

    echo %MODULE_SELECTION%| find "5" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,employees"

    echo %MODULE_SELECTION%| find "6" >nul
    if not errorlevel 1 set "FEATURES=!FEATURES!,reports"
    
    :: Remove leading comma if present
    if "!FEATURES:~0,1!"=="," set "FEATURES=!FEATURES:~1!"
)

echo.
echo ──────────────────────────────────────────
echo   Generating license...
echo   Included Features: !FEATURES!
echo ──────────────────────────────────────────
echo.

node generate-license.js -m "%MACHINE%" -n "%NAME%" --months %MONTHS% -d %DEVICES% -f "!FEATURES!"

echo.
pause

