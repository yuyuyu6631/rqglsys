# -*- coding: utf-8 -*-
# 自动化测试模块: test_login_auth
# 导入核心框架依赖
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# 初始化 WebDriver 引擎并配置智能等待池以规避异步加载时滞 
driver = webdriver.Chrome()
driver.implicitly_wait(10)

# 加载鉴权路由并规范化视口映射 
driver.get("http://localhost:8080/gas-system/login")
driver.set_window_size(1722, 928)

# 寻址 DOM 节点并注入模拟合法负载 
driver.find_element(By.CSS_SELECTOR, "#username").click()
driver.find_element(By.CSS_SELECTOR, "#username").send_keys("admin")
driver.find_element(By.CSS_SELECTOR, "#password").click()
driver.find_element(By.CSS_SELECTOR, "#password").send_keys("123456")
driver.find_element(By.CSS_SELECTOR, "#code").click()
driver.find_element(By.CSS_SELECTOR, "#code").send_keys("1234")

# 触发鉴权通信事件 
driver.find_element(By.CSS_SELECTOR, ".login-btn").click()
time.sleep(2)

# 基于 Document Title 演变的断言判定机制 
if "燃气管理系统-管理员后台" in driver.title:
    print("系统事件：管理员令牌获取并鉴权成功")
else:
    print("系统异常：管理员鉴权链路阻断")

# 边界流测试：错误口令与越权拦截验证 
driver.get("http://localhost:8080/gas-system/login")
driver.find_element(By.CSS_SELECTOR, "#username").send_keys("admin")
driver.find_element(By.CSS_SELECTOR, "#password").send_keys("654321")
driver.find_element(By.CSS_SELECTOR, "#code").send_keys("1234")
driver.find_element(By.CSS_SELECTOR, ".login-btn").click()
time.sleep(1)

# 异常状态捕获验证 
if "用户名或密码错误" in driver.page_source:
    print("拦截器效能达标：越权请求被成功阻断")
else:
    print("安全缺陷：异常状态标识缺失")

driver.quit()