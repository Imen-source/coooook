@echo off
:: ════════════════════════════════════════════════════════════
::  Cook's — K6 Installer for Windows
::  Tries winget first, then Chocolatey, then manual download
:: ════════════════════════════════════════════════════════════

echo.
echo  Installing K6 Performance Testing Tool
echo  ========================================
echo.

:: ── Try winget (Windows 11 / 10 built-in) ────────────────────────────────────
where winget >nul 2>&1
if %errorlevel% == 0 (
    echo  [1/3] Found winget. Installing k6...
    winget install k6 --source winget --silent
    if %errorlevel% == 0 (
        echo  k6 installed via winget.
        goto :verify
    )
)

:: ── Try Chocolatey ────────────────────────────────────────────────────────────
where choco >nul 2>&1
if %errorlevel% == 0 (
    echo  [2/3] Found Chocolatey. Installing k6...
    choco install k6 -y
    if %errorlevel% == 0 (
        echo  k6 installed via Chocolatey.
        goto :verify
    )
)

:: ── Manual download fallback ──────────────────────────────────────────────────
echo  [3/3] Downloading k6 manually from GitHub releases...
echo.

set K6_VERSION=v0.54.0
set K6_ZIP=k6-%K6_VERSION%-windows-amd64.zip
set K6_URL=https://github.com/grafana/k6/releases/download/%K6_VERSION%/%K6_ZIP%
set INSTALL_DIR=%USERPROFILE%\k6

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

powershell -Command "Invoke-WebRequest -Uri '%K6_URL%' -OutFile '%TEMP%\%K6_ZIP%'"
powershell -Command "Expand-Archive -Path '%TEMP%\%K6_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"

:: Add to PATH for this session
set PATH=%PATH%;%INSTALL_DIR%\k6-%K6_VERSION%-windows-amd64

echo.
echo  k6 extracted to %INSTALL_DIR%
echo  Add this to your system PATH to use k6 from any directory:
echo    %INSTALL_DIR%\k6-%K6_VERSION%-windows-amd64
echo.

:verify
echo.
echo  ── Verifying installation ──────────────────────────────
k6 version
if %errorlevel% == 0 (
    echo.
    echo  k6 is ready! Run your first test:
    echo    cd Cook-Testing\7-K6-Performance
    echo    k6 run smoke.js
) else (
    echo  WARNING: k6 not found in PATH. Restart your terminal or add it manually.
)
echo.
pause
