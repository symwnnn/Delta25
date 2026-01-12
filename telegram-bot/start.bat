@echo off
echo Starting Delta25 Telegram Bot...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting bot...
npm start

pause