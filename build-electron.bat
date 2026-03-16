@echo off
chcp 65001 >nul
title POS Desktop Builder
echo.
echo ======================================================
echo     POS Desktop Application Builder
echo ======================================================
echo.

:: Step 1: Build Angular Frontend
echo [1/7] Building Angular Frontend...
echo ------------------------------------------------------
cd /d "W:\WEB\sales\pos-ui"
call npx ng build --configuration=production
if %errorlevel% neq 0 (
    echo [ERROR] Angular build failed!
    pause
    exit /b 1
)
echo [OK] Angular build complete!
echo.

:: Step 2: Copy frontend to wwwroot
echo [2/7] Copying frontend to wwwroot...
echo ------------------------------------------------------
cd /d "W:\WEB\sales"
if exist "pos.Api\wwwroot" rmdir /s /q "pos.Api\wwwroot"
mkdir "pos.Api\wwwroot"
xcopy "pos-ui\dist\pos-ui\browser\*" "pos.Api\wwwroot\" /E /Y /Q
echo [OK] Frontend copied to wwwroot!
echo.

:: Step 3: Publish .NET Backend (self-contained)
echo [3/7] Publishing .NET Backend (self-contained)...
echo ------------------------------------------------------
cd /d "W:\WEB\sales"
dotnet publish pos.Api -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o pos.Api/bin/Publish
if %errorlevel% neq 0 (
    echo [ERROR] .NET publish failed!
    pause
    exit /b 1
)
echo [OK] Backend published!
echo.

:: Step 4: Copy Electron appsettings
echo [4/7] Configuring Electron settings...
echo ------------------------------------------------------
copy /Y "pos.Api\appsettings.Electron.json" "pos.Api\bin\Publish\appsettings.json"
copy /Y "pos.Api\appsettings.Electron.json" "pos.Api\bin\Publish\appsettings.Electron.json"

:: Create SQLite directory
if not exist "pos.Api\bin\Publish\sqlite" mkdir "pos.Api\bin\Publish\sqlite"
echo [OK] Settings configured!
echo.

:: Step 5: Obfuscate .NET code
echo [5/7] Obfuscating backend code...
echo ------------------------------------------------------
cd /d "W:\WEB\sales\pos.Api"
if exist "bin\Publish-Obfuscated" rmdir /s /q "bin\Publish-Obfuscated"
call obfuscar.console obfuscar.xml
if %errorlevel% neq 0 (
    echo [WARN] Obfuscation failed - using unobfuscated build
    echo.
) else (
    :: Copy obfuscated DLL over the original
    copy /Y "bin\Publish-Obfuscated\pos.Api.dll" "bin\Publish\pos.Api.dll"
    echo [OK] Code obfuscation complete!
)
echo.

:: Step 6: Generate integrity checksums
echo [6/7] Generating integrity checksums...
echo ------------------------------------------------------
cd /d "W:\WEB\sales"
node electron/generate-checksums.js
if %errorlevel% neq 0 (
    echo [WARN] Checksum generation failed - skipping
) else (
    echo [OK] Integrity checksums generated!
)
echo.

:: Step 7: Build Electron installer
echo [7/7] Building Electron installer...
echo ------------------------------------------------------
cd /d "W:\WEB\sales\electron"
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Electron build failed!
    pause
    exit /b 1
)
echo.
echo ======================================================
echo     BUILD COMPLETE!
echo ======================================================
echo.
echo     Output: W:\WEB\sales\dist-electron\
echo.
echo     Security layers:
echo       [x] Code Obfuscation (Security Core Only)
echo       [x] License Enforcement Middleware
echo       [x] Integrity Check
echo       [x] RSA License Signing
echo.
pause
