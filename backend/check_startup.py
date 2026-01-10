#!/usr/bin/env python
"""
后端启动检查脚本
验证所有模块能够正常导入和初始化
"""

import sys
import os

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_imports():
    """检查所有关键模块导入"""
    print("=" * 50)
    print("检查模块导入...")
    print("=" * 50)
    
    try:
        print("✓ 导入 Flask...")
        from flask import Flask
        
        print("✓ 导入 SQLAlchemy...")
        from flask_sqlalchemy import SQLAlchemy
        
        print("✓ 导入 CORS...")
        from flask_cors import CORS
        
        print("✓ 导入 Werkzeug...")
        from werkzeug.security import generate_password_hash
        
        print("✓ 导入 app 模块...")
        from app import create_app, db
        
        print("✓ 导入 models...")
        from app.models import User, Cylinder, Order, SafetyRecord, Announcement, Rating
        
        print("✓ 导入 auth...")
        from app.auth import auth_bp, login_required
        
        print("✓ 导入 api...")
        from app.api import api_bp
        
        print("✓ 导入 validators...")
        from app.validators import validate_required_fields
        
        print("\n✅ 所有模块导入成功!")
        return True
    except ImportError as e:
        print(f"\n❌ 模块导入失败: {e}")
        return False

def check_app_creation():
    """检查应用创建"""
    print("\n" + "=" * 50)
    print("检查应用创建...")
    print("=" * 50)
    
    try:
        from app import create_app
        
        print("✓ 创建 Flask 应用...")
        app = create_app()
        
        print(f"✓ 应用名称: {app.name}")
        print(f"✓ 数据库 URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"✓ 密钥已配置: {'SECRET_KEY' in app.config}")
        
        print("\n✅ 应用创建成功!")
        return True
    except Exception as e:
        print(f"\n❌ 应用创建失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_database():
    """检查数据库"""
    print("\n" + "=" * 50)
    print("检查数据库...")
    print("=" * 50)
    
    try:
        from app import create_app, db
        from app.models import User
        
        app = create_app()
        
        with app.app_context():
            print("✓ 数据库上下文创建成功")
            
            # 检查表是否存在
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"✓ 数据库表数量: {len(tables)}")
            print(f"✓ 表列表: {', '.join(tables)}")
            
            expected_tables = ['users', 'cylinders', 'orders', 'safety_records', 'announcements', 'ratings']
            missing_tables = [t for t in expected_tables if t not in tables]
            
            if missing_tables:
                print(f"⚠️  缺少表: {', '.join(missing_tables)}")
            else:
                print("✓ 所有必需的表都存在")
            
        print("\n✅ 数据库检查通过!")
        return True
    except Exception as e:
        print(f"\n❌ 数据库检查失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_routes():
    """检查路由"""
    print("\n" + "=" * 50)
    print("检查路由...")
    print("=" * 50)
    
    try:
        from app import create_app
        
        app = create_app()
        
        # 获取所有路由
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{rule.endpoint}: {rule.rule}")
        
        print(f"✓ 注册路由数量: {len(routes)}")
        
        # 检查关键路由
        key_routes = ['/api/health', '/api/auth/login', '/api/users', '/api/orders']
        for route in key_routes:
            found = any(route in r for r in routes)
            status = "✓" if found else "❌"
            print(f"{status} {route}")
        
        print("\n✅ 路由检查完成!")
        return True
    except Exception as e:
        print(f"\n❌ 路由检查失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("\n" + "=" * 50)
    print("后端启动检查")
    print("=" * 50 + "\n")
    
    results = []
    
    # 运行所有检查
    results.append(("模块导入", check_imports()))
    results.append(("应用创建", check_app_creation()))
    results.append(("数据库", check_database()))
    results.append(("路由", check_routes()))
    
    # 总结
    print("\n" + "=" * 50)
    print("检查总结")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 所有检查通过!后端可以正常启动。")
        return 0
    else:
        print("\n⚠️  部分检查失败,请修复后再启动。")
        return 1

if __name__ == '__main__':
    sys.exit(main())
