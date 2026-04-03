$ErrorActionPreference = "Stop"

$rootDir = "d:\man2man"
$pkgName = "LOTTERY_PRO_VERSION_1_M"
$pkgPath = "$rootDir\$pkgName"
$zipPath = "$rootDir\${pkgName}.zip"

Write-Host "--- STARTING PACKAGING: $pkgName ---"

# 1. Prepare Directory
if (Test-Path $pkgPath) { Remove-Item -Recurse -Force $pkgPath }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
New-Item -ItemType Directory -Force -Path "$pkgPath\assets\db_dump" | Out-Null

# 2. Copy Codebase (Robocopy)
Write-Host "Copying Source Code..."
# Exclusions: Node Modules, Git, Backup folders, Dist, Logs, packaging artifacts
$excludes = @("/XD", "node_modules", ".git", ".next", "dist", "mongodb_data_safe", "mongodb_data", "logs", "packaging_temp", "DB_BACKUP", "USA_Developer_Kit", "FINAL_STAGING", "uploads", ".vscode", "LOTTERY_PRO_*", "/XF", ".env", "*.zip", "*.7z", "*.log", "*.db")

cmd /c robocopy "$rootDir" "$pkgPath" /E @excludes
$roboExit = $LASTEXITCODE
if ($roboExit -ge 8) { throw "Robocopy failed ($roboExit)" }

# 3. Database Dump
Write-Host "Exporting Database..."
Push-Location "$rootDir\backend"
node scripts/backup_db.js "$pkgPath\assets\db_dump"
if ($LASTEXITCODE -ne 0) { throw "DB Backup Failed" }
Pop-Location

# 4. Copy Documentation & Cleaning
Copy-Item "$rootDir\HANDOVER_GUIDE.md" "$pkgPath\HANDOVER_GUIDE.md" -Force
Copy-Item "$rootDir\.env.example" "$pkgPath\.env.example" -Force

# 5. Zip
Write-Host "Zipping Package..."
Compress-Archive -Path "$pkgPath" -DestinationPath $zipPath -Force

# 6. Cleanup (Optional, keep for inspection?)
# Remove-Item -Recurse -Force $pkgPath 

Write-Host "SUCCESS! Package created at: $zipPath"
