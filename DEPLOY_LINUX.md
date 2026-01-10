# Linux 云服务器部署指南

## 🚀 一键部署(推荐)

### 方式一:完整自动化安装

适用于全新的云服务器,会自动安装 Docker、Git 等依赖。

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/yuyuyu6631/rqglsys/main/install.sh -o install.sh
chmod +x install.sh
sudo bash install.sh
```

或者直接一行命令:

```bash
curl -fsSL https://raw.githubusercontent.com/yuyuyu6631/rqglsys/main/install.sh | sudo bash
```

### 方式二:已有 Docker 环境

如果服务器已经安装了 Docker 和 Docker Compose:

```bash
# 克隆项目
git clone https://github.com/yuyuyu6631/rqglsys.git
cd rqglsys

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

## 📋 系统要求

- **操作系统**: Ubuntu 18.04+, Debian 10+, CentOS 7+
- **内存**: 至少 1GB RAM (推荐 2GB+)
- **磁盘**: 至少 5GB 可用空间
- **端口**: 需要开放 80 和 5010 端口

## 🔧 手动部署步骤

### 1. 安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**CentOS:**
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 安装 Docker Compose

```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 克隆项目

```bash
# 安装 Git (如果未安装)
sudo apt-get install -y git  # Ubuntu/Debian
# 或
sudo yum install -y git       # CentOS

# 克隆项目
git clone https://github.com/yuyuyu6631/rqglsys.git
cd rqglsys
```

### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d --build

# 等待服务启动 (约30秒)
sleep 30

# 初始化数据库
docker exec -it gas-backend python app/seed.py
```

### 5. 配置防火墙

**使用 firewalld (CentOS):**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=5010/tcp
sudo firewall-cmd --reload
```

**使用 ufw (Ubuntu):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 5010/tcp
```

**阿里云/腾讯云安全组:**
- 在云服务器控制台添加安全组规则
- 开放入站端口: 80, 5010

## 🌐 访问应用

部署完成后,通过以下地址访问:

- **前端**: `http://你的服务器IP`
- **后端 API**: `http://你的服务器IP:5010/api`

## 🔐 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 站长 | station1 | 123456 |
| 配送员 | delivery1 | 123456 |
| 普通用户 | user1 | 123456 |

## 📊 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码并重启
git pull origin main
docker-compose up -d --build
docker exec -it gas-backend python app/seed.py
```

## 🔍 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
sudo netstat -tulpn | grep -E '80|5010'

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 数据库初始化失败

```bash
# 进入容器手动初始化
docker exec -it gas-backend bash
python app/seed.py
exit
```

### 无法访问应用

1. 检查防火墙规则
2. 检查云服务器安全组设置
3. 确认容器正在运行: `docker-compose ps`
4. 检查健康状态: `curl http://localhost:5010/api/health`

## 🔄 更新部署

```bash
# 进入项目目录
cd /opt/gas-system  # 或你的项目目录

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up -d --build

# 如果数据库结构有变化,重新初始化
docker exec -it gas-backend python app/seed.py
```

## 🛡️ 生产环境建议

1. **修改默认密码**: 首次登录后立即修改所有默认账户密码
2. **配置 HTTPS**: 使用 Nginx 反向代理配置 SSL 证书
3. **定期备份**: 备份 `backend/instance/gas_system.db` 数据库文件
4. **监控日志**: 定期检查应用日志
5. **资源监控**: 监控服务器 CPU、内存使用情况

## 📞 技术支持

如遇问题,请查看:
- GitHub Issues: https://github.com/yuyuyu6631/rqglsys/issues
- 项目文档: [README.md](README.md)
- Docker 文档: [README_DOCKER.md](README_DOCKER.md)
