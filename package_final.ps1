
$src = "d:\man2man"
$staging = "d:\man2man\FINAL_STAGING"
$zip = "d:\man2man\FINAL_CLEAN_BUNDLE.zip"

# Cleanup previous
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $zip) { Remove-Item $zip -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $staging | Out-Null

Write-Host "--- MIRRORING BACKEND (No node_modules) ---"
robocopy "$src\backend" "$staging\backend" /E /XD node_modules logs .git tmp backup_modules .vscode /XF *.log *.txt .env

Write-Host "--- MIRRORING FRONTEND (No node_modules) ---"
robocopy "$src\frontend" "$staging\frontend" /E /XD node_modules .next .git tmp .vscode /XF *.log *.txt .env.local

Write-Host "--- COPYING DOCS ---"
Copy-Item "$src\DEPLOY_README.md" "$staging\README.md"

Write-Host "--- ZIPPING CLEAN BUNDLE ---"
Compress-Archive -Path "$staging\*" -DestinationPath $zip -Force

Write-Host "--- REMOVING STAGING ---"
Remove-Item $staging -Recurse -Force

Write-Host "DONE: $zip"
