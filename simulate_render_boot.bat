@echo off
echo [SIMULATION] Starting Render-like Boot Sequence...

cd backend
echo [STEP 1] Installing Dependencies (Simulated build)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] npm install failed
    exit /b 1
)

echo [STEP 2] Setting Environment Variables...
set PORT=10000
set MONGODB_URI=YOUR_MONGO_URI_HERE
set NODE_ENV=production

echo [STEP 3] Starting Server...
node server.js
