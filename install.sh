#!/bin/bash

#####################################################################
#  燃气企业智能化运营管理系统 - 云服务器一键部署脚本
#  适用于: Ubuntu 18.04+, Debian 10+, CentOS 7+
#####################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "========================================="
    echo "  $1"
    echo "========================================="
    echo ""
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "无法检测操作系统"
        exit 1
    fi
    print_info "检测到操作系统: $OS $VER"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_warning "建议使用 root 权限运行此脚本"
        print_info "请使用: sudo bash install.sh"
        read -p "是否继续以当前用户运行? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装: $(docker --version)"
        return 0
    fi

    print_info "开始安装 Docker..."
    
    case $OS in
        ubuntu|debian)
            # 更新包索引
            apt-get update
            
            # 安装依赖
            apt-get install -y \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # 添加 Docker 官方 GPG key
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            # 设置仓库
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
                $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # 安装 Docker Engine
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        centos|rhel)
            # 安装依赖
            yum install -y yum-utils
            
            # 添加 Docker 仓库
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # 安装 Docker Engine
            yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
            # 启动 Docker
            systemctl start docker
            systemctl enable docker
            ;;
            
        *)
            print_error "不支持的操作系统: $OS"
            print_info "请手动安装 Docker: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac
    
    print_success "Docker 安装完成"
}

# 安装 Docker Compose (如果需要)
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose 已安装: $(docker-compose --version)"
        return 0
    fi

    # 检查是否有 docker compose 插件
    if docker compose version &> /dev/null; then
        print_success "Docker Compose 插件已安装"
        # 创建软链接以便使用 docker-compose 命令
        ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
        return 0
    fi

    print_info "开始安装 Docker Compose..."
    
    # 下载最新版本
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose 安装完成"
}

# 获取 docker compose 命令
get_compose_command() {
    # 优先使用 docker compose (新版)
    if docker compose version &> /dev/null; then
        echo "docker compose"
    # 回退到 docker-compose (旧版)
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        print_error "Docker Compose 未安装"
        exit 1
    fi
}

# 安装 Git
install_git() {
    if command -v git &> /dev/null; then
        print_success "Git 已安装: $(git --version)"
        return 0
    fi

    print_info "开始安装 Git..."
    
    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y git
            ;;
        centos|rhel)
            yum install -y git
            ;;
    esac
    
    print_success "Git 安装完成"
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙规则..."
    
    # 检查是否有 firewalld
    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
        firewall-cmd --permanent --add-port=5010/tcp 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
        print_success "防火墙规则已配置 (firewalld)"
    # 检查是否有 ufw
    elif command -v ufw &> /dev/null; then
        ufw allow 80/tcp 2>/dev/null || true
        ufw allow 5010/tcp 2>/dev/null || true
        print_success "防火墙规则已配置 (ufw)"
    else
        print_warning "未检测到防火墙,请手动开放端口 80 和 5010"
    fi
}

# 克隆项目
clone_project() {
    PROJECT_DIR="/opt/gas-system"
    
    # 检查是否存在项目目录
    if [ -d "$PROJECT_DIR" ]; then
        # 检查是否是有效的 git 仓库
        if [ -d "$PROJECT_DIR/.git" ]; then
            cd "$PROJECT_DIR"
            
            # 检查远程仓库地址
            REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")
            if [[ "$REMOTE_URL" == *"yuyuyu6631/rqglsys"* ]]; then
                print_info "检测到现有项目,自动更新到最新版本..."
                
                # 保存本地修改(如果有)
                git stash save "Auto-stash before update $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
                
                # 强制更新到最新代码
                git fetch origin main
                git reset --hard origin/main
                git clean -fd
                
                print_success "项目已更新到最新版本"
                return 0
            fi
        fi
        
        # 如果不是正确的仓库,直接删除重建
        print_info "清理旧目录并重新克隆..."
        rm -rf "$PROJECT_DIR"
    fi
    
    # 克隆新项目
    print_info "克隆项目到 $PROJECT_DIR ..."
    git clone https://github.com/yuyuyu6631/rqglsys.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    print_success "项目克隆完成"
}

# 启动服务
start_services() {
    COMPOSE_CMD=$(get_compose_command)
    
    print_info "停止并清理旧容器..."
    
    # 停止 docker-compose 管理的容器
    $COMPOSE_CMD down 2>/dev/null || true
    
    # 强制删除可能残留的容器
    docker rm -f gas-backend gas-frontend 2>/dev/null || true
    
    # 清理未使用的网络
    docker network prune -f 2>/dev/null || true
    
    print_info "构建并启动服务..."
    $COMPOSE_CMD up -d --build
    
    print_info "等待服务启动 (30秒)..."
    sleep 30
    
    # 检查容器状态
    if docker ps | grep -q gas-backend && docker ps | grep -q gas-frontend; then
        print_success "容器启动成功"
    else
        print_error "容器启动失败,请检查日志: $COMPOSE_CMD logs"
        exit 1
    fi
}

# 初始化数据库
init_database() {
    print_info "初始化数据库..."
    
    # 等待后端完全启动
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec gas-backend curl -f http://localhost:5010/api/health &> /dev/null; then
            print_success "后端服务已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "后端服务启动超时"
        COMPOSE_CMD=$(get_compose_command)
        $COMPOSE_CMD logs backend
        exit 1
    fi
    
    # 初始化种子数据
    docker exec gas-backend python app/seed.py
    print_success "数据库初始化完成"
}

# 显示部署信息
show_info() {
    # 获取服务器 IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")
    
    print_header "部署完成!"
    
    echo -e "${GREEN}✓${NC} 前端访问地址: ${BLUE}http://${SERVER_IP}${NC}"
    echo -e "${GREEN}✓${NC} 后端 API 地址: ${BLUE}http://${SERVER_IP}:5010/api${NC}"
    echo ""
    echo "默认账户:"
    echo "  管理员: admin / 123456"
    echo "  用户:   user1 / 123456"
    echo ""
    COMPOSE_CMD=$(get_compose_command)
    echo "常用命令:"
    echo "  查看日志:   $COMPOSE_CMD logs -f"
    echo "  停止服务:   $COMPOSE_CMD down"
    echo "  重启服务:   $COMPOSE_CMD restart"
    echo "  查看状态:   $COMPOSE_CMD ps"
    echo ""
    echo "项目目录: $PROJECT_DIR"
    echo ""
}

# 主函数
main() {
    print_header "燃气企业智能化运营管理系统 - 一键部署"
    
    # 检测操作系统
    detect_os
    
    # 检查权限
    check_root
    
    # 安装依赖
    print_header "步骤 1/6: 安装系统依赖"
    install_git
    install_docker
    install_docker_compose
    
    # 配置防火墙
    print_header "步骤 2/6: 配置防火墙"
    configure_firewall
    
    # 克隆项目
    print_header "步骤 3/6: 克隆项目代码"
    clone_project
    
    # 启动服务
    print_header "步骤 4/6: 启动 Docker 服务"
    start_services
    
    # 初始化数据库
    print_header "步骤 5/6: 初始化数据库"
    init_database
    
    # 显示信息
    print_header "步骤 6/6: 完成"
    show_info
}

# 执行主函数
main
