---
title: ipify.org：免费IP查询服务详解
date: '2025-01-15 15:22:34'
updated: '2025-01-15 15:23:07'
excerpt: >-
  ipify.org是一个免费IP查询服务，提供简单易用的API，开发者可通过HTTP请求获取客户端IP地址。支持纯文本、JSON和JSONP格式返回，适用于客户端和服务器端获取IP，方便调试和测试。服务稳定，响应速度快，但需注意隐私问题和请求频率限制。
tags:
  - ip查询
  - 免费API
  - IP地址
  - 开发者
  - 网络
permalink: /post/ipifyorg-detailed-explanation-of-free-ip-query-service-z3xiy9.html
comments: true
toc: true
---





　　​`https://www.ipify.org/`​ 是一个免费的公共服务网站，专门用于获取用户的公网 IP 地址。它提供了一个简单易用的 API，开发者可以通过 HTTP 请求获取客户端的 IP 地址。

---

### 主要功能

1. **获取用户的公网 IP 地址**：

    * 用户或开发者可以通过访问 `ipify`​ 的 API，获取当前设备的公网 IP 地址。
    * 支持多种返回格式，如纯文本、JSON 和 JSONP。
2. **简单易用**：

    * 无需注册或认证，直接调用 API 即可。
    * 提供清晰的文档和示例代码。
3. **免费**：

    * 对于大多数开发者来说，`ipify`​ 是完全免费的。
    * 如果需要更高的请求频率或更高级的功能，可以选择付费计划。

---

### API 使用示例

#### 1. 获取纯文本格式的 IP 地址

　　访问以下 URL：

```
https://api.ipify.org
```

　　返回结果：

```
123.45.67.89
```

#### 2. 获取 JSON 格式的 IP 地址

　　访问以下 URL：

```
https://api.ipify.org?format=json
```

　　返回结果：

```json
{
  "ip": "123.45.67.89"
}
```

#### 3. 获取 JSONP 格式的 IP 地址

　　访问以下 URL：

```
https://api.ipify.org?format=jsonp&callback=myCallback
```

　　返回结果：

```javascript
myCallback({"ip": "123.45.67.89"});
```

---

### 使用场景

1. **客户端获取 IP 地址**：

    * 在 JavaScript 中通过 `fetch`​ 或 `XMLHttpRequest`​ 调用 `ipify`​ 的 API，获取用户的公网 IP 地址。

    **示例代码：**

    ```javascript
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            console.log('User IP:', data.ip);
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
        });
    ```
2. **服务器端获取 IP 地址**：

    * 在服务器端（如 Node.js、Python、PHP 等）调用 `ipify`​ 的 API，获取客户端的公网 IP 地址。

    **Node.js 示例：**

    ```javascript
    const axios = require('axios');

    axios.get('https://api.ipify.org?format=json')
        .then(response => {
            console.log('User IP:', response.data.ip);
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
        });
    ```
3. **调试和测试**：

    * 开发者可以使用 `ipify`​ 快速获取自己的公网 IP 地址，用于调试或测试网络配置。

---

### 优点

1. **简单易用**：

    * API 设计简洁，无需复杂的参数或认证。
2. **免费**：

    * 对于大多数开发者来说，完全免费使用。
3. **高可用性**：

    * 服务稳定，响应速度快。
4. **支持多种格式**：

    * 支持纯文本、JSON 和 JSONP 格式，方便集成到不同的项目中。

---

### 注意事项

1. **隐私问题**：

    * 获取用户的 IP 地址可能涉及隐私问题，确保遵守相关法律法规（如 GDPR）。
2. **请求频率限制**：

    * 免费版本可能有请求频率限制，如果需要更高的请求频率，可以考虑付费计划。
3. **依赖第三方服务**：

    * 由于 `ipify`​ 是第三方服务，如果服务不可用，可能会影响你的应用。建议在代码中添加错误处理逻辑。

---

### 类似服务

　　如果你需要替代方案，以下是一些类似的 IP 地址查询服务：

1. **ipinfo.io**：

    * 提供 IP 地址的详细信息（如地理位置、ISP 等）。
    * 免费版本有请求限制。
    * 官网：`https://ipinfo.io`​
2. **ipapi.co**：

    * 提供 IP 地址的地理位置、时区、货币等信息。
    * 免费版本有请求限制。
    * 官网：`https://ipapi.co`​
3. **ifconfig.me**：

    * 提供简单的 IP 地址查询服务。
    * 支持多种返回格式。
    * 官网：`https://ifconfig.me`​

---

### 总结

　　​`https://www.ipify.org/`​ 是一个简单、免费且可靠的 IP 地址查询服务，适合开发者快速获取用户的公网 IP 地址。无论是客户端还是服务器端，都可以轻松集成到项目中。如果需要更详细的信息（如地理位置），可以考虑使用其他类似服务。
