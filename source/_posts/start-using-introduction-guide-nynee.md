---
title: 开始使用 - 入门指南
date: '2024-02-04 14:13:27'
updated: '2024-02-04 14:16:57'
tags:
  - Layui
permalink: /post/start-using-introduction-guide-nynee.html
comments: true
toc: true
---

# 开始使用 - 入门指南

> layui（谐音：类 UI) 是一套开源的 Web UI 解决方案，采用自身经典的模块化规范，并遵循原生 HTML/CSS/JS  的开发方式，极易上手，拿来即用。其风格简约轻盈，而组件优雅丰盈，从源代码到使用方法的每一处细节都经过精心雕琢，非常适合网页界面的快速开发。layui  区别于那些基于 MVVM  底层的前端框架，却并非逆道而行，而是信奉返璞归真之道。准确地说，它更多是面向后端开发者，你无需涉足前端各种工具，只需面对浏览器本身，让一切你所需要的元素与交互，从这里信手拈来。

## 兼容性和面向场景

> layui 兼容人类正在使用的全部浏览器（IE6/7除外），可作为 Web 界面速成开发方案。

## 获得 layui

1. 官网首页下载

> 你可以在我们的 [官网首页](http://layui.apixx.net/index.html) 下载到 layui 的最新版，它经过了自动化构建，更适合用于生产环境。目录结构如下：

```
  ├─css //css目录
  │  │─modules //模块 css 目录（一般如果模块相对较大，我们会单独提取，如下：）
  │  │  ├─laydate
  │  │  └─layer
  │  └─layui.css //核心样式文件
  ├─font  //字体图标目录
  └─layui.js //核心库
```

2. Git 仓库下载

你也可以通过 [GitHub](https://github.com/sentsin/layui/) 或 [码云](https://gitee.com/sentsin/layui) 得到 layui 的完整开发包，以便于你进行二次开发，或者 Fork layui 为我们贡献方案

3. npm 下载

```powershell
npm i layui
```

4. 第三方 CDN 方式引入：

UNPKG 和 CDNJS 均为第三方开源免费的 CDN，通过 NPM/GitHub 实时同步。另外还有 [LayuiCDN](https://www.layuicdn.com/#Layui)。

```html
<!-- 引入 layui.css -->
<link rel="stylesheet" href="//unpkg.com/layui@2.6.8/dist/css/layui.css">
 
<!-- 引入 layui.js -->
<script src="//unpkg.com/layui@2.6.8/dist/layui.js">
```

## 快速上手

如果你将 layui 下载到了本地，那么可将其完整地放置到你的项目目录（或静态资源服务器），这是一个基本的入门页面：

```html
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <title>开始使用 layui</title>
      <link rel="stylesheet" href="./layui/css/layui.css">
    </head>
    <body>
   
    <!-- 你的 HTML 代码 -->
   
    <script src="./layui/layui.js"></script>
    <script>
    layui.use(['layer', 'form'], function(){
      var layer = layui.layer
      ,form = layui.form;
    
      layer.msg('Hello World');
    });
    </script> 
    </body>
    </html>
        
```
