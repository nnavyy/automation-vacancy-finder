@echo off
echo ===================================================
echo Nanda AI Job Assistant - Automated Setup
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js v18 or newer.
    echo Download from: https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Installing dependencies with npm...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b
)
echo.

echo [2/3] Setting up environment variables...
if not exist .env.local (
    if exist .env.example (
        copy .env.example .env.local
        echo Created .env.local file. Please fill in your API keys later.
    ) else (
        echo Warning: .env.example not found. You will need to create .env.local manually.
    )
) else (
    echo .env.local already exists. Skipping...
)
echo.

echo [3/3] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Warning: Failed to generate Prisma client. Make sure your database URL is set correctly in .env.local later.
)
echo.

echo ===================================================
echo Setup complete! 
echo ===================================================
echo Next steps:
echo 1. Open .env.local and fill in your API keys (Groq, NeonDB, Telegram).
echo 2. Run "npm run db:push" to setup the database.
echo 3. Run "npm run dev" to start the application.
echo.
pause
