# 后端开发环境说明

## 推荐 Python 版本

使用 `Python 3.12`。

当前项目依赖在本机 `Python 3.14` 下会有兼容问题，建议统一使用项目根目录的虚拟环境 `.venv312`。

## 首次安装

在项目根目录执行：

```powershell
.venv312\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
```

## 启动后端

```powershell
cd backend
..\.venv312\Scripts\python.exe run.py
```

如果你直接在项目根目录执行，也可以：

```powershell
.venv312\Scripts\python.exe backend\run.py
```

## 运行测试

```powershell
.venv312\Scripts\python.exe -m pytest backend\tests\test_api.py -q
```

## 依赖说明

- `Flask`、`Flask-SQLAlchemy`、`Flask-CORS`、`Werkzeug`：后端运行必须有
- `pytest`：只有跑测试时才需要
- `gunicorn`：本地开发不是必须，部署时需要
