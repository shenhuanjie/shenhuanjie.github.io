---
title: Halo 开发者指南——项目运行、构建
date: '2024-09-14 16:26:11'
updated: '2024-09-14 16:36:24'
tags:
  - Halo
  - Git
  - OpenJDK
  - Node.js
  - IDEA
  - pnpm
  - Docker
permalink: /post/halo-developer-guide-project-operation-and-construction-25nflu.html
comments: true
toc: true
---

# 准备工作

## 环境要求

* [OpenJDK 17 LTS](https://github.com/openjdk/jdk)
* [Node.js 20 LTS](https://nodejs.org/)
* [pnpm 9](https://pnpm.io/)
* [IntelliJ IDEA](https://www.jetbrains.com/idea/)
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/)（可选）

## 名词解释

### 工作目录

指 Halo 所依赖的工作目录，在 Halo 运行的时候会在系统当前用户目录下产生一个 halo-next 的文件夹，绝对路径为 \~/halo-next。里面通常包含下列目录或文件：

1. ​`db`​：存放 H2 Database 的物理文件，如果你使用其他数据库，那么不会存在这个目录。
2. ​`themes`​：里面包含用户所安装的主题。
3. ​`plugins`​：里面包含用户所安装的插件。
4. ​`attachments`​：附件目录。
5. ​`logs`​：运行日志目录。

---

# 开发环境运行

## 项目结构说明

目前如果需要完整的运行 Halo，总共需要三个部分：

1. Halo 主项目（[halo-dev/halo](https://github.com/halo-dev/halo)）
2. UI，包括 Console 控制台和 UC 个人中心（托管在 Halo 主项目）
3. 主题（Halo 主项目内已包含默认主题）

> **说明**
>
> 从 Halo 2.11 开始，Halo 项目的 `ui`​ 目录同时包含了 Console（管理控制台）和 UC（个人中心），以下统称为 UI。
>
> 当前 Halo 主项目并不会将 UI 的构建资源托管到 Git 版本控制，所以在开发环境是需要同时运行 UI 项目的。当然，在我们的最终发布版本的时候会在 CI 中自动构建 UI 到 Halo 主项目。

## 克隆项目

如果你已经 Fork 了相关仓库，请将以下命令中的 `halo-dev`​ 替换为你的 GitHub 用户名。

```bash
git clone https://github.com/halo-dev/halo

# 或者使用 ssh 的方式 clone（推荐）
# git clone git@github.com:halo-dev/halo.git

# 或者使用 GitHub CLI 克隆（推荐）
# gh repo clone halo-dev/halo 

# 或者使用 GitHub CLI Fork（推荐）
# gh repo fork halo-dev/halo
```

## 运行 UI 服务

```bash
cd path/to/halo/ui
pnpm install
pnpm build:packages
pnpm dev
```

最终控制台打印了如下信息即代表运行正常：

```bash
VITE v4.2.3  ready in 638 ms

# Console 控制台服务
➜  Local:   http://localhost:3000/console/

# UC 个人中心服务
➜  Local:   http://localhost:4000/uc/
```

> 请不要直接使用 UI 的运行端口（3000 / 4000）访问，会因为跨域问题导致无法正常登录，建议按照后续的步骤以 dev 的配置文件运行 Halo，在 dev 的配置文件中，我们默认代理了 UI 页面的访问地址，所以后续访问 UI 页面使用 `http://localhost:8090/console`​ 和 `http://localhost:8090/uc`​ 访问即可，代理的相关配置：
>
> ```yml
> halo:
>   console:
>     proxy:
>       endpoint: http://localhost:3000/
>       enabled: true
>   uc:
>     proxy:
>       endpoint: http://localhost:4000/
>       enabled: true
> ```

## 运行 Halo

1. 在 IntelliJ IDEA 中打开 Halo 项目，等待 Gradle 初始化和依赖下载完成。
2. 下载预设插件（可选）

    ```bash
    # Windows
    ./gradlew.bat downloadPluginPresets

    # macOS / Linux
    ./gradlew downloadPluginPresets
    ```
3. 修改 IntelliJ IDEA 的运行配置

    * Windows  
      将 Active Profiles 改为 `dev,win`​，如图所示：  
      ​![IntelliJ IDEA Profiles](https://qiniu.skyner.cn/IntelliJ-IDEA-Profiles-Win-68071f7bc26ca3f5be42a475597e2e3e.png)​
    * macOS / Linux  
      将 Active Profiles 改为 `dev`​，如图所示：  
      ​![IntelliJ IDEA Profiles](https://qiniu.skyner.cn/IntelliJ-IDEA-Profiles-macOS-9d5469314ee5d8703a11da404399c1b8.png)​
4. 点击 IntelliJ IDEA 的运行按钮，等待项目启动完成。
5. 或者使用 Gradle 运行

    ```bash
    # macOS / Linux
    ./gradlew bootRun --args="--spring.profiles.active=dev"

    # Windows
    gradlew.bat bootRun --args="--spring.profiles.active=dev,win"
    ```
6. 最终提供以下访问地址：

    1. 网站首页：[http://localhost:8090](http://localhost:8090/)
    2. Console 控制台：[http://localhost:8090/console](http://localhost:8090/console)
    3. UC 个人中心：[http://localhost:8090/uc](http://localhost:8090/uc)

---

# 构建

一般情况下，为了保证版本一致性和可维护性，我们并不推荐自行构建和二次开发。

## 构建 Docker 镜像

一般情况下，为了保证版本一致性和可维护性，我们并不推荐自行构建和二次开发。

## 克隆项目

如果你已经 Fork 了相关仓库，请将以下命令中的 `halo-dev`​ 替换为你的 GitHub 用户名。

```bash
git clone https://github.com/halo-dev/halo

# 或者使用 ssh 的方式 clone（推荐）
# git clone git@github.com:halo-dev/halo.git

# 或者使用 GitHub CLI 克隆（推荐）
# gh repo clone halo-dev/halo 

# 或者使用 GitHub CLI Fork（推荐）
# gh repo fork halo-dev/halo

cd halo

# 切换到特定的分支或标签，请替换 ${branch_name}
git checkout ${branch_name}
```

## 构建 Fat Jar

构建之前需要修改 `gradle.properties`​ 中的 `version`​ 属性（推荐遵循 [SemVer 规范](https://semver.org/)），例如：`version=2.19.0`​

```bash
cd path/to/halo
```

下载预设插件（可选）：

```bash
# Windows
./gradlew.bat downloadPluginPresets

# macOS / Linux
./gradlew downloadPluginPresets
```

构建：

```bash
# Windows
./gradlew.bat clean build -x check

# macOS / Linux
./gradlew clean build -x check
```

构建完成之后，在 Halo 项目下产生的 `application/build/libs/halo-${version}.jar`​ 即为构建完成的文件。

最终部署文档可参考：[使用 JAR 文件部署](https://docs.halo.run/getting-started/install/jar-file)。

## 构建 Docker 镜像

在此之前，请确认已经构建好了 Fat Jar。

```bash
cd path/to/halo
```

```bash
# 请替换 ${tag_name}
docker build -t halo-dev/halo:${tag_name} .
```

```bash
# 插件构建完成的版本
docker images | grep halo
```

最终部署文档可参考：[使用 Docker Compose 部署](https://docs.halo.run/getting-started/install/docker-compose)。

在此之前，请确认已经构建好了 Fat Jar。

```powershell
cd path/to/halo
```

```powershell
# 请替换 ${tag_name}
docker build -t halo-dev/halo:${tag_name} .
```

```powershell
# 插件构建完成的版本
docker images | grep halo
```

最终部署文档可参考：[使用 Docker Compose 部署](https://docs.halo.run/getting-started/install/docker-compose)。

---

原文链接：[https://docs.halo.run/category/系统开发](https://docs.halo.run/category/%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91)

‍
