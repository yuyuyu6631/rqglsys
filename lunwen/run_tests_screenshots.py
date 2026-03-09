from playwright.sync_api import sync_playwright
import time
import os

OUT_DIR = r"d:\毕设\rqglsys\lunwen\第四章截图及用例"
os.makedirs(OUT_DIR, exist_ok=True)
BASE_URL = "http://localhost:5173"

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # --- DL: 登录模块 ---
        # DL-002: 错误密码
        page.goto(f"{BASE_URL}/login")
        page.fill("input[placeholder='请输入您的账号']", "admin")
        page.fill("input[placeholder='请输入您的密码']", "errorpass")
        page.click("button[type='submit']")
        time.sleep(1)
        page.screenshot(path=f"{OUT_DIR}/图4.2 DL-002用例执行结果截图.png")
        print("DL-002 Done")

        # DL-003: 非法访问拦截
        context.clear_cookies()
        page.goto(f"{BASE_URL}/admin/cylinders")
        time.sleep(1)
        page.screenshot(path=f"{OUT_DIR}/图4.3 DL-003用例执行结果截图.png")
        print("DL-003 Done")

        # DL-001: 正常登录
        page.goto(f"{BASE_URL}/login")
        page.fill("input[placeholder='请输入您的账号']", "admin")
        page.fill("input[placeholder='请输入您的密码']", "123456")
        page.click("button[type='submit']")
        page.wait_for_url("**/admin*")
        time.sleep(1)
        page.screenshot(path=f"{OUT_DIR}/图4.1 DL-001用例执行结果截图.png")
        print("DL-001 Done")

        # --- GP: 钢瓶模块 ---
        page.goto(f"{BASE_URL}/admin/cylinders")
        time.sleep(2)
        # GP-001: 列表查阅
        page.screenshot(path=f"{OUT_DIR}/图4.4 GP-001用例执行结果截图.png")
        print("GP-001 Done")

        # GP-002: 有效期预警
        page.goto(f"{BASE_URL}/admin")
        time.sleep(1)
        page.screenshot(path=f"{OUT_DIR}/图4.5 GP-002用例执行结果截图.png")
        print("GP-002 Done")

        # GP-003: 表单拦截
        page.goto(f"{BASE_URL}/admin/cylinders")
        time.sleep(1)
        try:
            if page.locator("button:has-text('新增钢瓶')").is_visible():
                page.locator("button:has-text('新增钢瓶')").click()
                time.sleep(1)
                if page.locator("button:has-text('确定')").is_visible():
                    page.locator("button:has-text('确定')").click()
                elif page.locator("button:has-text('保存')").is_visible():
                    page.locator("button:has-text('保存')").click()
                time.sleep(1)
        except Exception:
            pass
        page.screenshot(path=f"{OUT_DIR}/图4.6 GP-003用例执行结果截图.png")
        print("GP-003 Done")

        # --- GQ: 购气模块 ---
        context_user = browser.new_context()
        page2 = context_user.new_page()
        page2.goto(f"{BASE_URL}/login")
        page2.locator("text=客户 (customer_demo)").click()
        page2.click("button[type='submit']")
        page2.wait_for_url("**/user*")

        page2.goto(f"{BASE_URL}/user/order")
        time.sleep(1)
        
        # GQ-001 价格阶梯计费: 点击50kg按钮
        page2.locator("button:has-text('50kg')").click()
        # 点击加号9次，让数量到达10
        for _ in range(9):
            page2.locator("button:has-text('+')").click()
        time.sleep(1)
        page2.screenshot(path=f"{OUT_DIR}/图4.7 GQ-001用例执行结果截图.png")
        print("GQ-001 Done")

        # GQ-002 缺失地址拦截
        page2.fill("input[value='北京市朝阳区建国路88号']", "")
        page2.locator("button[type='submit']").click()
        time.sleep(1)
        page2.screenshot(path=f"{OUT_DIR}/图4.8 GQ-002用例执行结果截图.png")
        print("GQ-002 Done")

        # GQ-003 下单成功
        page2.fill("input:near(:text('配送地址'))", "四川省成都市高新区软件园")
        page2.locator("button[type='submit']").click()
        time.sleep(2)
        page2.screenshot(path=f"{OUT_DIR}/图4.9 GQ-003用例执行结果截图.png")
        print("GQ-003 Done")

        # --- DD: 订单调度模块 ---
        page.goto(f"{BASE_URL}/admin/orders")
        time.sleep(2)
        # DD-001 待分配列表
        page.screenshot(path=f"{OUT_DIR}/图4.10 DD-001用例执行结果截图.png")
        print("DD-001 Done")

        # DD-003 重复派单拦截
        try:
            if page.locator("button:has-text('分配订单')").count() > 0:
                page.locator("button:has-text('分配订单')").first.click()
                time.sleep(1)
        except Exception:
            pass
        page.screenshot(path=f"{OUT_DIR}/图4.12 DD-003用例执行结果截图.png")
        print("DD-003 Done")

        # DD-002 配送员联动
        context_d = browser.new_context()
        page3 = context_d.new_page()
        page3.goto(f"{BASE_URL}/login")
        page3.locator("text=配送员 (zhao_q)").click()
        page3.click("button[type='submit']")
        page3.wait_for_url("**/delivery*")
        time.sleep(2)
        page3.screenshot(path=f"{OUT_DIR}/图4.11 DD-002用例执行结果截图.png")
        print("DD-002 Done")

        browser.close()

if __name__ == "__main__":
    run_tests()
