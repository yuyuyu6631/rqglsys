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

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装,请先安装 Docker Compose"
    exit 1
fi

echo "✓ Docker 环境检查通过"
echo ""

# 停止并删除旧容器
echo "1. 停止并删除旧容器..."
docker-compose down
echo ""

# 构建并启动服务
echo "2. 构建并启动服务..."
docker-compose up -d --build
echo ""

# 等待后端服务启动
echo "3. 等待后端服务启动..."
sleep 10
echo ""

# 初始化数据库
echo "4. 初始化数据库..."
docker exec -it gas-backend python app/seed.py
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
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
