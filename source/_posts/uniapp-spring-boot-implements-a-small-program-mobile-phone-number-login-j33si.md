---
title: UNI-APP + Spring Boot 实现小程序手机号登录
date: '2025-01-15 14:09:55'
updated: '2025-01-15 14:10:41'
excerpt: >-
  本文介绍了使用UNI-APP和Spring
  Boot实现小程序手机号登录的完整方案。前端通过获取用户手机号授权并发送code到后端，后端通过微信小程序API获取手机号，处理用户登录逻辑，包括查询用户、创建新用户并返回登录凭证。方案详细描述了前端和后端的实现步骤和关键代码。
tags:
  - 小程序
  - 手机号
  - 登录
  - UNI-APP
  - Spring Boot
permalink: >-
  /post/uniapp-spring-boot-implements-a-small-program-mobile-phone-number-login-j33si.html
comments: true
toc: true
---





　　以下是整合后的完整方案，结合了 **UNI-APP 前端** 和 **Java Spring Boot 后端**，实现小程序手机号登录功能：

---

## 1. **前端实现：获取用户手机号并调用登录接口**

　　在 UNI-APP 中，使用 `button`​ 组件获取用户的手机号授权，并将授权后的 `code`​ 发送到后端登录接口。

### 1.1 前端代码

```vue
<template>
  <view>
    <button open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">手机号登录</button>
  </view>
</template>

<script>
export default {
  methods: {
    async getPhoneNumber(e) {
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        // 用户点击了允许授权
        const { code } = e.detail;

        // 调用后端登录接口
        const res = await uni.request({
          url: 'https://your-server.com/api/loginByPhone', // 替换为你的后端地址
          method: 'POST',
          data: { code },
        });

        if (res.data.success) {
          // 登录成功，保存用户信息和 token
          uni.setStorageSync('userInfo', res.data.data.user);
          uni.setStorageSync('token', res.data.data.token);
          uni.showToast({ title: '登录成功', icon: 'success' });
          uni.navigateTo({ url: '/pages/home/index' }); // 跳转到首页
        } else {
          uni.showToast({ title: '登录失败', icon: 'none' });
        }
      } else {
        // 用户点击了拒绝授权
        uni.showToast({ title: '用户拒绝授权', icon: 'none' });
      }
    }
  }
}
</script>
```

---

## 2. **后端实现：Spring Boot 处理登录逻辑**

　　后端需要完成以下任务：

1. 通过 `code`​ 获取用户的手机号。
2. 根据手机号查询用户是否存在。
3. 如果用户不存在，则创建新用户。
4. 返回用户信息和登录凭证（如 `token`​）。

### 2.1 添加依赖

　　在 `pom.xml`​ 中添加以下依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### 2.2 配置微信小程序信息

　　在 `application.properties`​ 中配置微信小程序的 `appid`​ 和 `secret`​：

```properties
wechat.appid=YOUR_APPID
wechat.secret=YOUR_APPSECRET
```

### 2.3 实现获取 `access_token`​ 和手机号

```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WechatService {

    @Value("${wechat.appid}")
    private String appid;

    @Value("${wechat.secret}")
    private String secret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 获取 access_token
    public String getAccessToken() throws Exception {
        String url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + secret;
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            String response = EntityUtils.toString(httpClient.execute(request).getEntity());
            JsonNode jsonNode = objectMapper.readTree(response);
            return jsonNode.get("access_token").asText();
        }
    }

    // 获取用户手机号
    public String getPhoneNumber(String code) throws Exception {
        String accessToken = getAccessToken();
        String url = "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=" + accessToken;

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost request = new HttpPost(url);
            request.setHeader("Content-Type", "application/json");
            String jsonBody = "{\"code\":\"" + code + "\"}";
            request.setEntity(new StringEntity(jsonBody));

            String response = EntityUtils.toString(httpClient.execute(request).getEntity());
            JsonNode jsonNode = objectMapper.readTree(response);
            return jsonNode.path("phone_info").path("phoneNumber").asText();
        }
    }
}
```

### 2.4 实现登录逻辑

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class LoginController {

    @Autowired
    private WechatService wechatService;

    @Autowired
    private UserService userService;

    @PostMapping("/api/loginByPhone")
    public ApiResponse loginByPhone(@RequestBody LoginRequest request) throws Exception {
        String code = request.getCode();
        String phoneNumber = wechatService.getPhoneNumber(code);

        // 查询用户是否存在
        User user = userService.findUserByPhoneNumber(phoneNumber);
        if (user == null) {
            // 如果用户不存在，创建新用户
            user = userService.createUser(phoneNumber);
        }

        // 生成 token（这里简单模拟）
        String token = "token_" + user.getUserId();

        // 返回用户信息和 token
        return new ApiResponse(true, "登录成功", new LoginResponse(user, token));
    }
}

// 用户实体类
class User {
    private String userId;
    private String phoneNumber;

    // Getters and Setters
}

// 用户服务类
@Service
class UserService {
    private final List<User> users = new ArrayList<>();

    public User findUserByPhoneNumber(String phoneNumber) {
        return users.stream()
                .filter(user -> user.getPhoneNumber().equals(phoneNumber))
                .findFirst()
                .orElse(null);
    }

    public User createUser(String phoneNumber) {
        User user = new User();
        user.setUserId(String.valueOf(System.currentTimeMillis()));
        user.setPhoneNumber(phoneNumber);
        users.add(user);
        return user;
    }
}

// 请求和响应类
class LoginRequest {
    private String code;

    // Getters and Setters
}

class LoginResponse {
    private User user;
    private String token;

    // Getters and Setters
}

class ApiResponse {
    private boolean success;
    private String message;
    private Object data;

    // Getters and Setters
}
```

---

## 3. **安全性注意事项**

1. ​**​`code`​**​ **的有效性**：确保 `code`​ 是一次性的，且及时使用。
2. ​**​`access_token`​**​ **缓存**：避免频繁请求微信 API，缓存 `access_token`​。
3. **HTTPS**：确保接口使用 HTTPS 加密传输。
4. **用户隐私**：手机号是敏感信息，确保存储和传输过程中加密。

---

## 4. **总结**

　　通过以上步骤，你可以实现以下功能：

1. 前端获取用户手机号授权，发送 `code`​ 到后端。
2. 后端通过 `code`​ 获取手机号，完成登录逻辑。
3. 前端保存登录状态，并在需要时校验登录状态。

　　这种方案既符合微信小程序的规范，又能满足常见的登录需求。
