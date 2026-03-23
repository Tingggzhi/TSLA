@echo off
REM --- TSLA 戰情中心：每日 GitHub 備份批處理檔 ---
title TSLA Daily Backup

REM 1. 進入專案目錄
cd /d d:\coding\TSLA

echo [Starting Backup] %date% %time%
echo 正在執行備份腳本...

REM 2. 執行備份與推送
node scripts/backup.js

IF %ERRORLEVEL% EQU 0 (
    echo [Success] 備份成功推送到 GitHub！
) ELSE (
    echo [Error] 備份過程發生錯誤，請檢查 Git 連線。
    pause
)

timeout /t 5
