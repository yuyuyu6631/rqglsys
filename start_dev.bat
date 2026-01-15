@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================================
echo       燃气管理系统 - 本地启动脚本
echo ========================================================

echo.
echo [1/3] 正在检查数据库状态...
cd backend
python check_init_needed.py
if %errorlevel% equ 1 (
    echo [INFO] 检测到数据库为空或不存在，正在初始化测试数据...
    python seed_realistic_data.py
    if %errorlevel% neq 0 (
        echo [ERROR] 数据初始化失败！
        pause
        exit /b %errorlevel%
    )
    echo [SUCCESS] 数据初始化完成!
) else (
    echo [INFO] 检测到数据库已有数据，跳过初始化步骤。
)
cd ..

echo.
echo [2/3] 正在启动后端服务 (Flask)...
start "燃气管理系统 - 后端" cmd /k "cd backend && python run.py"

echo.
echo [3/3] 正在启动前端服务 (Vite)...
start "燃气管理系统 - 前端" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo       服务已启动! 请勿关闭弹出的命令行窗口
echo ========================================================
echo.
echo 前端访问地址: http://localhost:5173 (如果被占用则为 5174)
echo 后端API地址:  http://127.0.0.1:5010
echo 管理员账号:   admin / 123456
echo.
pause
