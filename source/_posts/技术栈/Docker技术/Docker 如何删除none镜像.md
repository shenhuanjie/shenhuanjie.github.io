---
title: Docker 如何删除none镜像
date: 2024-01-22 01:34:18
category: 
- 技术栈
- Docker技术
tags: 
- Docker
---
# Docker 如何删除none镜像
### Linux环境
删除none的镜像，要先删除镜像中的容器。要删除镜像中的容器，必须先停止容器。

```powershell
$ docker images
```
```powershell
$ docker rmi $(docker images | grep "none" | awk '{print $3}')
```
直接删除带none的镜像，直接报错了。提示先停止容器。

```powershell
$ docker stop $(docker ps -a | grep "Exited" | awk '{print $1 }') //停止容器
$ docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }') //删除容器
$ docker rmi $(docker images | grep "none" | awk '{print $3}') //删除镜像
```
### Windows环境
docker for windows 在构建后删除镜像

使用以下命令可以删除为none的镜像

```bash
docker rmi $(docker images --filter “dangling=true” -q --no-trunc) 
```
你尝试过

```bash
docker rmi $(docker images -q)
docker rmi $(docker images | grep “^” | awk “{print $3}”)
docker rmi $(docker images -f “dangling=true” -q)
```
并失败以后，就用这条吧 

```bash
docker rmi $(docker images --filter “dangling=true” -q --no-trunc)
```