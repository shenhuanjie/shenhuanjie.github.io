---
title: 微信小程序scroll-view组件在安卓机上出现横向滚动条的解决办法
date: '2024-12-05 10:12:58'
updated: '2024-12-05 10:15:06'
tags:
  - Uniapp
  - 微信小程序
permalink: >-
  /post/wechat-mini-program-scrollview-component-solution-to-the-horizontal-scroll-bar-on-the-android-machine-z16iqak.html
comments: true
toc: true
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
