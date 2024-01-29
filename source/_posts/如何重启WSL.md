---
title: 如何重启WSL
date: 2024-01-29 22:52:35
category:
  - Docker
tags:
  - Docker
  - WSL
---

## 一、为什么需要WSL重启

WSL（Windows Subsystem for Linux）可以使Windows系统上的用户使用Linux命令和工具，方便开发者在Windows上进行Linux相关的开发工作。

然而，在使用WSL过程中，可能会遇到一些问题需要重新启动WSL。常见的问题如：

* WSL执行命令失败，无法启动应用或无法正常工作；
* Windows系统更新操作导致WSL无法运行；
* WSL性能较低，需要重启以获得更好的性能。

当出现以上情况时，需要进行WSL重启操作。

## 二、如何重启WSL

使用Windows PowerShell

1. 打开“Windows PowerShell”。

2. 输入以下命令：

```powershell
wsl --shutdown
```

3. 执行命令后，等待几秒钟，直到WSL被关闭。

4. 再次打开WSL时，使用常用的方式启动WSL即可。
