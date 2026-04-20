---
title: GitHub Actions 如何将 Node 项目打包成 Docker 镜像并自动推送
date: '2026-04-20 19:33:36'
updated: '2026-04-20 19:33:36'
permalink: /post/github-actions-build-and-push-node-docker-image.html
categories:
  - Docker
  - DevOps
tags:
  - GitHub Actions
  - Docker
  - Node.js
  - CI/CD
  - GHCR
comments: true
toc: true
---

最近整理一段 ChatGPT 分享对话时，里面有个很常见的问题：

> GitHub Actions 是否支持将 Node 项目打包成 Docker 镜像？

答案是支持，而且这正是 GitHub Actions 很常见的一种使用方式。  
本质上就是把原来你手动执行的这几步放到 CI 里：

1. 拉取代码
2. 登录镜像仓库
3. 执行 `docker build`
4. 执行 `docker push`

如果你希望在代码推送后自动完成镜像构建和发布，这套方式非常适合。

## 核心流程

整个流程可以理解为：

1. 代码推送到 GitHub
2. GitHub Actions 被触发
3. Runner 中执行 Docker 构建
4. 将镜像推送到 Docker Hub、GHCR 或其他私有镜像仓库

对于 Node 项目来说，只要你本地能通过 `Dockerfile` 正常构建，GitHub Actions 就能帮你自动化完成后续流程。

## 先准备好 Dockerfile

在项目根目录中准备一个 `Dockerfile`，下面是一份适合大多数 Node 服务项目的基础示例：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

如果你的项目使用的是 `pnpm`、`yarn`、`npm run build`，或者需要多阶段构建，那就根据项目实际情况调整。

## 最小可用的 GitHub Actions 工作流

在项目中创建文件：

```text
.github/workflows/docker.yml
```

然后写入下面这份工作流：

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: yourname/your-app:latest
```

这份配置的意思非常直接：

- `push` 到 `main` 分支时触发
- 拉取当前仓库代码
- 登录 Docker Hub
- 构建镜像并推送

## 必须配置的 Secrets

如果你使用 Docker Hub，那么还需要到仓库里配置 Actions Secrets：

```text
Settings -> Secrets and variables -> Actions
```

至少需要两个：

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

没有这两个变量，工作流无法完成登录，自然也就没法推送镜像。

## 推荐做法：同时打多个 Tag

实际项目里，只打一个 `latest` 往往不够。更常见的做法是同时打上：

- `latest`
- commit SHA
- 版本号

例如：

```yaml
tags: |
  yourname/your-app:latest
  yourname/your-app:${{ github.sha }}
```

这样做的好处是：

- `latest` 用于默认部署
- `github.sha` 用于问题追溯
- 回滚时更方便定位具体镜像版本

## 推荐使用 GHCR

如果你本来就在 GitHub 上托管代码，那么 GitHub Container Registry（GHCR）通常会比 Docker Hub 更顺手一些。

下面是一份 GHCR 版本的登录和推送示例：

```yaml
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and Push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/yourname/your-app:latest
```

相比 Docker Hub，GHCR 的几个优点很明显：

- 和 GitHub 仓库权限体系一致
- 不需要额外维护 Docker Hub 账号密码
- 对 GitHub 原生项目更友好

## 多架构镜像也能一起做

如果你后续要跑在不同平台上，比如：

- 普通云服务器
- ARM 设备
- NAS
- 树莓派

那么可以直接在工作流里开启多架构构建：

```yaml
platforms: linux/amd64,linux/arm64
```

这一步通常会和 `buildx` 一起使用，用来一次性生成多架构镜像。

## 别忘了写 .dockerignore

很多人第一次接 CI 打包时，最容易忽略的是 `.dockerignore`。

建议至少加上这些内容：

```text
node_modules
.git
```

这样可以避免：

- 本地依赖目录被误打进镜像
- Git 元数据进入构建上下文
- 构建变慢、镜像变大

## 常见坑

### 1. 构建很慢

常见原因有两个：

- 构建上下文太大
- 没有使用缓存

后续可以再加 `buildx cache` 优化构建速度。

### 2. 私有 npm 源无法安装依赖

如果你的项目依赖私有 npm 包，通常需要：

- `.npmrc`
- 对应的 token

否则 GitHub Actions 在 `npm install` 时会直接失败。

### 3. Docker Hub 推送速度慢

如果网络环境对 Docker Hub 不够友好，推送经常会变慢甚至失败。

这时更稳妥的选择通常是：

- GHCR
- 阿里云 ACR
- 其他更接近部署环境的私有镜像仓库

## 一句话总结

GitHub Actions 完全可以把 Node 项目自动打包成 Docker 镜像。  
本质上就是让 CI 帮你执行：

```bash
docker build
docker push
```

一旦把 `Dockerfile`、工作流和仓库密钥配置好，后面每次推送代码都可以自动完成镜像构建和发布。

## 参考

- 原始对话分享：<https://chatgpt.com/share/69e60e30-9160-839a-8574-133bfcd000ca>
