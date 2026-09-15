---
title: 对接第三方云端存储
published: 2023-08-05T15:01:31.000Z
updated: 2024-02-03T16:45:37.000Z
draft: false
description: 请在 <kbd设置</kbd​ - <kbd云端</kbd​ - <kbd云端存储服务提供商</kbd​ 中进行选择和配置，目前已经支持：
tags: []
category: ''
---

# 对接第三方云端存储

请在 <kbd>设置</kbd>​ - <kbd>云端</kbd>​ - <kbd>云端存储服务提供商</kbd>​ 中进行选择和配置，目前已经支持：

* S3 兼容的对象存储服务，比如[七牛云](https://s.qiniu.com/VbQfeu)、[阿里云 OSS](https://www.aliyun.com/product/oss?userCode=yqovuas2)、[Cloudflare R2](https://www.cloudflare.com/)
* WebDAV 协议，比如 [InfiniCLOUD](https://infini-cloud.net/)

通过第三方云端存储服务同步数据同样是端到端加密的，第三方云端存储服务提供商无法获得我们的明文数据。

​#注意#​：为了保障数据同步的可用性，请确保：

* 多设备系统时间一致，误差请控制在一分钟以内
* 网络稳定（比如中国大陆地区请勿使用非中大陆地区的服务）
* 不要启用 CDN
