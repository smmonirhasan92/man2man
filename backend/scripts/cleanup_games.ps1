# PowerCleanup
Remove-Item 'd:\man2man\frontend\app\game\coin' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\diamond-deluxe' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\fruit-fiesta' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\gem-hunter' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\jungle-quest' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\mines' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\super-ace-royale' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\teen-patti' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\app\game\[theme]' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\frontend\components\games\MinesGame.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\controllers\minesController.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\controllers\teenPattiController.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\modules\game\LotterySystem.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\modules\game\MinesGameModel.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\modules\game\MinesService.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\modules\game\TeenPattiGameModel.js' -Force -ErrorAction SilentlyContinue
Remove-Item 'd:\man2man\backend\modules\game\TeenPattiService.js' -Force -ErrorAction SilentlyContinue
Write-Host 'Cleanup Complete'