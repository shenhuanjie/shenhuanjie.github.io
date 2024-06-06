---
title: 使用 docker 快速搭建 minecraft-server 服务器
date: '2024-06-06 11:29:14'
updated: '2024-06-06 17:00:42'
permalink: /post/use-docker-to-quickly-build-a-minecraftserver-server-n3yoi.html
comments: true
toc: true
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
