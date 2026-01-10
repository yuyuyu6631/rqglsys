燃气企业智能运营管理系统 - 实施计划（毕设演示版）
项目概述
本项目是一个面向毕业设计演示的燃气管理系统，聚焦核心功能的完整展示，采用简化但完整的实现方案。

技术栈
前端: React 18 + TypeScript + Vite + Tailwind CSS
后端: Flask (Python) + SQLAlchemy
数据库: SQLite（含演示数据）
认证: 简化的 Session 认证
开发原则
IMPORTANT

毕设演示优先原则

✅ 功能完整性：所有需求文档中的功能都要能演示
✅ 界面美观性：使用现代化UI设计，给评委良好印象
✅ 数据真实性：预置合理的演示数据
❌ 不追求生产级复杂度：简化并发控制、事务处理等
❌ 不过度优化性能：能跑通演示即可
拟议变更
第一阶段: 项目基础架构
后端项目结构
创建以下 Flask 项目结构:

backend/
├── app/
│   ├── __init__.py          # Flask 应用工厂
│   ├── models/              # 数据库模型
│   │   ├── __init__.py
│   │   ├── user.py          # 用户模型
│   │   ├── cylinder.py      # 钢瓶模型
│   │   ├── order.py         # 订单模型
│   │   ├── safety.py        # 安全记录模型
│   │   └── service.py       # 客服模型
│   ├── blueprints/          # 业务模块
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证模块
│   │   ├── users.py         # 用户管理
│   │   ├── cylinders.py     # 钢瓶管理
│   │   ├── orders.py        # 订单管理
│   │   ├── safety.py        # 安全管理
│   │   ├── stats.py         # 数据统计
│   │   └── service.py       # 客户服务
│   ├── utils/               # 工具函数
│   │   ├── decorators.py    # 权限装饰器
│   │   ├── validators.py    # 数据验证
│   │   └── fsm.py           # 状态机实现
│   └── config.py            # 配置文件
├── migrations/              # 数据库迁移
├── tests/                   # 测试用例
├── requirements.txt         # Python 依赖
└── run.py                   # 启动文件
[NEW] 
requirements.txt
Python 后端依赖配置

[NEW] 
run.py
Flask 应用启动入口

[NEW] 
config.py
应用配置(数据库、Session、上传路径等)

前端项目结构
使用 Vite 创建 React + TypeScript 项目:

frontend/
├── src/
│   ├── assets/              # 静态资源
│   ├── components/          # 通用组件
│   │   ├── common/          # 基础组件
│   │   ├── layout/          # 布局组件
│   │   └── charts/          # 图表组件
│   ├── pages/               # 页面组件
│   │   ├── auth/            # 登录注册
│   │   ├── admin/           # 管理员页面
│   │   ├── station/         # 站长页面
│   │   ├── delivery/        # 配送员页面
│   │   └── user/            # 普通用户页面
│   ├── services/            # API 服务
│   ├── hooks/               # 自定义 Hooks
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── router/              # 路由配置
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
[NEW] 
package.json
前端项目依赖配置

[NEW] 
vite.config.ts
Vite 构建配置(含代理设置)

[NEW] 
tailwind.config.js
Tailwind CSS 配置

第二阶段: 数据库设计
核心数据模型
[NEW] 
user.py
用户模型,包含:

基础字段: id, username, password_hash, role, station_id
角色枚举: ADMIN, STATION_MASTER, DELIVERY, USER
关联关系: 1:N Orders, 1:N SafetyRecords
密码加密方法
[NEW] 
cylinder.py
钢瓶模型,包含:

基础字段: id, serial_code, specs, status, expiry_date
状态枚举: IN_STOCK, DELIVERING, IN_USE, EMPTY
状态流转验证方法
有效期校验方法
[NEW] 
order.py
订单模型,包含:

Order 主表: id, user_id, delivery_id, status, total_amount, created_at
OrderItem 明细表: id, order_id, cylinder_id, quantity, price
状态枚举: PENDING, ASSIGNED, DELIVERING, COMPLETED, CANCELLED
库存预占/扣减方法
[NEW] 
safety.py
安全记录模型,包含:

SafetyRecord: id, order_id, inspector_id, check_items, photos, hazard_level
Hazard: id, record_id, description, status, rectify_photos
隐患状态: PENDING, RECTIFYING, COMPLETED
[NEW] 
service.py
客户服务模型,包含:

Announcement: id, title, content, created_at
Complaint: id, user_id, order_id, content, status, reply
Rating: id, order_id, score, comment
第三阶段: 后端 API 实现
认证与权限模块
[NEW] 
auth.py
认证接口:

POST /api/auth/login - 用户登录(Session 认证)
POST /api/auth/logout - 用户登出
GET /api/auth/current - 获取当前用户信息
POST /api/auth/register - 用户注册
[NEW] 
decorators.py
权限装饰器:

@login_required - 登录验证
@role_required(['ADMIN']) - 角色验证
@audit_log - 审计日志记录
钢瓶管理模块
[NEW] 
cylinders.py
钢瓶管理接口:

GET /api/cylinders - 钢瓶列表(支持状态筛选)
POST /api/cylinders - 新增钢瓶档案
PUT /api/cylinders/:id/status - 更新钢瓶状态(含FSM验证)
GET /api/cylinders/inventory - 库存统计
GET /api/cylinders/expiring - 即将过期钢瓶
[NEW] 
fsm.py
钢瓶状态机实现:

定义允许的状态转换规则
状态转换验证方法
非法转换拦截
订单管理模块
[NEW] 
orders.py
订单管理接口:

POST /api/orders - 用户下单(含库存预占锁)
GET /api/orders - 订单列表(按角色过滤)
PUT /api/orders/:id/assign - 分配订单给配送员
PUT /api/orders/:id/complete - 完成订单(含库存扣减事务)
GET /api/orders/:id - 订单详情
核心逻辑:

# 库存锁定机制(防止超卖)
with db.session.begin_nested():
    cylinder = Cylinder.query.filter_by(
        status='IN_STOCK', 
        specs=order_specs
    ).with_for_update().first()
    
    if not cylinder:
        raise InsufficientStockError()
    
    cylinder.status = 'RESERVED'
    db.session.commit()
安全管理模块
[NEW] 
safety.py
安全管理接口:

POST /api/safety/inspections - 提交安检单
POST /api/safety/hazards - 上报隐患(含图片上传)
PUT /api/safety/hazards/:id/rectify - 提交整改
GET /api/safety/hazards - 隐患台账
数据统计模块
[NEW] 
stats.py
统计分析接口:

GET /api/stats/dashboard - 仪表盘数据
GET /api/stats/orders/trend - 订单趋势(7日/30日)
GET /api/stats/delivery/ranking - 配送员排名
GET /api/stats/inventory/alert - 库存预警
第四阶段: 前端界面实现
通用组件
[NEW] 
Button.tsx
按钮组件(支持多种样式和加载状态)

[NEW] 
Table.tsx
表格组件(支持分页、排序、筛选)

[NEW] 
Modal.tsx
弹窗组件

[NEW] 
Chart.tsx
图表组件(基于 Recharts)

路由与权限
[NEW] 
router.tsx
路由配置:

公开路由: /login, /register
管理员路由: /admin/*
站长路由: /station/*
配送员路由: /delivery/*
用户路由: /user/*
[NEW] 
ProtectedRoute.tsx
权限路由守卫组件

核心页面
[NEW] 
Login.tsx
登录页面(现代化设计,渐变背景)

[NEW] 
Dashboard.tsx
管理员仪表盘(数据可视化看板)

[NEW] 
CylinderManage.tsx
钢瓶管理页面(列表、状态流转)

[NEW] 
OrderManage.tsx
订单管理页面(订单分配、状态跟踪)

[NEW] 
UserOrder.tsx
用户下单页面(库存展示、下单表单)

第五阶段: 核心业务逻辑（简化版）
库存管理
简化实现:

下单时直接查询可用库存数量
订单完成时更新钢瓶状态为 IN_USE
不实现复杂的锁机制，演示环境单用户操作即可
钢瓶状态流转
基础状态机:

入库(IN_STOCK) → 配送中(DELIVERING) → 使用中(IN_USE) → 空瓶(EMPTY)
前端控制: 按钮根据当前状态显示可用操作

图片上传
基础实现:

使用 Flask 的文件上传功能
保存到本地 uploads/ 目录
返回文件访问路径
验证计划（演示版）
功能演示清单
必须能演示的功能
# 1. 用户登录（4种角色）
- 管理员、站长、配送员、普通用户
# 2. 钢瓶管理
- 查看钢瓶列表
- 添加新钢瓶
- 修改钢瓶状态（演示状态流转）
# 3. 订单流程
- 用户下单
- 管理员分配订单
- 配送员接单
- 完成订单
# 4. 安全管理
- 配送员填写安检单
- 上报隐患（上传图片）
- 查看隐患台账
# 5. 数据统计
- 查看仪表盘（订单趋势图、配送员排名）
- 库存预警提示
# 6. 客户服务
- 发布公告
- 用户投诉与评价
演示数据准备
预置数据:

4个测试账号（对应4种角色）
20个钢瓶记录（不同状态）
15条历史订单
5条安全记录
3条公告
项目里程碑（简化版）
阶段	预计时间	交付物
项目初始化	0.5天	前后端框架搭建
数据库设计	0.5天	模型定义 + 演示数据
后端开发	2天	核心 API 接口
前端开发	3天	所有页面界面
联调测试	1天	功能演示验证
总计: 约 7 个工作日

演示脚本建议
答辩演示流程（10分钟）
登录展示 (1分钟)

演示管理员登录
数据看板 (2分钟)

展示仪表盘图表
讲解订单趋势、配送员排名
核心业务 (4分钟)

用户下单流程
订单分配给配送员
钢瓶状态变更
订单完成
安全管理 (2分钟)

配送员填写安检单
上报隐患并上传图片
权限演示 (1分钟)

切换不同角色账号
展示菜单权限差异