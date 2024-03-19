---
title: Docker 上安装部署 Elasticsearch（ES）详细教程
date: '2024-03-19 16:58:18'
updated: '2024-03-19 19:05:38'
permalink: >-
  /post/docker-installation-and-deployment-elasticsearch-es-detailed-tutorial-zntn2c.html
comments: true
toc: true
---

# Docker 上安装部署 Elasticsearch（ES）详细教程

## 前言

Elasticsearch（简称 ES）是一个支持海量搜索引擎服务，当一个分布式系统需要支持海量搜索服务时都会优先上 ES。因此掌握 ES 技术也是一门进入大厂拿高薪的必修课，笔者一直在追求深入掌握 ES 技术，一方面希望自己有机会还能进大厂并站稳脚跟。退一步讲就算进不了大厂，自己也要能具备做出大厂程序员能做出来的产品，到那时就算自己经营一个日活上万的网站或者 App 也能有一份不错的收入。

之所以会选择 7.12 版本的 ES 是因为这个版本的 ES 算是一个比较新稳定的新版本，与之关联的 Kibana 版本的界面也有了较大的更新，所以选择了安装这个版本的 ES。笔者之前在 Linux 和 Windows 系统下也安装过单独的 ES 服务，但是发现都安装和配置非常麻烦，还容易报各种安装失败的错误。后来看到很多大牛都推荐使用 Docker 安装顺利，而且还方便维护，于是笔者也尝试在自己的云服务器中使用 Docker 安装 ES 和 Kibana 及中文分词器，下面我们正式进入安装步骤，本文假设读者已经在自己的云服务器中安装好了 Docker 服务，并通过执行`systemctl start docker.service`​ 命令启动了 Docker 服务。

## 1. 创建网络

因为我们还需要部署 Kibanna 容器，因此需要让 ES 和 Kibana 容器互联，这里先创建一个网络。

使用`FinalShell`​ 登录自己的 Linux 云服务器客户端（阿里云或腾讯云）

```sh
docker network create es-net
```

## 2. 加载镜像

```sh
docker pull elasticsearch:7.13.4

docker pull kibana:7.13.4
```

## 3. 运行容器

```sh
docker run -d \
--name elasticsearch \
-e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
-e "discovery.type=single-node" \
-e "http.host=0.0.0.0" \
-v ./es-data:/usr/share/elasticsearch/data \
-v ./es-plugins:/usr/share/elasticsearch/plugins \
-v ./es-logs:/usr/share/elasticsearch/logs \
--privileged \
--network es-net \
-p 9200:9200 \
-p 9300:9300 \
elasticsearch:7.13.4
```

## 4. 部署 Kibana

```sh
docker run -d \
--name kibana \
-e ELASTICSEARCH_HOSTS=http://elasticsearch:9200 \
--network=es-net \
-p 5601:5601 \
kibana:7.13.4
```

## 5. 安装 IK 分词器

```sh
docker exec -it elasticsearch bash

mkdir tmp

curl -L -o  tmp/elasticsearch-analysis-ik-7.13.4.zip https://github.com/infinilabs/analysis-ik/releases/download/v7.13.4/elasticsearch-analysis-ik-7.13.4.zip

unzip /tmp/elasticsearch-analysis-ik-7.13.4.zip -d ./plugins/ik

exit
```

```sh
curl -L -o  elasticsearch-analysis-ik-7.13.4.zip https://github.com/infinilabs/analysis-ik/releases/download/v7.13.4/elasticsearch-analysis-ik-7.13.4.zip
```

```sh
https://github.com/infinilabs/analysis-ik
```
