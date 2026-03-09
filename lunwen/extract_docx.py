import docx
import os

def extract_docx_text(file_path):
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        return f"Error reading docx: {str(e)}"

if __name__ == "__main__":
    target_file = r"d:\毕设\rqglsys\lunwen\文档存储地址\第四章 功能测试的设计和实现.docx"
    text = extract_docx_text(target_file)
    with open(r"d:\毕设\rqglsys\lunwen\requirements_temp.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Extraction complete. Text saved to requirements_temp.txt")
