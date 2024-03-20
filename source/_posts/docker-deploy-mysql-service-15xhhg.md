---
title: Docker 部署 MySQL 服务
date: '2024-03-20 15:57:41'
updated: '2024-03-20 15:59:04'
permalink: /post/docker-deploy-mysql-service-15xhhg.html
comments: true
toc: true
---

# Docker 部署 MySQL 服务

```sh
# docker 中下载 mysql
docker pull mysql
 
#启动
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -d mysql
 
#进入容器
docker exec -it mysql bash
 
#登录mysql
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456 ';
 
#添加远程登录用户
CREATE USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
```
