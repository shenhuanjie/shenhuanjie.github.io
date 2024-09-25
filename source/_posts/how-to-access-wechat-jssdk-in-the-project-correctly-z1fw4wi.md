---
title: 如何正确的在项目中接入微信JS-SDK
date: '2024-09-25 17:09:11'
updated: '2024-09-25 17:15:58'
tags:
  - 微信开发
  - JSSDK
  - JavaScript
permalink: /post/how-to-access-wechat-jssdk-in-the-project-correctly-z1fw4wi.html
comments: true
toc: true
---

## 微信JS-SDK的功能

如果你点进来，那么我相信你应该知道微信的JS-SDK可以用来做什么了。微信的官方文档描述如下。

> 微信JS-SDK是微信公众平台面向网页开发者提供的基于微信内的网页开发工具包。通过使用微信JS-SDK，网页开发者可借助微信高效地使用拍照、选图、语音、位置等手机系统的能力，同时可以直接使用微信分享、扫一扫等微信特有的能力，为微信用户提供更优质的网页体验。

通过使用微信的JS-SDK，你可以让你网页在微信内调用拍照、语音、支付、位置、扫一扫这些只能在微信内使用的功能。进过下面的步骤，一步一步的配置，就可以让你正确的在项目中引入微信的JS-SDK。

## 引入微信的JS文件

微信的javascript文件的链接是： [http://res.wx.qq.com/open/js/...](http://res.wx.qq.com/open/js/jweixin-1.6.0.js)

但是只支持使用 AMD/CMD 标准模块加载方法加载。于是我就在npm的官网上找到了发布后的js-sdk，支持CommonJS的引入方式。可以在你的项目中使用如下命令安装。

```
npm install weixin-js-sdk
```

安装好后可以使用一下两种方式进行引入。

```
/* 使用CommonJs规范引入 */
const wx = require('weixin-js-sdk');

/* 使用ES6模块引入 */
import wx from 'weixin-js-sdk';
```

## 为wx.config实现权限签名算法

如果你按照大部分的教程来，他们会让你使用wx.config注入，获取权限。但是使用wx.config的前提是你必须要先实现权限签名算法。而权限签名算法的关键就是jsapi\_ticket。关于jsapi\_ticketm，官方的描述如下。

> 生成签名之前必须先了解一下jsapi\_ticket，jsapi\_ticket是企业号号用于调用微信JS接口的临时票据。正常情况下，jsapi\_ticket的有效期为7200秒，通过access\_token来获取。由于获取jsapi\_ticket的api调用次数非常有限，频繁刷新jsapi\_ticket会导致api调用受限，影响自身业务，开发者必须在自己的服务全局缓存jsapi\_ticket。

大概什么意思呢，看官方文档可能有点懵。大概意思就是：你想用我的sdk？可以，我给你个2个小时有效期的调用凭证。这个凭证我每天发给你的次数有限，所以你要保存好，不然到时候再想要凭证，没门。

这是通（很）俗（皮）的解释。下面来点正常的解释。想要获取jsapi\_ticket，你就需要向下面这个url:[https://api.weixin.qq.com/cgi-bin/ticket/getticket](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#62) GET请求，需要带上两个参数。access\_token和type，如果你是获取jsapi\_ticket，那么type就是固定的，值为jsapi。就可以在返回里面拿到ticket。并且你需要在服务器端缓存返回拿到的ticket。这个ticket就是上面通俗解释里的凭证，有效期两个小时，此后前端所有需要用到ticket的地方，后端需要去判断，如果ticket仍然没有过期，就从缓存中取出返回给前端，如果失效，就再发一个GET接口，获取后再存入缓存并且返回给前端。如果请求正常的话，会返回下列数据。

```
{
    'errcode': 0,
    'errmsg': 'ok',
    'ticket': 'bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITDGgnr2fwJ0m9E8NYzWKVZvdVtaUgWvsdshFKA',
    'expires_in': 7200,
}
```

拿到了jsapi\_ticket之后，我们就可以开始进行权限签名算法了。算法的流程如下。

​![image](https://qiniu.skyner.cn/image-20240925171441-b43tnqu.png)​

这个逻辑需要在后端实现。为什么会在下文给出。将需要用到js-sdk页面的url、以及jsapi\_ticket、noncestr（随机字符串）、timestamp（当前的时间戳）进行字典序排序，然后使用URL键值对的格式 （即 key1\=value1&key2\=value2…）拼接成字符串string。然后将这个string使用sha1加密，得到的结果就是signature了。然后将signature、timestamp、nonceStr返回给前端，wx.config需要用到这些数据。然后将它们用这里需要特别注意一下，官方的注意文档如下。

> 注意事项
>
> 1. 签名用的noncestr和timestamp必须与wx.config中的nonceStr和timestamp相同。
> 2. 签名用的url必须是调用JS接口页面的完整URL。
> 3. 出于安全考虑，开发者必须在服务器端实现签名的逻辑。

这里的官方文档其实也没有那么官方，其实就是告诉我们，实现上述签名逻辑必须在服务器，以及noncestr和timestamp必须要和在服务器端签名所使用的一致，还有就是调用微信js-sdk的页面的url必须要跟服务端签名所使用的url一致。所有在服务端可以直接从请求的header里面的referer获取。

你把接口做好之后，只要能够正确的返回signature、nonceStr、timestamp（有后端的更好，直接找他们要接口就好了），就可以愉快的进行下一步了。

## 通过config接口注入权限验证配置

官方的描述如下。

> 所有需要使用JS-SDK的页面必须先注入配置信息，否则将无法调用（同一个url仅需调用一次，对于变化url的SPA的web app可在每次url变化时进行调用,目前Android微信客户端不支持pushState的H5新特性，所以使用pushState来实现web app的页面会导致签名失败，此问题会在Android6.2中修复）。

在进行了正确的微信javascript文件引入后（看上面）在页面中调用如下代码就可以注入权限验证配置。下面是官方给的样例代码。

```
wx.config({
    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    appId: '', // 必填，企业号的唯一标识，此处填写企业号corpid
    timestamp: , // 必填，生成签名的时间戳
    nonceStr: '', // 必填，生成签名的随机串
    signature: '',// 必填，签名，见附录1
    jsApiList: [] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
});
```

下面我给一个样例数据。

```
// data就是上一步说的后端返回的那些数据，包含signature、nonceStr、timestamp
const data = await getJsSDK();

wx.config({
    debug: true,
    appId: '你的appId',
    timestamp: data.timestamp,
    nonceStr: data.nonceStr,
    signature: data.signature,
    jsApiList: [
      'onMenuShareTimeline', // 分享到朋友圈
      'onMenuShareAppMessage', // 分享给朋友
      'onMenuShareQQ',// 分享到QQ
      'onMenuShareWeibo',// 分享到腾讯微博
      'onMenuShareQZone',// 分享到QQ空间
    ]
});
```

## 注入后的生命周期函数

在调用config后会有两个结果，成（这）功（是）和（废）失（话）败。可以通过微信提供的两个接口来进行事件回调。

```
wx.ready(function(){
    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
});

wx.error(function(res){
    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
});
```

## 调用分享接口

在ready()中调用具体的分享接口。如分享到朋友圈、好友、QQ空间。代码如下。我把接口的所有的钩子函数都给了出来。其实常用的就只有的success和cancel。根据你个人的需求而定。

```
wx.ready(function(){
  /* 分享到朋友圈 */
  wx.onMenuShareTimeline({
    title: '', // 分享标题
    link: '', // 分享链接，该链接域名必须与当前企业的可信域名一致
    imgUrl: '', // 分享图标
    success: function () {
      // 用户确认分享后执行的回调函数
    },
    cancel: function () {
      // 用户取消分享后执行的回调函数
    },
    trigger: function () {
      // 监听Menu中的按钮点击时触发的方法
    },
    complete: function () {
      // 接口调用完成时执行的回调函数，无论成功或失败都会执行
    },
    fail: function () {
      // 接口调用失败时执行的回调函数
    },
  });
});
```

微信官方文档在这给了一个特别的提醒。

> 注意：不要尝试在trigger中使用ajax异步请求修改本次分享的内容，因为客户端分享操作是一个同步操作，这时候使用ajax的回包会还没有返回。

大概意思就是，不要尝试在钩子函数中动态的修改title啊link啊的值，因为分享是同步的操作，ajax的值返回回来的时候分享的操作已经结束了。比起这个，要注意的是link字段，它的域名必须要跟微信后台配置的JS安全域域名一致，否则分享会失败。到这为止，微信js-sdk的接入就完成了。还有问题可以直接留言或者联系我。

## 写在后面

最后还需要注意一点的是，如果页面的url发生了变化，在新的url下调用js-sdk一定要再调用一次签名接口，用新的url再进行一次签名，否则会调用不成功。

微信官方文档地址在 [这里](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#1)

‍
