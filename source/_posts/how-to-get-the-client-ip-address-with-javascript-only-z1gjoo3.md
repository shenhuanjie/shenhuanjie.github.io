---
title: 'How to get the client IP address with Javascript only '
date: '2024-03-26 10:14:49'
updated: '2024-03-26 10:18:53'
permalink: /post/how-to-get-the-client-ip-address-with-javascript-only-z1gjoo3.html
comments: true
toc: true
---

Learn how to get the client IP address (local and private) using only javascript.

​![articleocw-57dfeb2a430a6](assets/articleocw-57dfeb2a430a6-20240326101556-6ucamey.png)​

Javascript无法获取（也无法存储）客户端IP，但是Javascript能够创建Http请求，并且服务器端语言能够检索用户的公共IP，因此您可以利用这一优势。换句话说，如果你想检索用户的公共IP，你将依赖于对任何服务器的请求来检索IP。您可以很容易地从Best Node.js Hosting获得VPS，部署一个简单的js脚本，并将其作为Node.js和Express js的服务发布，这样您就可以请求该服务，获得客户端的IP。

然而，随着WebRTC的引入，您将能够使用RTCPeerConnection来检索用户的私有IP。

在本文中，您将学习如何通过几个技巧轻松检索用户IP（使用纯javascript的私有IP和使用第三方服务的公共IP）。

## 使用webRTC（获取专用IP）

RTCPeerConnection接口允许您在您的计算机和远程对等体之间创建一个WebRTC连接。然而，我们将创建它的“中断”版本，以便仅使用javascript检索客户端的IP。

createOffer方法启动会话描述协议(SDP)的创建，该协议提供有关附加到WebRTC会话、会话、代码和ICE代理(包含我们的目标IP)已经收集的任何候选内容的任何MediaStreamTracks的信息。

在旧版本中，此方法使用回调。但是，现在返回一个基于Promise的值，该值在完成时返回我们需要的信息:

注意:纯javascript实现将返回客户端的私有IP，而不是公共IP。保存此代码片段。

```js
/**
 * Get the user IP throught the webkitRTCPeerConnection
 * @param onNewIP {Function} listener function to expose the IP locally
 * @return undefined
 */
function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
        iceServers: []
    }),
    noop = function() {},
    localIPs = {},
    ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
    key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

     //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer().then(function(sdp) {
        sdp.sdp.split('\n').forEach(function(line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });
      
        pc.setLocalDescription(sdp, noop, noop);
    }).catch(function(reason) {
        // An error occurred, so handle the failure to connect
    });

    //listen for candidate events
    pc.onicecandidate = function(ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}

// Usage

getUserIP(function(ip){
    alert("Got IP! :" + ip);
});

```

 `getUserIP`方法期望作为第一个参数的函数将在客户端的IP可用时被调用。回调函数接收一个字符串(ip)作为第一个(也是唯一的)参数。

## 使用第三方服务(获取公共IP)

如果你需要提供跨浏览器支持，你将无法使用RTCPeerConnection来检索你的客户端私有IP，因此你拥有的唯一资源是依赖于外部服务(对服务器的请求，第三方服务或你自己服务器上的自动实现服务)。

### 不安全连接HTTP

要从没有SSL证书的网站获取用户的IP，您可以依赖ipinfo.io。这个服务提供了一个API，通过一个简单的ajax调用来获取客户端IP:

```js
$.getJSON('http://ipinfo.io', function(data){
    console.log(data);
});
```

检索数据对象包含本地化信息，如:国家，城市等。ipinfo的服务器使用基于延迟的DNS路由来尽可能快地处理请求。在官方网站阅读更多关于ipinfo的信息。

### 安全连接HTTPS(推荐)

即使在使用SSL的安全网站中，也可以从网站获取用户的IP，您可以使用ipify服务，该服务提供了友好的API，可以轻松获取用户IP。此服务没有请求限制。

您可以在向API请求的项目中使用它(如果需要，可以使用format参数)，然后就可以开始了。

|API URI|Response Type|Sample Output (IPv4)|Sample Output (IPv6)|
| ---------| ---------------| ----------------------| ----------------------|
|​`https://api.ipify.org`​|​`text`​|​`11.111.111.111`​|​`?`​|
|​`https://api.ipify.org?format=json`​|​`json`​|​`{"ip":"11.111.111.111"}`​|​`?`​|
|​`https://api.ipify.org?format=jsonp`​|​`jsonp`​|​`callback({"ip":"11.111.111.111"});`​|​`?`​|
|​`https://api.ipify.org?format=jsonp&callback=getip`​|​`jsonp`​|​`getip({"ip":"11.111.111.111"});`​|​`?`​|

你可以使用它与JSONP:

```html
<script type="application/javascript">
  function getIP(json) {
    document.write("My public IP address is: ", json.ip);
  }
</script>

<script type="application/javascript" src="https://api.ipify.org?format=jsonp&callback=getIP"></script>
```

或者使用jQuery检索一个json请求对象:

```js
$.getJSON('https://api.ipify.org?format=json', function(data){
    console.log(data.ip);
});
```

此外，如果你有自己的服务器，你可以创建自己的私有服务，用PHP,ASP等服务器语言返回用户的IP。
