---
title: 使用 docker 快速搭建 minecraft-server 服务器
published: 2024-06-06T03:29:14.000Z
updated: 2024-06-06T09:00:42.000Z
draft: false
description: ''
tags: []
category: ''
---

```sh
docker run -d -it --name minecraft-server -p 25565:25565 -e EULA=TRUE -v /home/minecraft/data:/data itzg/minecraft-server
```

```sh
docker run -d -it --name minecraft-server -p 25565:25565 itzg/minecraft-server
```

## 参考文档

* https://docker-minecraft-server.readthedocs.io/en/latest/

‍
