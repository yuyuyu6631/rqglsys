import docx
import os

file_path = r"d:\毕设\rqglsys\lunwen\文档存储地址\5自动化测试的实现.docx"
output_path = r"d:\毕设\rqglsys\lunwen\ch5_content.txt"

doc = docx.Document(file_path)
full_text = []
for para in doc.paragraphs:
    full_text.append(para.text)

with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(full_text))

print(f"提取完成，共{len(full_text)}段，已保存到 {output_path}")
