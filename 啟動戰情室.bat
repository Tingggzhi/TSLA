@echo off
TITLE StockRadar v1.0 | 戰情室啟動專用
CHCP 65001 >nul
cls

echo ══════════════════════════════════════════
echo   🚀 StockRadar v1.0 | 全球資產戰情室
echo ══════════════════════════════════════════
echo.
echo [1/2] 正在啟動伺服器端 (Node.js Express)...
echo [2/2] 即將開啟瀏覽器查看戰情顯示牆...
echo.

:: 在背景啟動伺服器
start /b npm start

:: 等待 3 秒讓伺服器完全就緒
timeout /t 3 /nobreak >nul

:: 開啟預設瀏覽器到指定的 Port
start http://localhost:3001

echo.
echo ------------------------------------------
echo 戰情室已於背景運行中。
echo 如需關閉，請直接關閉此視窗。
echo ------------------------------------------
echo.
pause
