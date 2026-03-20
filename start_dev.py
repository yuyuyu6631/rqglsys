from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = ROOT_DIR / ".venv312" / "Scripts" / "python.exe"
DEFAULT_BACKEND_PORT = 5010
DEFAULT_FRONTEND_PORT = 5173
CHECK_ONLY = "--check-only" in sys.argv


def print_step(message: str) -> None:
    print(f"[INFO] {message}")


def print_success(message: str) -> None:
    print(f"[OK] {message}")


def print_error(message: str) -> None:
    print(f"[ERROR] {message}")


def resolve_python() -> str:
    if VENV_PYTHON.exists():
        return str(VENV_PYTHON)
    if sys.executable:
        return sys.executable
    launcher = shutil.which("py")
    if launcher:
        return launcher
    python = shutil.which("python")
    if python:
        return python
    raise RuntimeError("未找到可用的 Python 解释器")


def run_command(
    cmd: list[str],
    cwd: Path | None = None,
    check: bool = True,
    capture_output: bool = False,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        check=check,
        text=True,
        encoding="utf-8",
        errors="ignore",
        capture_output=capture_output,
    )


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def ensure_frontend_dependencies() -> None:
    if (FRONTEND_DIR / "node_modules").exists():
        print_success("检测到前端依赖已存在")
        return

    if not command_exists("npm.cmd") and not command_exists("npm"):
        raise RuntimeError("未检测到 npm，无法安装前端依赖")

    print_step("未检测到 frontend/node_modules，正在安装前端依赖...")
    run_command([shutil.which("npm.cmd") or shutil.which("npm") or "npm", "install"], cwd=FRONTEND_DIR)
    print_success("前端依赖安装完成")


def ensure_backend_dependencies(python_executable: str) -> None:
    try:
        run_command(
            [python_executable, "-c", "import flask, flask_sqlalchemy, flask_cors"],
            cwd=ROOT_DIR,
            capture_output=True,
        )
        print_success("后端依赖检查通过")
    except subprocess.CalledProcessError:
        raise RuntimeError(
            "后端 Python 依赖未安装，请先执行: "
            f'"{python_executable}" -m pip install -r backend\\requirements-dev.txt'
        )


def ensure_database_initialized(python_executable: str) -> None:
    print_step("检查数据库初始化状态...")
    result = run_command(
        [python_executable, "check_init_needed.py"],
        cwd=BACKEND_DIR,
        check=False,
    )

    if result.returncode == 0:
        print_success("数据库已有数据，跳过初始化")
        return

    print_step("检测到数据库为空或不存在，正在初始化测试数据...")
    run_command([python_executable, "seed_realistic_data.py"], cwd=BACKEND_DIR)
    print_success("数据库初始化完成")


def is_port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.2):
            return True
    except (OSError, TimeoutError):
        return False


def find_available_port(start_port: int, excluded_ports: set[int] | None = None) -> int:
    excluded_ports = excluded_ports or set()
    port = start_port
    while port in excluded_ports or is_port_open(port):
        port += 1
    return port


def wait_for_backend(port: int, timeout_seconds: int = 25) -> bool:
    health_url = f"http://127.0.0.1:{port}/api/health"
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=1.5) as response:
                if response.status == 200:
                    return True
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(1)
    return False


def start_in_new_terminal(
    title: str,
    command: list[str],
    cwd: Path,
    extra_env: dict[str, str] | None = None,
) -> subprocess.Popen[bytes]:
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)

    return subprocess.Popen(
        command,
        cwd=str(cwd),
        env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE,
    )


def main() -> int:
    os.chdir(ROOT_DIR)
    print("=" * 58)
    print(" 燃气管理系统 - Python 本地启动脚本")
    print("=" * 58)

    try:
        python_executable = resolve_python()
        print_step(f"使用 Python: {python_executable}")

        ensure_backend_dependencies(python_executable)
        ensure_frontend_dependencies()
        ensure_database_initialized(python_executable)

        backend_port = find_available_port(DEFAULT_BACKEND_PORT)
        frontend_port = find_available_port(DEFAULT_FRONTEND_PORT, excluded_ports={backend_port})

        if backend_port != DEFAULT_BACKEND_PORT:
            print_step(f"后端默认端口 {DEFAULT_BACKEND_PORT} 已占用，自动切换到 {backend_port}")
        else:
            print_success(f"后端将使用默认端口 {backend_port}")

        if frontend_port != DEFAULT_FRONTEND_PORT:
            print_step(f"前端默认端口 {DEFAULT_FRONTEND_PORT} 已占用，自动切换到 {frontend_port}")
        else:
            print_success(f"前端将使用默认端口 {frontend_port}")

        if CHECK_ONLY:
            print_success("启动前检查已完成，环境可正常启动")
            return 0

        print_step("启动后端服务...")
        start_in_new_terminal(
            "燃气管理系统 - 后端",
            [python_executable, "run.py"],
            BACKEND_DIR,
            {"PORT": str(backend_port)},
        )

        print_step("等待后端健康检查通过...")
        if not wait_for_backend(backend_port):
            raise RuntimeError("后端启动超时，请检查后端窗口日志")
        print_success("后端服务已就绪")

        npm_executable = shutil.which("npm.cmd") or shutil.which("npm")
        if not npm_executable:
            raise RuntimeError("未检测到 npm，无法启动前端")

        print_step("启动前端服务...")
        start_in_new_terminal(
            "燃气管理系统 - 前端",
            [npm_executable, "run", "dev", "--", "--host", "127.0.0.1", "--port", str(frontend_port)],
            FRONTEND_DIR,
            {
                "PORT": str(frontend_port),
                "BACKEND_PORT": str(backend_port),
                "VITE_ENABLE_QUICK_LOGIN": "true",
            },
        )
        print_success("前端启动命令已发送")

        print()
        print("=" * 58)
        print(" 服务启动完成")
        print("=" * 58)
        print(f"前端地址: http://127.0.0.1:{frontend_port}")
        print(f"后端地址: http://127.0.0.1:{backend_port}")
        print("管理员账号: admin / 123456")
        return 0
    except KeyboardInterrupt:
        print_error("已取消启动")
        return 130
    except Exception as exc:
        print_error(str(exc))
        return 1


if __name__ == "__main__":
    sys.exit(main())
