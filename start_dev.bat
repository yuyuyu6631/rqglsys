@echo off
chcp 65001 >nul
cd /d %~dp0

if exist ".venv312\Scripts\python.exe" (
    ".venv312\Scripts\python.exe" start_dev.py
) else (
    python start_dev.py
)

if errorlevel 1 (
    echo.
    echo 启动失败，请检查上面的错误信息。
    pause
)
