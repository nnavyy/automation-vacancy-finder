@echo off
title HeadHunter Chrome Login Assistant — HH Job Copilot
color 0A

echo ============================================================
echo   HH Job Copilot — Local HeadHunter Login Assistant
echo ============================================================
echo.
echo Launching Google Chrome on your system...
echo.

where uv >nul 2>nul
if %ERRORLEVEL% equ 0 (
    uv run login_hh.py
) else (
    python login_hh.py
)

pause
