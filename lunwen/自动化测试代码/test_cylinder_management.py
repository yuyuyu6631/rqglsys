# -*- coding: utf-8 -*-
# 自动化测试模块: test_cylinder_management
# 依赖导入与通用鉴权模块复用 
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def module_auth(driver_instance, uid, pwd):
    driver_instance.get("http://localhost:8080/gas-system/login")
    driver_instance.find_element(By.CSS_SELECTOR, "#username").send_keys(uid)
    driver_instance.find_element(By.CSS_SELECTOR, "#password").send_keys(pwd)
    driver_instance.find_element(By.CSS_SELECTOR, "#code").send_keys("1234")
    driver_instance.find_element(By.CSS_SELECTOR, ".login-btn").click()
    time.sleep(2)

driver = webdriver.Chrome()
driver.implicitly_wait(10)
module_auth(driver, "admin", "123456")

# 挂载管理域并触发资产注入表单 
driver.find_element(By.CSS_SELECTOR, ".menu-item[href='#cylinder']").click()
time.sleep(1)
driver.find_element(By.CSS_SELECTOR, ".add-cylinder-btn").click()
time.sleep(1)

# 串码及生命周期元数据入库模拟 
driver.find_element(By.CSS_SELECTOR, "#cylinderCode").send_keys("GP-2025-0099")
driver.find_element(By.CSS_SELECTOR, "#factory").send_keys("金源压力容器有限公司")
driver.find_element(By.CSS_SELECTOR, "#produceDate").send_keys("2025-03-01")
driver.find_element(By.CSS_SELECTOR, "#expireDate").send_keys("2033-03-01")

# 持久化请求提交与视图数据一致性断言 
driver.find_element(By.CSS_SELECTOR, ".save-cylinder-btn").click()
time.sleep(2)

if "GP-2025-0099" in driver.page_source:
    print("数据库事务闭环：钢瓶档案实体持久化成功")
else:
    print("数据写入阻断：钢瓶档案录入失败")

driver.quit()