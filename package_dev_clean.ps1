
$src = "d:\man2man"
$dest = "d:\man2man\USA_Developer_Kit"
$zip = "d:\man2man\USA_Developer_Kit.zip"

# Clean Start
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $dest | Out-Null

Write-Host "--- PREPARING BACKEND ---"
robocopy "$src\backend" "$dest\backend" /E /XD node_modules logs .git tmp backup_modules .vscode /XF *.log *.txt .env

Write-Host "--- PREPARING FRONTEND ---"
robocopy "$src\frontend" "$dest\frontend" /E /XD node_modules .next .git tmp .vscode /XF *.log *.txt .env.local

Write-Host "--- CREATING CONFIGS ---"
# .env.example
Set-Content -Path "$dest\backend\.env.example" -Value "PORT=5050`nMONGODB_URI=mongodb://127.0.0.1:27017/universal_game_core_v1`nJWT_SECRET=DEV_SECRET_KEY_123"

# README
$readme = @"
# USA Affiliate & Lottery - Developer Kit

## Quick Start

1. **Backend**
   - \`cd backend\`
   - \`npm install\`
   - \`cp .env.example .env\`
   - \`npm run dev\`

2. **Frontend**
   - \`cd frontend\`
   - \`npm install\`
   - \`npm run dev\`
   - Access at http://localhost:3000

## PWA Support
- Manifest: /frontend/public/manifest.json
- AssetLinks: /frontend/public/.well-known/assetlinks.json

## Database
- Ensure MongoDB is running on localhost:27017
"@
Set-Content -Path "$dest\README.md" -Value $readme

Write-Host "--- ZIPPING ---"
Compress-Archive -Path "$dest\*" -DestinationPath $zip -Force

Write-Host "--- CLEANUP ---"
Remove-Item $dest -Recurse -Force

Write-Host "SUCCESS: Developer Kit Ready ($zip)"
