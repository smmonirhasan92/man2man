$ErrorActionPreference = "Stop"

# 1. Database Dump (Node.js Fallback)
Write-Host "Starting JSON Database Dump..."
$backupDir = "d:\man2man\DB_BACKUP"

if (Test-Path $backupDir) { Remove-Item -Recurse -Force $backupDir }
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Run Node Script
Push-Location "d:\man2man\backend"
node scripts/backup_db.js
if ($LASTEXITCODE -ne 0) { throw "Node DB Backup Failed!" }
Pop-Location

if (!(Test-Path "$backupDir\users.json")) {
    Write-Warning "DB Backup might be empty. Please check content."
}

# 2. File Preparation
Write-Host "Preparing Project Files..."
$sourceDir = "d:\man2man"
$tempDir = "d:\man2man\packaging_temp"
$zipPath = "d:\man2man\USA_Affiliate_Full_Package.zip"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Robocopy for speed and exclusion
# Exclude: node_modules, .git, .env, .next, dist, uploaded_media*, mongodb_data*, logs, packaging_temp, DB_BACKUP (we copy DB_BACKUP manually to ensure it's fresh)
$robocopyOptions = @("/E", "/XD", "node_modules", ".git", ".next", "dist", "mongodb_data_safe", "mongodb_data", "logs", "packaging_temp", "USA_Developer_Kit", "FINAL_STAGING", "uploads", ".vscode", "/XF", ".env", "*.zip", "*.7z", "*.rar", "*.db", "*.log")

# Run Robocopy (Exit code < 8 is success)
# Using cmd /c because PowerShell sometimes handles robocopy exit codes intrusively
cmd /c robocopy "$sourceDir" "$tempDir" $robocopyOptions
$roboExit = $LASTEXITCODE

if ($roboExit -ge 8) { 
    throw "Robocopy failed with critical exit code $roboExit" 
}
else {
    Write-Host "Robocopy finished with code $roboExit (Success)"
}

# Copy DB_BACKUP explicitly
Copy-Item -Recurse -Path $backupDir -Destination "$tempDir\DB_BACKUP"

# 3. Zip
Write-Host "Zipping Package..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# 4. Cleanup
Remove-Item -Recurse -Force $tempDir
# Remove-Item -Recurse -Force $backupDir # Optional: Keep backup for user to see

Write-Host "Packaging Complete! Zip created at: $zipPath"
