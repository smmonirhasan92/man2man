@echo off
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath d:\man2man\mongodb_data_safe --replSet rs0 --bind_ip 127.0.0.1 --port 27018
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo MONGODB FAILED TO START!
    echo It might be already running or the port 27018 is busy.
    echo Check for other mongod.exe processes.
)
pause
