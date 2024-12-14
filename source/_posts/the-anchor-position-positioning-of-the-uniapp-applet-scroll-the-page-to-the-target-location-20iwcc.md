---
title: uniapp小程序的锚点定位（将页面滚动到目标位置）
date: '2024-12-14 11:29:03'
updated: '2024-12-14 11:30:24'
tags:
  - Uniapp
  - 锚点定位
permalink: >-
  /post/the-anchor-position-positioning-of-the-uniapp-applet-scroll-the-page-to-the-target-location-20iwcc.html
comments: true
toc: true
---

> 小程序中，a页面跳转到b页面，跳转后滚动定位到b页面的特定位置。

* 1.uni.pageScrollTo传递一个scrollTop参数可以滚动到特定位置。
* 2.可以通过 uni.createSelectorQuery()等获取定位元素的位置信息。
* 3.uni.getSystemInfoSync()获取设备的导航栏和状态栏高度。
* 4.注意：scrollTop参数的值是2的top的值减去3的导航栏的高度和状态栏的高度。
* 5.最后，需要注意使用定时器，等待页面渲染完毕，开始滚动。

直接上代码：下面是b页面的模板代码和js代码。

```html
<template>
  <div class="container">
    <div class="section a"></div>
    <div class="section b"</div>
    <div class="section c"></div>
    <div class="section d"></div>
  </div>
</template> 

```

```js
onLoad(opt){
    // pos是a页面跳转携带的query参数。a,b,c,d
    const pos = opt && opt.pos || '';
  
    // 获取手机系统相关的信息，是为了获取导航条和状态栏高度。
    const res = uni.getSystemInfoSync();
  
    // 获取需要定位的元素的坐标位置
    uni.createSelectorQuery().select(`.${pos}`).boundingClientRect(data => {
      // 此处的定时器，非常的重要，等待页面渲染完，然后滚动页面。
      // 需要除去 标题栏高度 和 状态栏高度
      setTimeout(()=>{
        uni.pageScrollTo({
          scrollTop: data.top - res.navigationBarHeight - res.statusBarHeight
        })
      }, 300)
    }).exec();
  }

```
