---
title: 启动Docker Desktop报错Docker Desktop - Unexpected WSL error
date: 2024-01-29 22:55:26
category:
  - Docker
tags:
  - Docker
  - WSL
---

启动Docker Desktop报“Docker Desktop - Unexpected WSL error”错

报错内容如下：

```text
An unexpected error was encountered while executing a WSL command. Commoncauses include access rights issues, 
which occur after waking the computer or notbeing connected to your domain/active directory.

please try shutting WSL down (wsl --shutdown) and/or rebooting your computer. lfnot sufficient, WSL may need to be reinstalled fully. 
As a last resort, try touninstall/reinstall Docker Desktop, lf the issue persists please collect diagnostics andsubmit an issue
....//docs.docker.com/desktop/troubleshoot/overview/#diagnose-from-the-terminal).
```

## 解决方案:

执行以下命令：

```shell
netsh winsock reset
```

出现场景:

* 启动wsl使用过代理或加速器等软件
* wsl更新后, wsl --update操作后
* win10/win11升级后, 替你安装或者升级了"Windows Subsystem for Linux Preview"

## 出现原因:

wsl启动时加载了Proxifier的一个模块, 此前使用过代理会导致此问题出现
