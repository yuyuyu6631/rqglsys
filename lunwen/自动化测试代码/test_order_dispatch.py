# -*- coding: utf-8 -*-
# 自动化测试模块: test_order_dispatch
# 依赖导入与管理态鉴权闭环 
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

# 深入订单调度路由引擎 
driver.find_element(By.CSS_SELECTOR, ".menu-item[href='#order']").click()
time.sleep(1)
driver.find_element(By.CSS_SELECTOR, ".order-tab[value='pending']").click()
time.sleep(1)

# 捕获挂起态实体并建立资源映射 
driver.find_element(By.CSS_SELECTOR, ".order-list tr:first-child .select-btn").click()
driver.find_element(By.CSS_SELECTOR, ".assign-courier-btn").click()
time.sleep(1)

# 将任务图谱投递至空闲边缘节点 
driver.find_element(By.CSS_SELECTOR, ".courier-item[value='courier01']").click()
driver.find_element(By.CSS_SELECTOR, ".confirm-assign-btn").click()
time.sleep(2)

# 校验状态机演化与资源依赖一致性 
if "已指派" in driver.page_source and "配送员A" in driver.page_source:
    print("调度图谱校验：资源下发成功，耦合关系建立")
else:
    print("分发失败：未能在有效生命周期内完成资源映射")

driver.quit()