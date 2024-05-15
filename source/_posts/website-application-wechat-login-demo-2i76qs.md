---
title: 网站应用微信登录 DEMO
date: '2024-05-15 15:45:55'
updated: '2024-05-15 15:47:17'
permalink: /post/website-application-wechat-login-demo-2i76qs.html
comments: true
toc: true
---

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网站应用微信登录 DEMO</title>
    <script src="http://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js"></script>
</head>

<body>
    <div id="wx_login_container"></div>
    <script>
        // 获取当前时间戳精确点分钟
        function getTimestamp() {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours();
            const minute = date.getMinutes();
            return `${year}${month}${day}${hour}${minute}`;
        }
        const timestamp = getTimestamp();
        console.log('timestamp:', timestamp);
        const obj = new WxLogin({
            self_redirect: false,// true：手机点击确认登录后可以在 iframe 内跳转到 redirect_uri，false：手机点击确认登录后可以在 top window 跳转到 redirect_uri。默认为 false。
            id: "wx_login_container",// 第三方页面显示二维码的容器id
            appid: "wx5f8067d4c106894b",// 应用唯一标识，在微信开放平台提交应用审核通过后获得
            scope: "snsapi_login",// 应用授权作用域，拥有多个作用域用逗号（,）分隔，网页应用目前仅填写snsapi_login即可
            redirect_uri: "http://www.baidu.com,// 重定向地址，需要进行UrlEncode
            state: "wx_login",// 用于保持请求和回调的状态，授权请求后原样带回给第三方。该参数可用于防止csrf攻击（跨站请求伪造攻击），建议第三方带上该参数，可设置为简单的随机数加session进行校验
            style: "",// 提供"black"、"white"可选，默认为黑色文字描述。详见文档底部FAQ
            href: "https://web-1300736413.file.myqcloud.com/assets/css/wx-qrcode-login/wx-login.css?t=" + timestamp // 自定义样式链接，第三方可根据实际需求覆盖默认样式。详见文档底部FAQ
        });
        // 获取 wx_login_container 元素下的 iframe 并设置宽高为 200px
        const iframe = document.querySelector('#wx_login_container iframe');
        iframe.style.width = '200px';
        iframe.style.height = '200px';

    </script>
</body>

</html>
```
