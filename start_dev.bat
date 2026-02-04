@echo off
echo Starting USA Afiliat Development Environment...

:: 1. Start MongoDB
echo Launching MongoDB...
start "MongoDB" /D "d:\man2man" cmd /k "start_mongodb_rs.bat"

:: Wait a bit for DB to init
timeout /t 5 /nobreak >nul

:: 2. Start Backend
echo Launching Backend...
start "Backend Server" /D "d:\man2man\backend" cmd /k "npm run dev"

:: 3. Start Frontend
echo Launching Frontend...
start "Frontend App" /D "d:\man2man\frontend" cmd /k "npm run dev"

echo.
echo All services launched! 
echo Please check the 3 new windows.
echo.
pause
