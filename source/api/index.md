---
title: API 文档
date: 2026-05-08 12:00:00
layout: api
---

# API 文档

欢迎使用程序猿视界的开放 API。本文档提供博客内容订阅和发现接口。

## 订阅源 (Feed APIs)

### Atom Feed

```
GET /atom.xml
```

标准 Atom 格式订阅源，包含所有文章列表。

**响应示例：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>程序猿视界</title>
  <subtitle>分享知识,持续学习</subtitle>
  <link href="https://shenhuanjie.github.io/atom.xml" rel="self"/>
  <updated>2026-05-08T12:00:00+08:00</updated>
  <id>https://shenhuanjie.github.io/</id>
  <author>
    <name>Shenhuanjie</name>
  </author>
  <entry>
    <title>文章标题</title>
    <link href="https://shenhuanjie.github.io/2026/05/08/article-slug/"/>
    <updated>2026-05-08T12:00:00+08:00</updated>
    <id>https://shenhuanjie.github.io/2026/05/08/article-slug/</id>
    <content type="html"><![CDATA[文章内容...]]></content>
  </entry>
</feed>
```

### JSON Feed

```
GET /feed.json
```

JSON 格式订阅源，便于程序化处理。

**响应示例：**
```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "程序猿视界",
  "home_page_url": "https://shenhuanjie.github.io/",
  "feed_url": "https://shenhuanjie.github.io/feed.json",
  "description": "分享知识,持续学习",
  "language": "zh",
  "author": {
    "name": "Shenhuanjie",
    "url": "https://shenhuanjie.github.io/author/"
  },
  "items": [
    {
      "id": "https://shenhuanjie.github.io/2026/05/08/article-slug/",
      "url": "https://shenhuanjie.github.io/2026/05/08/article-slug/",
      "title": "文章标题",
      "content_text": "文章摘要...",
      "date_published": "2026-05-08T12:00:00+08:00",
      "tags": ["AI", "大模型"]
    }
  ]
}
```

### 搜索 API

```
GET /search.json
```

站内搜索索引，包含所有文章内容。

**响应示例：**
```json
[
  {
    "title": "文章标题",
    "url": "/2026/05/08/article-slug/",
    "content": "文章内容摘要..."
  }
]
```

## 网站地图 (Sitemap)

```
GET /sitemap.xml
```

搜索引擎网站地图。

## 内容发现

### OpenSearch

博客支持 OpenSearch 协议，可在浏览器搜索框直接搜索博客内容。

**OpenSearch 描述文档：** `/opensearch.xml`

### RSS/Atom 验证

- Atom 验证地址：https://validator.w3.org/feed/check.cgi

## WebSub (PubSubHubbub)

本博客支持 WebSub 协议，可实时推送内容更新给订阅者。

**Hub 端点：** `https://pubsubhubbub.appspot.com`

**订阅步骤：**
1. 客户端向 Hub 发送订阅请求
2. Hub 验证订阅有效性
3. 内容更新时，Hub 主动推送 Atom Feed 给订阅者

## 使用示例

### 使用 curl 订阅 Atom Feed

```bash
curl -s /feed.json | jq '.items[] | {title, url, date_published}'
```

### 在阅读器中使用

1. RSS 阅读器添加订阅源：`https://shenhuanjie.github.io/atom.xml`
2. 或使用 JSON Feed：`https://shenhuanjie.github.io/feed.json`

## 限制说明

- Feed 包含最近 20 篇文章
- 内容摘要限制 140 字符
- 请合理控制请求频率

## 联系我们

如有问题，请通过 [GitHub Issues](https://github.com/shenhuanjie/shenhuanjie.github.io/issues) 反馈。
