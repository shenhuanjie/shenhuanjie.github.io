---
title: Layui——图标 Icon
date: '2024-02-04 19:57:10'
updated: '2024-02-04 20:14:02'
permalink: /post/icon-icon-1xdmin.html
comments: true
toc: true
---

# Layui——图标 Icon

> Layui 图标采用字体形式，取材于阿里巴巴矢量图标库 `iconfont`​，因此可以把一个 `icon`​ 看作是一个普通的文本，直接通过 `css`​ 即可设定其样式。图标支持 `font-class`​ 或 `unicode`​ 两种格式。

## 示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Demo</title>
  <!-- 请勿在项目正式环境中引用该 layui.css 地址 -->
  <link href="//unpkg.com/layui@2.9.6/dist/css/layui.css" rel="stylesheet">
</head>
<body>
<i class="layui-icon layui-icon-face-smile"></i> 
<div>
  你可以去定义它的颜色或者大小，如：  
  <i class="layui-icon layui-icon-face-smile" style="font-size: 30px; color: #1E9FFF;"></i> 
</div>

</body>
</html>
```

通过对一个内联元素（如 `<i>`​标签）添加基础类 `class="layui-icon"`​ 来定义一个图标，然后对元素加上图标对应的 `font-class`​，即可显示出你想要的图标，如上所示。

## 图标列表（186 个）

略

## 跨域处理

由于浏览器存在同源策略，若 Layui 文件地址与你当前的页面地址*不在同一个域下*，即会出现图标跨域问题。因此，要么将 Layui 文件与网站放在同一服务器，要么对 Layui 文件所在的静态资源服务器的 `Response Headers`​ 添加：`Access-Control-Allow-Origin: *`​ 或对跨资源共享指定域名，即可解决图标跨域问题。

‍
