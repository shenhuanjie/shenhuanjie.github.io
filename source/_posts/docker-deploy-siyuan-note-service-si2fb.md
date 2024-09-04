---
title: Docker 部署 Siyuan 笔记服务
date: '2024-09-04 19:10:31'
updated: '2024-09-05 00:23:37'
tags:
  - Docker
  - Siyuan
permalink: /post/docker-deploy-siyuan-note-service-si2fb.html
comments: true
toc: true
---

> 源文地址：[https://skyner.cn/archives/docker-deploy-siyuan-note-service-si2fb](https://skyner.cn/archives/docker-deploy-siyuan-note-service-si2fb)

使用 docker compose.yml 

```yaml
version: "3.9"
services:
  main:
    image: b3log/siyuan
    command: ['--workspace=/siyuan/workspace/', '--accessAuthCode=xxxxxxxxx']
    user: '1000:1000'
    ports:
      - 6806:6806
    volumes:
      - /data/siyuan/data:/siyuan/workspace
    restart: always
    environment:
      - TZ=Asia/Shanghai
```

```yaml
docker compose up -d
docker compose restart
```

对目录进行赋权

```yaml
chown -R 1000:1000 /data/siyuan/data
```

TIP：nginx需要配置/ws websocket代理

```yaml
server {
    listen 80;
    server_name note.skyner.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name note.skyner.cn;

    ssl_certificate /etc/nginx/cert/star.skyner.cn_cert.pem;
    ssl_certificate_key /etc/nginx/cert/star.skyner.cn_key.key;

    location / {
        proxy_pass http://localhost:6806;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:6806/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

原文参考：[https://github.com/siyuan-note/siyuan/blob/master/README_zh_CN.md](https://github.com/siyuan-note/siyuan/blob/master/README_zh_CN.md#docker-%E9%83%A8%E7%BD%B2)
