---
title: 如何在 LobeChat 中使用 Ollama
date: '2025-01-08 16:13:20'
updated: '2025-01-08 16:38:13'
excerpt: >-
  本文介绍了如何在LobeChat中使用Ollama框架运行本地大型语言模型。文章详细说明了在macOS、Windows和Linux操作系统下安装和配置Ollama的步骤，并指导用户如何通过Docker容器部署Ollama。此外，文章还介绍了如何在LobeChat中安装和选择Ollama模型进行对话。
tags:
  - LobeChat
  - Ollama
  - Docker
  - LLM
  - 集成
permalink: /post/use-ollama-in-lobechat-2t1bxl.html
comments: true
toc: true
---



![image](https://qiniu.skyner.cn/f579b39b-e771-402c-a1d1-620e57a10c75)



​![image](https://qiniu.skyner.cn/f579b39b-e771-402c-a1d1-620e57a10c75)​

　　Ollama 是一款强大的本地运行大型语言模型（LLM）的框架，支持多种语言模型，包括 Llama 2, Mistral 等。现在，LobeChat 已经支持与 Ollama 的集成，这意味着你可以在 LobeChat 中轻松使用 Ollama 提供的语言模型来增强你的应用。

　　本文档将指导你如何在 LobeChat 中使用 Ollama：

## 在 macOS 下使用 Ollama

### 本地安装 Ollama

　　[下载 Ollama for macOS](https://ollama.com/download?utm_source=lobehub&utm_medium=docs&utm_campaign=download-macos "https://ollama.com/download?utm_source=lobehub&utm_medium=docs&utm_campaign=download-macos") 并解压、安装。

### 配置 Ollama 允许跨域访问

　　由于 Ollama 的默认参数配置，启动时设置了仅本地访问，所以跨域访问以及端口监听需要进行额外的环境变量设置 `OLLAMA_ORIGINS`​。使用 `launchctl`​ 设置环境变量：

```shell
launchctl setenv OLLAMA_ORIGINS "*"
```

　　完成设置后，需要重启 Ollama 应用程序。

### 在 LobeChat 中与本地大模型对话

　　接下来，你就可以使用 LobeChat 与本地 LLM 对话了。

​![在 LobeChat 中与 llama3 对话](https://github.com/lobehub/lobe-chat/assets/28616219/7f9a9a9f-fd91-4f59-aac9-3f26c6d49a1e)​

## 在 windows 下使用 Ollama

### 本地安装 Ollama

　　[下载 Ollama for Windows](https://ollama.com/download?utm_source=lobehub&utm_medium=docs&utm_campaign=download-windows "https://ollama.com/download?utm_source=lobehub&utm_medium=docs&utm_campaign=download-windows") 并安装。

### 配置 Ollama 允许跨域访问

　　由于 Ollama 的默认参数配置，启动时设置了仅本地访问，所以跨域访问以及端口监听需要进行额外的环境变量设置 `OLLAMA_ORIGINS`​。

　　在 Windows 上，Ollama 继承了您的用户和系统环境变量。

1. 首先通过 Windows 任务栏点击 Ollama 退出程序。
2. 从控制面板编辑系统环境变量。
3. 为您的用户账户编辑或新建 Ollama 的环境变量 `OLLAMA_ORIGINS`​，值设为 `*`​ 。
4. 点击 `OK/应用`​ 保存后重启系统。
5. 重新运行 `Ollama`​。

### 在 LobeChat 中与本地大模型对话

　　接下来，你就可以使用 LobeChat 与本地 LLM 对话了。

## 在 linux 下使用 Ollama

### 本地安装 Ollama

　　通过以下命令安装：

```shell
curl -fsSL https://ollama.com/install.sh | sh
```

　　或者，你也可以参考 [Linux 手动安装指南](https://github.com/ollama/ollama/blob/main/docs/linux.md "https://github.com/ollama/ollama/blob/main/docs/linux.md")。

### 配置 Ollama 允许跨域访问

　　由于 Ollama 的默认参数配置，启动时设置了仅本地访问，所以跨域访问以及端口监听需要进行额外的环境变量设置 `OLLAMA_ORIGINS`​。如果 Ollama 作为 systemd 服务运行，应该使用 `systemctl`​设置环境变量：

1. 通过调用 `sudo systemctl edit ollama.service`​ 编辑 systemd 服务。

```shell
sudo systemctl edit ollama.service
```

2. 对于每个环境变量，在 `[Service]`​ 部分下添加 `Environment`​：

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
```

3. 保存并退出。
4. 重载 `systemd`​ 并重启 Ollama：

```shell
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### 在 LobeChat 中与本地大模型对话

　　接下来，你就可以使用 LobeChat 与本地 LLM 对话了。

## 使用 docker 部署使用 Ollama

### 拉取 Ollama 镜像

　　如果你更倾向于使用 Docker，Ollama 也提供了官方 Docker 镜像，你可以通过以下命令拉取：

```shell
docker pull ollama/ollama
```

### 配置 Ollama 允许跨域访问

　　由于 Ollama 的默认参数配置，启动时设置了仅本地访问，所以跨域访问以及端口监听需要进行额外的环境变量设置 `OLLAMA_ORIGINS`​。

　　如果 Ollama 作为 Docker 容器运行，你可以将环境变量添加到 `docker run`​ 命令中。

```shell
docker run -d --gpus=all -v ollama:/root/.ollama -e OLLAMA_ORIGINS="*" -p 11434:11434 --name ollama ollama/ollama
```

### 在 LobeChat 中与本地大模型对话

　　接下来，你就可以使用 LobeChat 与本地 LLM 对话了。

## 安装 Ollama 模型

　　Ollama 支持多种模型，你可以在 [Ollama Library](https://ollama.com/library "https://ollama.com/library") 中查看可用的模型列表，并根据需求选择合适的模型。

### LobeChat 中安装

　　在 LobeChat 中，我们默认开启了一些常用的大语言模型，例如 llama3、 Gemma 、 Mistral 等。当你选中模型进行对话时，我们会提示你需要下载该模型。

​![LobeChat 提示安装 Ollama 模型](https://github.com/lobehub/lobe-chat/assets/28616219/4e81decc-776c-43b8-9a54-dfb43e9f601a)​

　　下载完成后即可开始对话。

### 用 Ollama 拉取模型到本地

　　当然，你也可以通过在终端执行以下命令安装模型，以 llama3 为例：

```shell
ollama pull llama3
```

## 自定义配置

　　你可以在 `设置`​ -\> `语言模型`​ 中找到 Ollama 的配置选项，你可以在这里配置 Ollama 的代理、模型名称等。

​![Ollama 服务商设置](https://github.com/lobehub/lobe-chat/assets/28616219/54b3696b-5b13-4761-8c1b-1e664867b2dd)​

　　你可以前往 [与 Ollama 集成](http://localhost:3210/zh/docs/self-hosting/examples/ollama "http://localhost:3210/zh/docs/self-hosting/examples/ollama") 了解如何部署 LobeChat ，以满足与 Ollama 的集成需求。
