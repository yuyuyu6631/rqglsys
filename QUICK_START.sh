#!/bin/bash
# 快速部署命令 - 复制到云服务器执行

# 方式一: 完整自动化安装(推荐 - 适用于全新服务器)
curl -fsSL https://raw.githubusercontent.com/yuyuyu6631/rqglsys/main/install.sh | sudo bash

# 方式二: 已有 Docker 环境
# git clone https://github.com/yuyuyu6631/rqglsys.git && cd rqglsys && chmod +x deploy.sh && ./deploy.sh
