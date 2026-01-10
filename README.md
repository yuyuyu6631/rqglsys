# 燃气企业智能化运营管理系统

## 项目简介

燃气企业智能化运营管理系统是一个现代化的全栈 Web 应用,旨在为燃气企业提供高效、智能的运营管理解决方案。系统采用前后端分离架构,提供用户管理、订单管理、气瓶管理、配送管理、安全检查等核心功能。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 设计**: 现代化深色主题,玻璃态设计风格
- **路由**: React Router
- **状态管理**: React Hooks

### 后端
- **框架**: Python Flask
- **数据库**: SQLite
- **认证**: JWT (JSON Web Token)
- **API**: RESTful API 设计
- **测试**: Pytest

### 部署
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (前端)
- **反向代理**: 支持生产环境部署

## 主要功能

### 管理员功能
- 📊 **数据看板**: 实时查看系统运营数据和统计信息
- 👥 **用户管理**: 管理系统用户,包括客户和配送员
- 📦 **订单管理**: 处理和跟踪燃气订单
- 🛢️ **气瓶管理**: 管理气瓶库存、状态和追踪
- 🚚 **配送管理**: 分配和管理配送任务
- 🔒 **安全检查**: 记录和管理安全检查任务
- 📢 **公告管理**: 发布系统公告和通知

### 用户功能
- 🏠 **用户首页**: 查看个人信息和订单状态
- 🛒 **在线下单**: 便捷的燃气订购流程
- 📋 **订单查询**: 查看历史订单和配送状态

## 快速开始

### 使用 Docker (推荐)

```bash
# 克隆项目
git clone https://github.com/yuyuyu6631/rqglsys.git
cd rqglsys

# 启动服务
docker-compose up -d

# 访问应用
# 前端: http://localhost
# 后端 API: http://localhost:5000
```

### 本地开发

#### 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python app/seed.py

# 启动开发服务器
python run.py
```

#### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`

### 测试用户账户
- 用户名: `user1`
- 密码: `password123`

## 项目结构

```
rqglsys/
├── backend/                 # 后端代码
│   ├── app/                # 应用核心代码
│   │   ├── api.py         # API 路由
│   │   ├── models.py      # 数据模型
│   │   ├── auth.py        # 认证逻辑
│   │   └── validators.py  # 数据验证
│   ├── tests/             # 测试文件
│   ├── requirements.txt   # Python 依赖
│   └── Dockerfile         # 后端 Docker 配置
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── services/     # API 服务
│   │   └── types/        # TypeScript 类型定义
│   ├── package.json      # Node.js 依赖
│   └── Dockerfile        # 前端 Docker 配置
├── docker-compose.yml    # Docker Compose 配置
└── README.md            # 项目说明文档
```

## API 文档

详细的 API 文档请参考 [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## 测试

### 后端测试

```bash
cd backend
pytest tests/
```

详细的测试指南请参考 [TESTING_GUIDE.md](backend/TESTING_GUIDE.md)

## Docker 部署

详细的 Docker 部署说明请参考 [README_DOCKER.md](README_DOCKER.md)

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目!

## 许可证

本项目采用 MIT 许可证

## 联系方式

如有问题或建议,请通过 GitHub Issues 联系我们。
