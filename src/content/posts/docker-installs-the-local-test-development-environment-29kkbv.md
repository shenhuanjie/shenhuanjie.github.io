---
title: Docker安装本地测试开发环境
published: 2024-12-17T03:03:35.000Z
updated: 2024-12-17T03:07:50.000Z
draft: false
description: 通过docker ps -a查看部署的mq容器id，在通过 docker exec -it 容器id /bin/bash 进入容器内部在运行：rabbitmq-plugins enable rabbitmq\management
tags:
  - Docker
  - Redis
  - MySql
  - RabbitMQ
  - ElasticSearch
  - Nacos
category: ''
---

## Docker 安装 Redis

```shell
docker run --name redis -p 6379:6379 -d redis
```

## Docker 安装 RabbitMQ

```shell
docker run -d --name rabbitmq -p 15672:15672 -p 5672:5672 rabbitmq
```

通过docker ps -a查看部署的mq容器id，在通过 docker exec -it 容器id /bin/bash 进入容器内部在运行：rabbitmq-plugins enable rabbitmq\_management

现在可以通过访问http://linuxip:15672，访问web界面，这里的用户名和密码默认都是 guest 输入命令：exit退出容器目录.

## Docker 安装 MySQL

```shell
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -d mysql
```

```shell
#进入容器
docker exec -it mysql /bin/bash
 
#登录mysql
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456 ';
 
#添加远程登录用户
CREATE USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
```

## Docker 安装 ElasticSearch

```shell
docker run -d --name elasticsearch -e "ES_JAVA_OPTS=-Xms512m -Xmx512m"  -e "discovery.type=single-node" -e "http.host=0.0.0.0" --privileged -p 9200:9200 elasticsearch:7.13.4
```

## Docker 安装 Nacos

```shell
docker run --name nacos -d -p 8848:8848-e MODE=standalone --platform linux/arm64 nacos/nacos-server:v2.0.4-slim
```
