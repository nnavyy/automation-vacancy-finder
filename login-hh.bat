@echo off
echo ===================================================
echo HeadHunter (hh.ru) Automated Browser Login
echo ===================================================
echo.
echo Launching automated browser login...
echo A browser window will open. Please log in to your hh.ru account.
echo.

call npx tsx scripts/login-hh.ts

echo.
echo ===================================================
pause
