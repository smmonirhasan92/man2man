
$dist = "dist"
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $dist | Out-Null

Write-Host "Copying Backend..."
# Exclude heavy valid dirs
robocopy "backend" "$dist\backend" /E /XD node_modules logs .git tmp backup_modules

Write-Host "Copying Frontend..."
# Exclude node_modules and build artifacts (since we instruct to build on server)
robocopy "frontend" "$dist\frontend" /E /XD node_modules .next .git tmp

Write-Host "Copying Docs..."
Copy-Item "DEPLOY_README.md" "$dist\README.md"

Write-Host "Creating .env.example..."
Set-Content -Path "$dist\backend\.env.example" -Value "PORT=5050`nMONGODB_URI=mongodb://127.0.0.1:27017/universal_game_core_v1`nJWT_SECRET=CHANGE_THIS_SECRET`nNODE_ENV=production"

Write-Host "Zipping..."
Compress-Archive -Path "$dist\*" -DestinationPath "USA_Affiliate_Lottery_Ready.zip" -Force

Write-Host "DONE: USA_Affiliate_Lottery_Ready.zip created."
