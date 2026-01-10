#!/bin/bash

echo "========================================="
echo "  燃气企业智能化运营管理系统 - 部署脚本"
echo "========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装,请先安装 Docker"
    exit 1
fi

# 获取 docker compose 命令
get_compose_command() {
    # 优先使用 docker compose (新版)
    if docker compose version &> /dev/null; then
        echo "docker compose"
    # 回退到 docker-compose (旧版)
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "❌ 错误: Docker Compose 未安装,请先安装 Docker Compose"
        exit 1
    fi
}

COMPOSE_CMD=$(get_compose_command)

echo "✓ Docker 环境检查通过"
echo "✓ 使用命令: $COMPOSE_CMD"
echo ""

# 停止并删除旧容器
echo "1. 停止并清理旧容器..."
$COMPOSE_CMD down 2>/dev/null || true
docker rm -f gas-backend gas-frontend 2>/dev/null || true
docker network prune -f 2>/dev/null || true
echo ""

# 构建并启动服务
echo "2. 构建并启动服务..."
$COMPOSE_CMD up -d --build
echo ""

# 等待后端服务启动
echo "3. 等待后端服务启动..."
sleep 10
echo ""

# 初始化数据库
echo "4. 初始化数据库..."
docker exec -it gas-backend python -m app.seed
echo ""

echo "========================================="
echo "  🎉 部署完成!"
echo "========================================="
echo ""
echo "访问地址:"
echo "  前端: http://localhost"
echo "  后端 API: http://localhost:5010/api"
echo ""
echo "默认账户:"
echo "  管理员: admin / 123456"
echo "  用户: user1 / 123456"
echo ""
echo "常用命令:"
echo "  查看日志: $COMPOSE_CMD logs -f"
echo "  停止服务: $COMPOSE_CMD down"
echo "  重启服务: $COMPOSE_CMD restart"
echo ""

