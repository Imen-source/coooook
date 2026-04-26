@echo off
:: ════════════════════════════════════════════════════════════
::  Cook's — K6 Test Runner (Windows)
::  Runs all performance test types in sequence.
::
::  Usage:
::    run-all.bat                              (default: localhost/cook)
::    run-all.bat http://localhost/cook        (explicit base URL)
::    run-all.bat "" smoke                     (run smoke only)
::    run-all.bat "" api-functional            (run functional test only)
::
::  Available test names:
::    smoke | api-functional | negative | e2e-journey
::    scenarios | load | stress | spike
::    (soak and breakpoint must be run manually — see below)
::
::  Requires k6 to be in PATH. Run install-k6.bat first.
:: ════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=http://localhost/cook

set TEST_FILTER=%~2

if not exist "results" mkdir results

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   Cook's K6 Complete Test Suite                         ║
echo  ║   Target : %BASE_URL%
echo  ║   Filter : %TEST_FILTER% (blank = all)
echo  ╚══════════════════════════════════════════════════════════╝
echo.

set PASS_COUNT=0
set FAIL_COUNT=0
set SKIP_COUNT=0

:: ─────────────────────────────────────────────────────────────
:: Helper: run a test and track pass/fail
::   %1 = short name (used as filter key and result file prefix)
::   %2 = js file
::   %3 = extra k6 flags (optional)
:: ─────────────────────────────────────────────────────────────
:run_test
set TEST_NAME=%~1
set TEST_FILE=%~2
set EXTRA=%~3

if not "%TEST_FILTER%"=="" if /I not "%TEST_FILTER%"=="%TEST_NAME%" (
    set /A SKIP_COUNT+=1
    goto :eof
)

echo  ── Running: %TEST_NAME% ─────────────────────────────────────
k6 run -e BASE_URL=%BASE_URL% --out json=results\%TEST_NAME%-result.json %EXTRA% %TEST_FILE%
if %errorlevel% == 0 (
    echo  [PASS] %TEST_NAME%
    set /A PASS_COUNT+=1
) else (
    echo  [FAIL] %TEST_NAME%
    set /A FAIL_COUNT+=1
)
echo.
goto :eof

:: ═════════════════════════════════════════════════════════════
::  TIER 1 — Correctness gates (run first; fast)
:: ═════════════════════════════════════════════════════════════
echo  ── TIER 1: Correctness ──────────────────────────────────────
echo.

:: Sanity-check: all endpoints alive
call :run_test smoke          smoke.js

:: Full functional coverage of every endpoint + body assertions
call :run_test api-functional api-functional.js

:: All error / negative cases
call :run_test negative       negative.js

:: Complete user journey (register → all features → logout)
call :run_test e2e-journey    e2e-journey.js

echo.
echo  ── TIER 2: Performance ──────────────────────────────────────
echo.

:: Multi-scenario (parallel user types) — realistic mixed traffic
call :run_test scenarios      scenarios.js

:: Normal production load
call :run_test load           load.js

:: Above-capacity stress to find degradation point
call :run_test stress         stress.js

:: Sudden spike + recovery
call :run_test spike          spike.js

:: ─────────────────────────────────────────────────────────────
:: Long-running tests (not included in automated run)
:: ─────────────────────────────────────────────────────────────
echo.
echo  ── Long-running tests (run manually) ────────────────────────
echo.
echo  Soak test (endurance / memory-leak detection):
echo    Full (2 h):
echo      k6 run -e BASE_URL=%BASE_URL% --out json=results\soak-result.json soak.js
echo    Quick (10 min):
echo      k6 run -e BASE_URL=%BASE_URL% -e SOAK_DURATION=10m -e SOAK_VUS=20 --out json=results\soak-result.json soak.js
echo.
echo  Breakpoint test (find exact failure VU count):
echo      k6 run -e BASE_URL=%BASE_URL% --out json=results\breakpoint-result.json breakpoint.js
echo.

:: ─────────────────────────────────────────────────────────────
:: Final summary
:: ─────────────────────────────────────────────────────────────
echo  ════════════════════════════════════════════════════════════
echo  RESULTS: %PASS_COUNT% passed / %FAIL_COUNT% failed / %SKIP_COUNT% skipped
echo  Results saved to: Cook-Testing\7-K6-Performance\results\
echo  ════════════════════════════════════════════════════════════
echo.

if %FAIL_COUNT% GTR 0 exit /b 1
exit /b 0
