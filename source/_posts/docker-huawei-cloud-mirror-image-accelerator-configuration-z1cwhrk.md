---
title: Docker 华为云镜像加速器配置
date: '2024-09-14 15:45:29'
updated: '2024-09-14 15:53:11'
tags:
  - Docker
  - 镜像加速
  - 华为云
permalink: /post/docker-huawei-cloud-mirror-image-accelerator-configuration-z1cwhrk.html
comments: true
toc: true
---

​![image](https://qiniu.skyner.cn/image-20240914154934-s5n2x3q.png)​

## 操作说明

###### 1. 安装/升级容器引擎客户端

推荐安装1.11.2以上版本的容器引擎客户端

###### 2. 加速器地址

* 访问华为云容器镜像服务：https://console.huaweicloud.com/swr/

* 获取加速器地址

```yaml
https://xxxxxxxxx.mirror.swr.myhuaweicloud.com
```

###### 3. 配置镜像加速器

针对容器引擎客户端版本大于 1.11.2 的用户

以root用户登录容器引擎所在的虚拟机

修改“`/etc/docker/daemon.json`​”文件（如果没有，可以手动创建），在该文件内添加如下内容：

```yaml
{
    "registry-mirrors": [ "https://xxxxxxxxx.mirror.swr.myhuaweicloud.com" ]
}
```

按“Esc”，输入 **:wq**保存并退出。

###### 4. 重启容器引擎

配置完成后，执行**​`systemctl restart docker`​**​重启容器引擎。 如果重启失败，则检查操作系统其他位置（如：`/etc/sysconfig/docker`​、`/etc/default/docker`​）是否配置了`registry-mirrors`​参数，删除此参数并重启容器引擎即可。

###### 5. 确认配置结果

执行**​`docker info`​**​，当R`egistry Mirrors`​字段的地址为加速器的地址时，说明加速器已经配置成功。

> 温馨提示：当前实测部分厂商容器仓库加速服务已失效

## 镜像加速不可用

* 腾讯云镜像加速器地址：https://mirror.ccs.tencentyun.com
* 中国科学技术大学：https://docker.mirrors.ustc.edu.cn
* Docker官方镜像（中国区）镜像加速：https://registry.docker-cn.com
* 网易云镜像加速器地址：http://hub-mirror.c.163.com
* 南京大学镜像加速器地址：https://docker.nju.edu.cn

## 镜像加速可用镜像源

* 阿里云镜像加速器地址：https://XXXXX.mirror.aliyuncs.com

* 华为云的镜像加速地址：XXX.mirror.swr.myhuaweicloud.com

* Daocloud 镜像加速器地址：https://docker.m.daocloud.io
