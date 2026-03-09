@echo off
chcp 65001 >nul
echo ============================================
echo 安装用户自定义技能
echo ============================================
echo.

REM 创建技能目录
echo [1/3] 创建技能目录结构...
mkdir "%USERPROFILE%\.openclaw\workspace\.learnings" 2>nul
mkdir "%USERPROFILE%\.openclaw\workspace\memory" 2>nul

REM 复制 desktop-control 脚本
echo [2/3] 复制 desktop-control 技能脚本...
if not exist "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts" (
    mkdir "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts"
)
x /y "C:\Users\Administrator\.openclaw\skills\desktop-control-win-1.0.1\scripts\*.ps1.txt" "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts\" 2>nul

REM 重命名文件
cd /d "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts"
for %%f in (*.ps1.txt) do (
    ren "%%f" "%%~nf.ps1"
)

REM 复制 qmd-search 技能（如果有）
echo [3/3] 复制其他技能文件...
if exist "C:\Users\Administrator\.openclaw\skills\qmd-search" (
    x /y /e "C:\Users\Administrator\.openclaw\skills\qmd-search\*" "%USERPROFILE%\.openclaw\workspace\skills\qmd-search\" 2>nul
)

if exist "C:\Users\Administrator\.openclaw\skills\self-improving-agent-1.0.11" (
    x /y /e "C:\Users\Administrator\.openclaw\skills\self-improving-agent-1.0.11\*" "%USERPROFILE%\.openclaw\workspace\skills\self-improvement\" 2>nul
)

echo.
echo ============================================
echo 技能安装完成！
echo ============================================
echo.
echo 已安装的技能:
echo   - desktop-control: 控制桌面应用、VSCode、窗口管理等
echo.
echo 技能目录位置:
echo   %USERPROFILE%\.openclaw\workspace\skills\
echo.
echo 使用方法:
echo   列出窗口: powershell -File "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts\app-control.ps1" -Action list-windows
echo   打开文件: powershell -File "%USERPROFILE%\.openclaw\workspace\skills\desktop-control\scripts\vscode-control.ps1" -Action open-file -Path "文件路径"
echo.
pause
