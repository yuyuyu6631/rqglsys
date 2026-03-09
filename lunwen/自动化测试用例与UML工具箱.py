import os
import re
import base64
import json
import requests
import pandas as pd
import tkinter as tk
from tkinter import messagebox, filedialog, ttk
from tkinter.scrolledtext import ScrolledText

# ==========================================
# 工具特性：
# 1. 自动调用AI接口一键生成 Markdown
# 2. 自动把 Markdown 的表格提取为 Excel (.xlsx格式，方便调整格式大小)
# 3. 自动把 Mermaid 代码渲染并下载为高分辨率 PNG (解决 Word 中 SVG 文字丢失问题)
# 4. 支持【横向/纵向】一键转换，解决论文中流程图过长占页面的问题
# ==========================================

class GeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("燃气管理系统 - 测试用例与UML一键生成工具")
        self.root.geometry("800x650")

        # --- 第一部分：API 配置 ---
        param_frame = tk.LabelFrame(root, text="第一步：选择导出或自动生成", padx=10, pady=10)
        param_frame.pack(fill="x", padx=10, pady=5)

        tk.Label(param_frame, text="你可以直接在下方粘贴已有的Markdown内容并点击【仅导出表格及图片】；\n如果想要调用AI全自动生成，请在此填写接口配置（如不自动生成可留空）。", fg="gray", justify="left").grid(row=0, column=0, columnspan=2, sticky="w")
        
        tk.Label(param_frame, text="API Key:").grid(row=1, column=0, sticky="w", pady=5)
        self.api_key_var = tk.StringVar()
        tk.Entry(param_frame, textvariable=self.api_key_var, width=50).grid(row=1, column=1, sticky="w", pady=5)

        tk.Label(param_frame, text="API URL:").grid(row=2, column=0, sticky="w", pady=5)
        self.api_url_var = tk.StringVar(value="https://api.deepseek.com/chat/completions") 
        tk.Entry(param_frame, textvariable=self.api_url_var, width=50).grid(row=2, column=1, sticky="w", pady=5)

        tk.Label(param_frame, text="网络代理:").grid(row=3, column=0, sticky="w", pady=5)
        self.proxy_var = tk.StringVar(value="") 
        tk.Entry(param_frame, textvariable=self.proxy_var, width=50).grid(row=3, column=1, sticky="w", pady=5)
        tk.Label(param_frame, text="(例如 http://127.0.0.1:7890，留空则不使用)", fg="gray").grid(row=4, column=1, sticky="w")

        # --- 新增：UML 导出设置 ---
        uml_frame = tk.LabelFrame(root, text="UML 导出优化（专为论文排版设计）", padx=10, pady=5)
        uml_frame.pack(fill="x", padx=10, pady=5)

        self.compact_var = tk.BooleanVar(value=True)
        tk.Checkbutton(uml_frame, text="强制横向布局 (解决流程图太长占整页的问题)", variable=self.compact_var).pack(side="left", padx=5)

        tk.Label(uml_frame, text="高画质PNG缩放:").pack(side="left", padx=5)
        self.scale_var = tk.DoubleVar(value=3.0)
        self.scale_spin = tk.Spinbox(uml_frame, from_=1.0, to=8.0, increment=0.5, textvariable=self.scale_var, width=5)
        self.scale_spin.pack(side="left", padx=5)
        tk.Label(uml_frame, text="(Word排版建议调大缩放值，不用SVG避免丢字)").pack(side="left", padx=5)

        # --- 第二部分：输入与生成 ---
        input_frame = tk.LabelFrame(root, text="第二步：输入模块描述 / Markdown 内容", padx=10, pady=10)
        input_frame.pack(fill="both", expand=True, padx=10, pady=5)

        self.text_area = ScrolledText(input_frame, height=15)
        self.text_area.pack(fill="both", expand=True)

        # --- 第三部分：操作按钮 ---
        btn_frame = tk.Frame(root)
        btn_frame.pack(fill="x", padx=10, pady=10)

        tk.Button(btn_frame, text="一键要求AI生成并导出", command=self.generate_from_ai, bg="#4CAF50", fg="white", font=("Arial", 10, "bold")).pack(side="left", padx=5)
        tk.Button(btn_frame, text="（已有文本）仅导出表格和图片", command=self.export_assets, bg="#2196F3", fg="white", font=("Arial", 10, "bold")).pack(side="left", padx=5)
        
        self.status_var = tk.StringVar(value="就绪")
        tk.Label(root, textvariable=self.status_var, fg="blue").pack(side="bottom", anchor="w", padx=10, pady=5)

    def generate_from_ai(self):
        module_name = self.text_area.get("1.0", tk.END).strip()
        api_key = self.api_key_var.get().strip()
        api_url = self.api_url_var.get().strip()

        if not module_name:
            messagebox.showwarning("警告", "请先在文本框输入模块功能描述！")
            return
        if not api_key:
            messagebox.showwarning("警告", "自动生成需要配置 API Key！")
            return

        self.status_var.set("正在调用AI接口中，请稍候...")
        self.root.update()

        prompt = f"""你现在是“燃气管理系统测试用例 & UML 一键生成器”，专为本科毕业论文《软件测试技术在燃气管理系统中的应用》服务。
你的唯一任务是：根据用户提供的模块/功能描述，快速生成两类内容：
1. 三线表格式的功能测试用例表（必须严格使用 Markdown 三线表，包含:测试点|用例标题|前提条件|测试步骤|期望结果|实际结果|测试结果|备注）
2. 对应的 UML 图（优先使用 Mermaid 语法），标题包含“### 图 x.x 某模块 用例图（Mermaid）”
用户描述的模块是：{module_name}

【论文排版特别要求】：
- 所有的流程图/活动图尽量使用横向布局(LR)，减少垂直空间占用。
- 逻辑清晰，Actor命名专业。
"""
        try:
            proxies = None
            if self.proxy_var.get().strip():
                p = self.proxy_var.get().strip()
                proxies = {"http": p, "https": p}

            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}]
            }
            resp = requests.post(api_url, json=payload, headers=headers, proxies=proxies, timeout=60)
            if resp.status_code == 200:
                result = resp.json()
                content = result['choices'][0]['message']['content']
                self.text_area.delete("1.0", tk.END)
                self.text_area.insert("1.0", content)
                self.status_var.set("AI 生成成功！开始自动导出文件...")
                self.root.update()
                self.export_assets()
            else:
                messagebox.showerror("API 错误", f"请求失败: {resp.status_code}\n{resp.text}")
                self.status_var.set("接口调用失败。")
        except Exception as e:
            messagebox.showerror("异常", f"调用过程中发生错误: {str(e)}")
            self.status_var.set("发生异常。")

    def export_assets(self):
        content = self.text_area.get("1.0", tk.END)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        out_dir = os.path.join(base_dir, '自动生成归档')
        os.makedirs(out_dir, exist_ok=True)

        self.status_var.set("正在解析 Markdown，提取表格与渲染图片...")
        self.root.update()

        sections = re.split(r'###\s+', content)
        csv_count = 0
        img_count = 0

        for sec in sections:
            if not sec.strip(): continue
            lines = sec.strip().split('\n')
            
            # 清理标题里的特殊符号作为文件名
            raw_title = lines[0].strip()
            title = re.sub(r'[\\/:*?"<>|]', '_', raw_title)
            title = title.replace('（', '_').replace('）', '_').strip('_')
            
            # 1. 转换表格 (Markdown -> Excel)
            table_match = re.search(r'(\|.*\|[\r\n]+\|[-| \t:]+\|[\r\n]+(\|.*\|[\r\n]*)+)', sec)
            if table_match:
                table_str = table_match.group(1)
                rows = []
                for line in table_str.strip().split('\n'):
                    line = line.strip()
                    if not line: continue
                    # 忽略表头下面那行分割线
                    if re.match(r'^\|[-\s|:]+\|$', line): continue
                    # 提取每格数据
                    cells = [c.strip() for c in line.split('|')][1:-1]
                    rows.append(cells)
                
                if len(rows) > 1:
                    excel_path = os.path.join(out_dir, f"{title}.xlsx")
                    try:
                        df = pd.DataFrame(rows[1:], columns=rows[0])
                        df.to_excel(excel_path, index=False)
                        csv_count += 1
                    except Exception as e:
                        print(f"导出Excel失败: {e}")

            # 2. 转换 Mermaid (Mermaid 代码 -> PNG/SVG API调用)
            mermaid_match = re.search(r'```mermaid\s*(.*?)\s*```', sec, re.DOTALL)
            if mermaid_match:
                mermaid_code = mermaid_match.group(1).strip()
                
                # 如果开启了紧凑模式，将 TD/TB 替换为 LR
                if self.compact_var.get():
                    mermaid_code = re.sub(r'graph\s+TD', 'graph LR', mermaid_code, flags=re.I)
                    mermaid_code = re.sub(r'graph\s+TB', 'graph LR', mermaid_code, flags=re.I)
                    mermaid_code = re.sub(r'flowchart\s+TD', 'flowchart LR', mermaid_code, flags=re.I)
                    mermaid_code = re.sub(r'flowchart\s+TB', 'flowchart LR', mermaid_code, flags=re.I)

                try:
                    proxies = None
                    if self.proxy_var.get().strip():
                        p = self.proxy_var.get().strip()
                        proxies = {"http": p, "https": p}

                    graphbytes = mermaid_code.encode("utf-8")
                    base64_bytes = base64.urlsafe_b64encode(graphbytes)
                    base64_string = base64_bytes.decode("ascii")
                    
                    # 仅下载高分辨率 PNG (增加 width 确保 scale 参数生效)
                    scale = self.scale_var.get()
                    png_url = f"https://mermaid.ink/img/{base64_string}?theme=default&width=1200&scale={scale}"
                    
                    # 导出 PNG (增加超时到60s)
                    png_resp = requests.get(png_url, proxies=proxies, timeout=60)
                    if png_resp.status_code == 200:
                        png_path = os.path.join(out_dir, f"{title}.png")
                        with open(png_path, 'wb') as img_f:
                            img_f.write(png_resp.content)
                        img_count += 1
                    else:
                        print(f"mermaid.ink 失败: {png_resp.status_code}，尝试 kroki.io...")
                        import zlib
                        compressed = zlib.compress(graphbytes, 9)
                        kroki_b64 = base64.urlsafe_b64encode(compressed).decode('ascii')
                        kroki_url = f"https://kroki.io/mermaid/png/{kroki_b64}"
                        fallback_resp = requests.get(kroki_url, proxies=proxies, timeout=60)
                        if fallback_resp.status_code == 200:
                            png_path = os.path.join(out_dir, f"{title}.png")
                            with open(png_path, 'wb') as img_f:
                                img_f.write(fallback_resp.content)
                            img_count += 1
                        else:
                            print(f"kroki.io 返回错误: {fallback_resp.status_code}")
                    
                    # SVG在Word中存在兼容性bug，不再下载，统一使用PNG
                except Exception as e:
                    print(f"请求生成图片接口失败: {e}")

        msg = f"导出完成！\n提取并存储表格数：{csv_count} 个 (.xlsx)\n生成高质量UML图片数：{img_count} 个 (.png)\n文件保存在：{out_dir}"
        self.status_var.set("处理完毕！")
        messagebox.showinfo("处理成功", msg)

if __name__ == "__main__":
    root = tk.Tk()
    app = GeneratorApp(root)
    root.mainloop()
