# 容器化部署指南

本项目已完成 Docker 容器化配置，特别针对低性能服务器进行了优化（资源占用低、启动快）。

## 1. 快速启动

在项目根目录下执行以下命令：

```bash
# 构建并后台启动所有服务
docker-compose up -d --build
```

启动后：
- **前端门户**: `http://服务器IP` (默认 80 端口)
- **后端接口**: `http://服务器IP:5010/api`

## 2. 优化特性 (适配低性能服务器)
- **镜像轻量化**: 采用 `python:slim` 与 `nginx:alpine` 极简镜像，减少磁盘占用。
- **并发控制**: 后端使用 `gunicorn` 配置 2 个工作线程，有效降低内存峰值。
- **静态资源优化**: 前端 Nginx 开启了 Gzip 压缩，提升网络传输效率。
- **持久化**: 数据库与上传文件通过 Docker Volume 挂载，防止容器重启丢失数据。

## 3. 数据初始化
如果您需要加载一套真实感极强的演示数据，可以在容器运行后执行以下命令：

```bash
docker exec -it gas-backend python seed_realistic_data.py
```

## 4. 默认账号 (种子数据提供)
- **管理员**: `admin` / `admin666`
- **普通用户**: `customer_demo` / `password123`
- **配送员**: `zhao_q` / `password123`
