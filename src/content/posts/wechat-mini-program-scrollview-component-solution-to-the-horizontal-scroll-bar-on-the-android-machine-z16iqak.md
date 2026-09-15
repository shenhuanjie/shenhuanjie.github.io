---
title: 微信小程序scroll-view组件在安卓机上出现横向滚动条的解决办法
published: 2024-12-05T02:12:58.000Z
updated: 2024-12-05T02:15:06.000Z
draft: false
description: 在开发微信小程序，scroll-view在安卓机上有横向滚动条现象，iphone没有此bug。
tags:
  - Uniapp
  - 微信小程序
category: ''
---

在开发微信小程序，scroll-view在安卓机上有横向滚动条现象，iphone没有此bug。

```css
// 去掉scroll-view组件横向滚动条：
::-webkit-scrollbar{
    width: 0;
    height: 0;
    color: transparent;
    display:none;
}

```

原文链接：[https://skyner.cn/archives/wechat-mini-program-scrollview-component-solution-to-the-horizontal-scroll-bar-on-the-android-machine-z16iqak](https://skyner.cn/archives/wechat-mini-program-scrollview-component-solution-to-the-horizontal-scroll-bar-on-the-android-machine-z16iqak)

‍
