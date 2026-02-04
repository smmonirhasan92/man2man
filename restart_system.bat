@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe

echo Starting Backend...
start cmd /k "cd backend && npm run dev"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo SYSTEM RESTART COMPLETE.
pause
