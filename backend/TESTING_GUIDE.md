# 后端CRUD接口测试指南

## 运行单元测试

### 方法1：使用pytest（推荐）

```bash
cd backend

# 安装pytest（如果还没安装）
pip install pytest

# 运行所有测试
pytest tests/test_api.py -v

# 运行特定测试类
pytest tests/test_api.py::CylinderAPITest -v

# 运行特定测试用例
pytest tests/test_api.py::CylinderAPITest::test_create_cylinder_success -v

# 查看测试覆盖率
pip install pytest-cov
pytest tests/test_api.py --cov=app --cov-report=html
```

### 方法2：使用unittest

```bash
cd backend
python -m unittest tests.test_api -v
```

## 测试用例列表

### 钢瓶管理测试 (7个用例)
- ✅ test_create_cylinder_success - 测试成功创建钢瓶
- ✅ test_create_cylinder_invalid_specs - 测试无效规格
- ✅ test_create_cylinder_missing_required_field - 测试缺少必填字段
- ✅ test_create_cylinder_invalid_date_range - 测试无效日期范围
- ✅ test_get_cylinders - 测试获取钢瓶列表
- ✅ test_delete_cylinder_success - 测试成功删除钢瓶
- ✅ test_delete_cylinder_in_use - 测试删除使用中的钢瓶

### 订单管理测试 (3个用例)
- ✅ test_create_order_success - 测试成功创建订单
- ✅ test_create_order_insufficient_stock - 测试库存不足
- ✅ test_get_order_detail - 测试获取订单详情

### 用户管理测试 (3个用例)
- ✅ test_create_user_success - 测试成功创建用户
- ✅ test_create_user_duplicate_username - 测试重复用户名
- ✅ test_create_user_invalid_phone - 测试无效手机号

## 手动测试接口

### 1. 启动后端服务

```bash
cd backend
python run.py
```

### 2. 使用Postman或curl测试

#### 登录
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  -c cookies.txt
```

#### 创建钢瓶
```bash
curl -X POST http://localhost:5000/api/cylinders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "specs": "15kg",
    "manufacturer": "测试厂家",
    "manufacture_date": "2024-01-01",
    "expiry_date": "2025-01-01"
  }'
```

#### 获取钢瓶列表
```bash
curl -X GET http://localhost:5000/api/cylinders \
  -b cookies.txt
```

#### 删除钢瓶
```bash
curl -X DELETE http://localhost:5000/api/cylinders/1 \
  -b cookies.txt
```

## 测试数据准备

运行以下脚本创建测试数据：

```bash
cd backend
python seed_realistic_data.py
```

这将创建：
- 管理员账号
- 测试用户
- 测试钢瓶
- 测试订单

## 常见问题

### Q: 测试失败，提示数据库错误
A: 确保数据库文件有写权限，或删除旧的测试数据库重新运行

### Q: 导入错误
A: 确保在backend目录下运行测试，并且已安装所有依赖

### Q: 如何查看详细的测试输出
A: 使用 `-v` 或 `-vv` 参数增加详细程度

## 参考文档

- [API接口文档](./API_DOCUMENTATION.md)
- [实施计划](../C:/Users/qy/.gemini/antigravity/brain/45183692-9d89-4518-a560-10f527435c24/implementation_plan.md)
- [工作总结](../C:/Users/qy/.gemini/antigravity/brain/45183692-9d89-4518-a560-10f527435c24/walkthrough.md)
