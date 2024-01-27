---
title: Docker：安装 ezOne 免费版
date: 2024-01-28 01:24:14
category:
  - Docker
  - DevOps
tags:
  - Docker
  - ezOne
  - DevOps
  - Git
---

## 安装步骤

- 使用当前路径作为 data 持久化目录
- EZONE_URL 为本机IP地址

```shell
docker run -itd -p 80:80 -p 8188:8188 -e EZONE_URL=192.168.0.105 
-v ${pwd}/data/ezone/logs:/root/logs 
-v ${pwd}/data/ezone/mysql:/data/mysql 
-v ${pwd}/data/ezone/redis:/data/redis 
-v ${pwd}/data/ezone/elasticsearch:/data/elasticsearch 
-v ${pwd}/data/ezone/avatar:/data/base/avatar 
-v ${pwd}/data/ezone/repos:/data/ezcode/repos 
-v ${pwd}/data/ezone/cilog:/app/data/cilog 
-v ${pwd}/data/ezone/reports:/app/data/reports 
-v ${pwd}/data/ezone/pkg:/data/pkg 
-v ${pwd}/data/ezone/attachment:/app/storage 
--privileged=true --restart always --name ezone-all hub.kce.ksyun.com/ezone-public/ezone-all:0.0.0.1258.1
```

```shell
# 单条sh命令
docker run -itd -p 80:80 -p 8188:8188 -e EZONE_URL=192.168.0.105 -v ${pwd}/data/ezone/logs:/root/logs -v ${pwd}/data/ezone/mysql:/data/mysql -v ${pwd}/data/ezone/redis:/data/redis -v ${pwd}/data/ezone/elasticsearch:/data/elasticsearch -v ${pwd}/data/ezone/avatar:/data/base/avatar -v ${pwd}/data/ezone/repos:/data/ezcode/repos -v ${pwd}/data/ezone/cilog:/app/data/cilog -v ${pwd}/data/ezone/reports:/app/data/reports -v ${pwd}/data/ezone/pkg:/data/pkg -v ${pwd}/data/ezone/attachment:/app/storage --privileged=true --restart always --name ezone-all hub.kce.ksyun.com/ezone-public/ezone-all:0.0.0.1258.1
```
