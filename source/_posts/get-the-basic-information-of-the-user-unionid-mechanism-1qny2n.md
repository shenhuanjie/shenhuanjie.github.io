---
title: 获取用户基本信息（UnionID 机制）
date: '2024-09-27 10:31:09'
updated: '2024-11-19 16:26:31'
tags:
  - UnionID
  - 微信开发
permalink: /post/get-the-basic-information-of-the-user-unionid-mechanism-1qny2n.html
comments: true
toc: true
---

# 获取用户基本信息(UnionID机制)

在关注者与公众号产生消息交互后，公众号可获得关注者的OpenID（加密后的微信号，每个用户对每个公众号的OpenID是唯一的。对于不同公众号，同一用户的openid不同）。公众号可通过本接口来根据OpenID获取用户基本信息，包括语言和关注时间。

请注意，如果开发者有在多个公众号，或在公众号、移动应用之间统一用户账号的需求，需要前往微信开放平台（open.weixin.qq.com）绑定公众号后，才可利用UnionID机制来满足上述需求。

# UnionID机制说明：

开发者可通过OpenID来获取用户基本信息。特别需要注意的是，如果开发者拥有多个移动应用、网站应用和公众账号，可通过获取用户基本信息中的unionid来区分用户的唯一性，因为只要是同一个微信开放平台账号下的移动应用、网站应用和公众账号，用户的unionid是唯一的。换句话说，同一用户，对同一个微信开放平台下的不同应用，unionid是相同的。

请注意： 20年6月8日起，用户关注来源“微信广告（ADD\_SCENE\_WECHAT\_ADVERTISEMENT）”从“其他（ADD\_SCENE\_OTHERS）”中拆分给出，2021年12月27日之后，不再输出头像、昵称信息。

获取用户基本信息（包括UnionID机制）

开发者可通过OpenID来获取用户基本信息。请使用https协议。

接口调用请求说明 http请求方式: GET https://api.weixin.qq.com/cgi-bin/user/info?access\_token\=ACCESS\_TOKEN&openid\=OPENID&lang\=zh\_CN

参数说明

|参数|是否必须|说明|
| ------------------| ----------| ---------------------------------------------------------------|
|access\_token|是|调用接口凭证|
|openid|是|普通用户的标识，对当前公众号唯一|
|lang|否|返回国家地区语言版本，zh\_CN 简体，zh\_TW 繁体，en 英语|

返回说明

正常情况下，微信会返回下述JSON数据包给公众号：

```json
{
    "subscribe": 1, 
    "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M", 
    "language": "zh_CN", 
    "subscribe_time": 1382694957,
    "unionid": " o6_bmasdasdsad6_2sgVt7hMZOPfL",
    "remark": "",
    "groupid": 0,
    "tagid_list":[128,2],
    "subscribe_scene": "ADD_SCENE_QR_CODE",
    "qr_scene": 98765,
    "qr_scene_str": ""
}
```

参数说明

|参数|说明|
| ----------------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|subscribe|用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息。|
|openid|用户的标识，对当前公众号唯一|
|language|用户的语言，简体中文为zh\_CN|
|subscribe\_time|用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间|
|unionid|只有在用户将公众号绑定到微信开放平台账号后，才会出现该字段。|
|remark|公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注|
|groupid|用户所在的分组ID（兼容旧的用户分组接口）|
|tagid\_list|用户被打上的标签ID列表|
|subscribe\_scene|返回用户关注的渠道来源，ADD\_SCENE\_SEARCH 公众号搜索，ADD\_SCENE\_ACCOUNT\_MIGRATION 公众号迁移，ADD\_SCENE\_PROFILE\_CARD 名片分享，ADD\_SCENE\_QR\_CODE 扫描二维码，ADD\_SCENE\_PROFILE\_LINK 图文页内名称点击，ADD\_SCENE\_PROFILE\_ITEM 图文页右上角菜单，ADD\_SCENE\_PAID 支付后关注，ADD\_SCENE\_WECHAT\_ADVERTISEMENT 微信广告，ADD\_SCENE\_REPRINT 他人转载，ADD\_SCENE\_LIVESTREAM 视频号直播，ADD\_SCENE\_CHANNELS 视频号，ADD\_SCENE\_WXA 小程序关注，ADD\_SCENE\_OTHERS 其他|
|qr\_scene|二维码扫码场景（开发者自定义）|
|qr\_scene\_str|二维码扫码场景描述（开发者自定义）|

错误时微信会返回错误码等信息，JSON数据包示例如下（该示例为AppID无效错误）:

```json
{"errcode":40013,"errmsg":"invalid appid"}
```

如果输入的 任意一个 openid 错误或者该用户尚未关注公众号（或者是曾经关注了，但是此刻已经是取消关注了），JSON数据包示例如下:

```json
{"errcode":40003,"errmsg":"invalid openid"}
```

批量获取用户基本信息

开发者可通过该接口来批量获取用户基本信息。最多支持一次拉取100条。

接口调用请求说明

http请求方式: POST https://api.weixin.qq.com/cgi-bin/user/info/batchget?access\_token\=ACCESS\_TOKEN

POST数据示例

```json
{
    "user_list": [
        {
            "openid": "otvxTs4dckWG7imySrJd6jSi0CWE", 
            "lang": "zh_CN"
        }, 
        {
            "openid": "otvxTs_JZ6SEiP0imdhpi50fuSZg", 
            "lang": "zh_CN"
        }
    ]
}
```

参数说明

|参数|是否必须|说明|
| --------| ----------| ------------------------------------------------------------------------|
|openid|是|用户的标识，对当前公众号唯一；必须是已关注的用户的 openid|
|lang|否|国家地区语言版本，zh\_CN 简体，zh\_TW 繁体，en 英语，默认为zh-CN|

返回说明

正常情况下，微信会返回下述JSON数据包给公众号：

```json
{
   "user_info_list": [
       {
           "subscribe": 1, 
           "openid": "otvxTs4dckWG7imySrJd6jSi0CWE", 
           "language": "zh_CN", 
      
          "subscribe_time": 1434093047, 
           "unionid": "oR5GjjgEhCMJFyzaVZdrxZ2zRRF4", 
           "remark": "", 

           "groupid": 0,
           "tagid_list":[128,2],
           "subscribe_scene": "ADD_SCENE_QR_CODE",
           "qr_scene": 98765,
           "qr_scene_str": ""

      },
   ]
}
```

参数说明

|参数|说明|
| ----------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|subscribe|用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息。|
|openid|用户的标识，对当前公众号唯一|
|language|用户的语言，简体中文为zh\_CN|
|subscribe\_time|用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间|
|unionid|只有在用户将公众号绑定到微信开放平台账号后，才会出现该字段。|
|remark|公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注|
|groupid|用户所在的分组ID（暂时兼容用户分组旧接口）|
|tagid\_list|用户被打上的标签ID列表|
|subscribe\_scene|返回用户关注的渠道来源，ADD\_SCENE\_SEARCH 公众号搜索，ADD\_SCENE\_ACCOUNT\_MIGRATION 公众号迁移，ADD\_SCENE\_PROFILE\_CARD 名片分享，ADD\_SCENE\_QR\_CODE 扫描二维码，ADD\_SCENE\_PROFILE\_LINK 图文页内名称点击，ADD\_SCENE\_PROFILE\_ITEM 图文页右上角菜单，ADD\_SCENE\_PAID 支付后关注，ADD\_SCENE\_WECHAT\_ADVERTISEMENT 微信广告，ADD\_SCENE\_REPRINT 他人转载 ，ADD\_SCENE\_LIVESTREAM 视频号直播， ADD\_SCENE\_CHANNELS 视频号，ADD\_SCENE\_WXA 小程序关注，ADD\_SCENE\_OTHERS 其他|
|qr\_scene|二维码扫码场景（开发者自定义）|
|qr\_scene\_str|二维码扫码场景描述（开发者自定义）|

错误时微信会返回错误码等信息，JSON数据包示例如下（该示例为AppID无效错误）:

```json
{"errcode":40013,"errmsg":"invalid appid"}
```

其他常见错误码:

|错误码|错误信息|含义|
| --------| ----------------| --------------------------------------------------------------------------------|
|40003|invalid openid|openid的数据错误或者该用户尚未关注公众号，或者数据正确的openid但不属于本公众号|
