# 后端API接口文档

## 概述

本文档描述了燃气钢瓶管理系统后端的所有CRUD接口。

**基础URL**: `http://localhost:5000/api`

**认证方式**: Session Cookie（需要先登录）

---

## 认证接口

### 登录
```
POST /auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应**:
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "phone": "13800138000",
  "real_name": "管理员"
}
```

### 获取当前用户
```
GET /auth/me
```

### 登出
```
POST /auth/logout
```

---

## 用户管理接口

### 获取用户列表
```
GET /users?role=user
```

**权限**: admin, station

**查询参数**:
- `role` (可选): 按角色筛选 (admin/station/delivery/user)

### 创建用户
```
POST /users
```

**权限**: admin

**请求体**:
```json
{
  "username": "newuser",      // 必填
  "password": "123456",       // 必填
  "role": "user",            // 可选，默认user
  "phone": "13900139000",    // 可选
  "real_name": "张三"        // 可选
}
```

**验证规则**:
- username: 必填，唯一
- password: 必填
- role: 必须是 admin/station/delivery/user 之一
- phone: 必须是有效的11位手机号

### 更新用户
```
PUT /users/:id
```

**权限**: admin

### 删除用户
```
DELETE /users/:id
```

**权限**: admin

---

## 钢瓶管理接口

### 获取钢瓶列表
```
GET /cylinders?status=in_stock&specs=15kg
```

**权限**: 已登录用户

**查询参数**:
- `status` (可选): 按状态筛选 (in_stock/delivering/in_use/empty)
- `specs` (可选): 按规格筛选 (5kg/15kg/50kg)

### 创建钢瓶
```
POST /cylinders
```

**权限**: admin, station

**请求体**:
```json
{
  "specs": "15kg",                    // 必填
  "serial_code": "CYL20240110001",   // 可选，自动生成
  "manufacturer": "中燃集团",         // 可选
  "manufacture_date": "2024-01-01",  // 可选，格式YYYY-MM-DD
  "expiry_date": "2025-01-01"        // 可选，格式YYYY-MM-DD
}
```

**验证规则**:
- specs: 必填，必须是 5kg/15kg/50kg 之一
- manufacture_date: 格式必须是 YYYY-MM-DD
- expiry_date: 格式必须是 YYYY-MM-DD，且必须晚于manufacture_date

### 更新钢瓶
```
PUT /cylinders/:id
```

**权限**: admin, station

### 删除钢瓶
```
DELETE /cylinders/:id
```

**权限**: admin, station

**限制**: 不能删除状态为 delivering 或 in_use 的钢瓶

### 更新钢瓶状态
```
PUT /cylinders/:id/status
```

**权限**: 已登录用户

**请求体**:
```json
{
  "status": "delivering"
}
```

**状态流转规则**:
- in_stock → delivering
- delivering → in_use, in_stock
- in_use → empty
- empty → in_stock

### 获取钢瓶统计
```
GET /cylinders/stats
```

**权限**: 已登录用户

**响应**:
```json
{
  "in_stock": 150,
  "delivering": 20,
  "in_use": 300,
  "empty": 50,
  "expiring_soon": 10,
  "total": 520
}
```

---

## 订单管理接口

### 获取订单列表
```
GET /orders?status=pending
```

**权限**: 已登录用户

**查询参数**:
- `status` (可选): 按状态筛选 (pending/assigned/delivering/completed/cancelled)

**权限过滤**:
- 普通用户只能看到自己的订单
- 配送员只能看到分配给自己的订单
- 管理员可以看到所有订单

### 获取订单详情
```
GET /orders/:id
```

**权限**: 已登录用户（仅能查看自己相关的订单）

### 创建订单
```
POST /orders
```

**权限**: 已登录用户

**请求体**:
```json
{
  "specs": "15kg",                  // 必填
  "quantity": 2,                    // 可选，默认1
  "address": "北京市朝阳区xxx",     // 必填
  "contact_name": "张三",           // 可选，默认用户姓名
  "contact_phone": "13900139000",  // 可选，默认用户手机
  "remark": "请在下午送达"          // 可选
}
```

**验证规则**:
- specs: 必填，必须是 5kg/15kg/50kg 之一
- quantity: 必须是正整数
- address: 必填
- contact_phone: 必须是有效的11位手机号
- 库存检查：订购数量不能超过可用库存

### 分配订单
```
PUT /orders/:id/assign
```

**权限**: admin, station

**请求体**:
```json
{
  "delivery_id": 5
}
```

**限制**: 只能分配状态为 pending 的订单

### 更新订单状态
```
PUT /orders/:id/status
```

**权限**: 已登录用户

**请求体**:
```json
{
  "status": "delivering"
}
```

**状态流转规则**:
- pending → assigned, cancelled
- assigned → delivering, cancelled
- delivering → completed
- completed → (不可变更)
- cancelled → (不可变更)

---

## 安全检查接口

### 获取安检记录
```
GET /safety/records?hazard_level=high
```

**权限**: 已登录用户

**查询参数**:
- `hazard_level` (可选): 按隐患等级筛选 (none/low/medium/high)

**权限过滤**:
- 配送员只能看到自己的检查记录
- 管理员可以看到所有记录

### 创建安检记录
```
POST /safety/records
```

**权限**: 已登录用户

**请求体**:
```json
{
  "order_id": 123,                      // 可选
  "check_items": "{...}",              // 可选，JSON字符串
  "hazard_level": "low",               // 可选，默认none
  "hazard_description": "软管老化",     // 可选
  "photos": ["photo1.jpg", "photo2.jpg"] // 可选
}
```

### 更新安检记录
```
PUT /safety/records/:id
```

**权限**: 已登录用户

**请求体**:
```json
{
  "rectify_status": "completed",
  "rectify_photos": ["fixed1.jpg", "fixed2.jpg"]
}
```

### 上传安检照片
```
POST /safety/upload
```

**权限**: 已登录用户

**请求**: multipart/form-data
- `file`: 图片文件

**响应**:
```json
{
  "filename": "20240110123456_abc123.jpg",
  "url": "/uploads/20240110123456_abc123.jpg"
}
```

---

## 公告管理接口

### 获取公告列表
```
GET /announcements
```

**权限**: 已登录用户

**排序**: 置顶优先，然后按创建时间倒序

### 创建公告
```
POST /announcements
```

**权限**: admin

**请求体**:
```json
{
  "title": "系统维护通知",
  "content": "本系统将于...",
  "is_top": false
}
```

### 更新公告
```
PUT /announcements/:id
```

**权限**: admin

**请求体**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "is_top": true
}
```

### 删除公告
```
DELETE /announcements/:id
```

**权限**: admin

---

## 评价管理接口

### 创建评价
```
POST /ratings
```

**权限**: 已登录用户

**请求体**:
```json
{
  "order_id": 123,
  "score": 5,
  "comment": "服务很好"
}
```

**限制**:
- 只能评价自己的订单
- 只能评价已完成的订单
- 每个订单只能评价一次

### 获取评价列表
```
GET /ratings?order_id=123
```

**权限**: 已登录用户

**查询参数**:
- `order_id` (可选): 按订单ID筛选

### 获取订单评价
```
GET /orders/:id/rating
```

**权限**: 已登录用户

**响应**: 如果订单没有评价，返回404

---

## 统计分析接口

### 获取仪表盘统计
```
GET /stats/dashboard
```

**权限**: 已登录用户

**响应**:
```json
{
  "total_orders": 500,
  "pending_orders": 20,
  "completed_orders": 450,
  "total_cylinders": 1000,
  "in_stock": 600,
  "total_users": 200,
  "total_delivery": 10,
  "today_orders": 15,
  "today_revenue": 1800.0
}
```

### 获取订单趋势
```
GET /stats/orders/trend?days=7
```

**权限**: 已登录用户

**查询参数**:
- `days` (可选): 天数，默认7

**响应**:
```json
[
  {"date": "2024-01-04", "count": 10},
  {"date": "2024-01-05", "count": 15},
  ...
]
```

### 获取配送员排名
```
GET /stats/delivery/ranking
```

**权限**: 已登录用户

**响应**:
```json
[
  {
    "id": 5,
    "username": "delivery1",
    "real_name": "李四",
    "order_count": 150
  },
  ...
]
```

---

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": "错误描述信息"
}
```

常见HTTP状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未登录
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 测试示例

使用curl测试接口：

```bash
# 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  -c cookies.txt

# 创建钢瓶
curl -X POST http://localhost:5000/api/cylinders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "specs": "15kg",
    "manufacturer": "测试厂家",
    "manufacture_date": "2024-01-01",
    "expiry_date": "2025-01-01"
  }'

# 获取钢瓶列表
curl -X GET http://localhost:5000/api/cylinders \
  -b cookies.txt
```

---

## 运行后端服务

```bash
cd backend
python run.py
```

服务将在 `http://localhost:5000` 启动。
