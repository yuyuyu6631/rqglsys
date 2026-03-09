# -*- coding: utf-8 -*-
# 自动化测试模块: test_gas_purchase
# 依赖导入与客户态鉴权闭环 
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
module_auth(driver, "customer_demo", "123456")

# 唤醒购气组件并注入动态参数设定 
driver.find_element(By.CSS_SELECTOR, ".buy-gas-btn").click()
time.sleep(1)
driver.find_element(By.CSS_SELECTOR, ".spec-item[value='15kg']").click()
driver.find_element(By.CSS_SELECTOR, "#buyNum").send_keys("5")

# 补全履约空间逻辑坐标与凭据 
driver.find_element(By.CSS_SELECTOR, "#address").send_keys("北京市朝阳区建国路88号")
driver.find_element(By.CSS_SELECTOR, "#contact").send_keys("陈先生")
driver.find_element(By.CSS_SELECTOR, "#phone").send_keys("13800000005")

# 提交流转并验证异步回调状态机 
driver.find_element(By.CSS_SELECTOR, ".confirm-order-btn").click()
time.sleep(2)
driver.find_element(By.CSS_SELECTOR, ".pay-test-btn").click()
time.sleep(2)

if "订单提交成功" in driver.page_source and "待分配" in driver.page_source:
    print("业务流水验证：终端缔约成功，状态机初始化完毕")
else:
    print("流转链路断裂：订单实体未能正确映射")

driver.quit()