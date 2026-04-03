@echo off
echo [1/3] Building and Starting Local Production Simulator (3010/5010)...
docker-compose -f docker-compose.local-prod.yml up -d --build

echo [2/3] Waiting for MongoDB to ready...
timeout /t 10 /nobreak > nul

echo [3/3] Initializing MongoDB Replica Set (rs0)...
docker exec m2m-backend-prod-test node scripts/util/init_replica.js

echo.
echo ==========================================
echo ✅ SETUP COMPLETE!
echo - Frontend: http://localhost:3010
echo - Backend Health: http://localhost:5010/health
echo - Feature Test: http://localhost:3010/dashboard
echo ==========================================
pause
