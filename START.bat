@echo off
title Pickleball Scoreboard

echo ================================
echo   Pickleball Scoreboard
echo ================================

if not exist ".env" (
    echo [!] Khong tim thay .env, dang copy tu .env.example...
    copy .env.example .env
    echo [i] Hay chinh sua .env voi thong tin database cua ban.
)

if not exist "node_modules" (
    echo [!] Dang cai dat dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] Loi cai dat npm. Vui long kiem tra lai.
        pause
        exit /b 1
    )
)

echo [>] Dang khoi dong server...
call npm run dev

pause
