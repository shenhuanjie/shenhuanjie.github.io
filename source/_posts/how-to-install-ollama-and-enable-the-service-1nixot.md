---
title: Linux安装Ollama并启用服务教程
date: '2025-01-09 11:10:16'
updated: '2025-01-09 11:30:30'
excerpt: >-
  本文介绍了在Linux系统上安装和配置Ollama服务的步骤。首先通过一键命令安装Ollama，然后使用systemd创建服务文件并启动服务，并设置开机自启。最后介绍了直接使用ollama命令启动服务的方法，并简要说明了可能遇到的问题及解决方案。
tags:
  - Linux
  - Ollama
  - 安装
  - 服务
  - systemd
permalink: /post/how-to-install-ollama-and-enable-the-service-1nixot.html
comments: true
toc: true
---





### Ollama 官网

　　[https://ollama.com/download/linux](https://ollama.com/download/linux)

### Install with one command:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 使用systemd运行Ollama服务

　　查看 ollama 所在目录

```bash
whereis ollama

# ollama: /usr/local/bin/ollama /usr/local/lib/ollama
```

#### 启动 Ollama 服务

　　**创建systemd服务文件**：

* 在`/etc/systemd/system/`​目录下创建`ollama.service`​文件，内容如下

```service
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_MODELS=/data/ollama/.ollama/models"
ExecStart=/usr/local/bin/ollama serve
User=root
Group=root
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```

　　**启动 Ollama 服务：**

* 重新载入 systemd 配置：

```base
systemctl daemon-reload
```

* 启动服务

```base
systemctl start ollama
```

* 设置开机自启

```base
systemctl enable ollama
```

* 查看服务状态

```bash
systemctl status ollama
```

### 直接使用ollama命令启动服务

* 在安装好Ollama后，直接在命令行中运行：

```bash
ollama serve
```

　　这样Ollama服务就会启动，监听默认端口11434

　　‍

### 可能遇到的问题：

* Ollama 默认是未开启跨域配置的
* Ollama响应速度过慢，CPU 占用过高：那没办法🤡，服务器配置不够而已，哈哈
