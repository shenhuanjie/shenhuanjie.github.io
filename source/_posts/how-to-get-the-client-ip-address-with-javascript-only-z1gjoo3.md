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

Javascript is unable to get (nor stores somewhere) the client IP, however javascript is able to create Http requests, and server side languages are able to retrieve the user public IP, so you could use this as advantage. In other words, if you want to retrieve the public IP of an user you'll depend from a request to any server in order to retrieve the IP. You can easily get a VPS from the Best Node.js Hosting, deploy a simple JS Script, and publish it as a service with Node.js and Express JS so you can request this service, obtaining the IP of the client.

However, with the introduction of the WebRTC, <span style="font-weight: bold;" data-type="strong">you'll be able to retrieve the private IP</span> of the user with a trick using RTCPeerConnection.

In this article you'll learn how to retrieve the user IP (private  using pure javascript and public using a third party service) easily  with a couple of tricks.

## Using webRTC (get private IP)

The RTCPeerConnection interface allow you to create a WebRTC  connection between your computer and a remote peer. However, we are  going to create an  <span style="font-weight: bold;" data-type="strong">&quot;interrupted</span>" version of it in order to retrieve the IP of the client using only javascript.

The createOffer method initiates the creation of a session  description protocol (SDP) which offer information about any  MediaStreamTracks attached to the WebRTC session, session, codes and any  candidates already gathered by the ICE agents (which contains our goal,  the IP).

In older versions, this method uses callbacks. However, now return a  value based in a Promise that returns the information that we need when  fullfilled:

Note: the pure javascript implementation will return the client private IP, not the public. Save this Snippet.

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

The `getUserIP`​ method expects as first parameter a function  that will be invoked when the IP of the client is available. The  callbacks receives a string (the ip) as first (and unique) parameter.  You can see the previous snippet in action via JSFiddle:

## Using a third party service (get public IP)

If you need to provide cross-browser support, you'll be unable to use  RTCPeerConnection to retrieve your client private  IP, therefore the  only resource you have it's to depend from an external service (a  request to a server, third party service or your autoimplemented service  in your own server).

### Insecure connections HTTP

To get the IP of the user from a website without SSL certificate, you  can rely on ipinfo.io. This service offers an API to get the client IP  with a simple ajax call:

```js
$.getJSON('http://ipinfo.io', function(data){
    console.log(data);
});
```

The retrieven data object contains localization info like : country, city etc when available. The servers of ipinfo use latency based DNS routing to handle the request so quick as possible. Read more about ipinfo in the official website here.

### Secure connections HTTPS (recommended)

To get the IP of the user from a website even in secured websites with SSL, you can use the ipify service which provides a friendly API to get the user IP easily. This service has no request limitations.  
You can use it in your project requesting to the API (with the format parameter if you need) and you're ready to go.

|API URI|Response Type|Sample Output (IPv4)|Sample Output (IPv6)|
| ---------| ---------------| ----------------------| ----------------------|
|​`https://api.ipify.org`​|​`text`​|​`11.111.111.111`​|​`?`​|
|​`https://api.ipify.org?format=json`​|​`json`​|​`{"ip":"11.111.111.111"}`​|​`?`​|
|​`https://api.ipify.org?format=jsonp`​|​`jsonp`​|​`callback({"ip":"11.111.111.111"});`​|​`?`​|
|​`https://api.ipify.org?format=jsonp&callback=getip`​|​`jsonp`​|​`getip({"ip":"11.111.111.111"});`​|​`?`​|

You can use it with JSONP:

```html
<script type="application/javascript">
  function getIP(json) {
    document.write("My public IP address is: ", json.ip);
  }
</script>

<script type="application/javascript" src="https://api.ipify.org?format=jsonp&callback=getIP"></script>
```

Or retrieve an object with a json request using jQuery:

```js
$.getJSON('https://api.ipify.org?format=json', function(data){
    console.log(data.ip);
});
```

Besides, you can create, in case you have your own server and you're  able to work on it, create your own private service that returns the IP  of the user with a server language like PHP,ASP.NET etc.

Have fun !
