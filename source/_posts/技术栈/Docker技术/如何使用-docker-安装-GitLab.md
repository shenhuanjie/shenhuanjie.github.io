---
title: 如何使用 Docker 安装 GitLab
date: 2024-01-22 02:18:30
category: 
- 技术栈
tags: 
- Docker
- GitLab
- Git
---
要使用Docker安装GitLab，您可以按照以下步骤进行操作：

1. 首先，确保您已经安装了Docker和Docker Compose。如果您还没有安装，请根据您的操作系统和版本进行安装。
2. 创建一个新的目录来存储GitLab的配置和数据。在命令行中执行以下命令： `mkdir gitlab-data`
3. 创建一个`docker-compose.yml`文件，并将以下内容复制到文件中：

```yaml
version: '3' 
services: gitlab: image: gitlab/gitlab-ce:latest 
restart: always 
ports:
  - 80:80
  - 443:443
volumes:
  - ./gitlab-data/config:/etc/gitlab
  - ./gitlab-data/logs:/var/log/gitlab
  - ./gitlab-data/data:/var/opt/gitlab
```
4. 保存并关闭`docker-compose.yml`文件。
5. 在命令行中，导航到包含`docker-compose.yml`文件的目录。
6. 运行以下命令来启动GitLab容器： `docker-compose up -d`
7. Docker将下载GitLab镜像并启动容器。启动过程可能需要一些时间，具体取决于您的网络速度和计算机性能。
8. 一旦容器启动完成，您可以通过在浏览器中访问`http://localhost`来访问GitLab。您将看到GitLab的安装页面。
9. 按照页面上的指示进行GitLab的初始化设置，包括设置管理员密码和配置GitLab的域名。
10. 完成设置后，您现在可以使用Docker安装的GitLab了。

请注意，这只是一个基本的示例，您可以根据需要进行更多的自定义配置，例如更改端口号或将GitLab连接到外部数据库。有关更多详细信息，请参阅GitLab的官方文档和Docker的文档。


