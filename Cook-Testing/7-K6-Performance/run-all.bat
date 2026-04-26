@echo off
:: ════════════════════════════════════════════════════════════
::  Cook's — K6 Test Runner (Windows)
::  Runs all performance test types in sequence.
::
::  Usage:
::    run-all.bat                        (default: localhost/cook)
::    run-all.bat http://localhost/cook  (explicit base URL)
::    run-all.bat "" smoke               (run smoke only)
::
::  Requires k6 to be in PATH. Run install-k6.bat first.
:: ════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=http://localhost/cook

set TEST_FILTER=%~2

if not exist "results" mkdir results

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Cook's K6 Performance Test Suite       ║
echo  ║   Target: %BASE_URL%
echo  ╚══════════════════════════════════════════╝
echo.

set PASS_COUNT=0
set FAIL_COUNT=0

:: ─────────────────────────────────────────────────────────────
:: Helper macro: run a test and track pass/fail
:: ─────────────────────────────────────────────────────────────
:run_test
set TEST_NAME=%~1
set TEST_FILE=%~2

if not "%TEST_FILTER%"=="" if /I not "%TEST_FILTER%"=="%TEST_NAME%" goto :eof

echo  ── Running: %TEST_NAME% ──────────────────────────────────
k6 run -e BASE_URL=%BASE_URL% --out json=results\%TEST_NAME%-result.json %TEST_FILE%
if %errorlevel% == 0 (
    echo  [PASS] %TEST_NAME%
    set /A PASS_COUNT+=1
) else (
    echo  [FAIL] %TEST_NAME%
    set /A FAIL_COUNT+=1
)
echo.
goto :eof

:: ─────────────────────────────────────────────────────────────
:: Run all tests
:: ─────────────────────────────────────────────────────────────
call :run_test smoke     smoke.js
call :run_test load      load.js
call :run_test stress    stress.js
call :run_test spike     spike.js

echo.
echo  ── Long-running tests (disabled by default) ─────────────
echo  To run soak test (2 h):
echo    k6 run -e BASE_URL=%BASE_URL% --out json=results\soak-result.json soak.js
echo.
echo  To run quick soak (10 min):
echo    k6 run -e BASE_URL=%BASE_URL% -e SOAK_DURATION=10m -e SOAK_VUS=20 --out json=results\soak-result.json soak.js
echo.
echo  To run breakpoint test:
echo    k6 run -e BASE_URL=%BASE_URL% --out json=results\breakpoint-result.json breakpoint.js
echo.

echo  ════════════════════════════════════════════
echo  RESULTS: %PASS_COUNT% passed, %FAIL_COUNT% failed
echo  Results saved to: Cook-Testing\7-K6-Performance\results\
echo  ════════════════════════════════════════════
echo.

if %FAIL_COUNT% GTR 0 exit /b 1
exit /b 0
