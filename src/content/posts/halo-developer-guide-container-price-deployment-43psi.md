---
title: Halo 开发者指南——容器私有化部署
published: 2024-09-14T08:52:01.000Z
updated: 2024-09-14T08:56:19.000Z
draft: false
description: ''
tags:
  - Docker
  - Halo
  - 华为云
  - SWR
  - Registry
category: ''
---

# 华为云SWR私有化部署

### 镜像构建

```powershell
docker build -t halo-dev/halo:2.20.0 .
```

### 上传镜像

镜像标签

```powershell
sudo docker tag {镜像名称}:{版本名称} swr.cn-south-1.myhuaweicloud.com/{组织名称}/{镜像名称}:{版本名称}
```

```powershell
sudo docker tag halo-dev/halo:2.20.0 swr.cn-south-1.myhuaweicloud.com/shenhuanjie/halo-dev/halo:2.20.0
```

上传镜像

```powershell
sudo docker push swr.cn-south-1.myhuaweicloud.com/{组织名称}/{镜像名称}:{版本名称}
```

```powershell
sudo docker push swr.cn-south-1.myhuaweicloud.com/shenhuanjie/halo-dev/halo:2.20.0
```

## 下载镜像

```powershell
sudo docker pull swr.cn-south-1.myhuaweicloud.com/{组织名称}/{镜像名称}:{版本名称}
```

## 其他方案（待完善）

‍
