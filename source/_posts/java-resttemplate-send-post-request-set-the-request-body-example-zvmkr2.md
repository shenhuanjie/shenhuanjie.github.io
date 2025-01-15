---
title: Java RestTemplate 发送 POST 请求设置请求体示例
date: '2025-01-15 20:12:06'
updated: '2025-01-15 20:13:43'
excerpt: >-
  本文介绍了如何在Java中使用RestTemplate发送POST请求并设置请求体参数。通过创建RestTemplate实例、设置请求URL、请求头和请求体，并使用HttpEntity封装，可以发送POST请求并获取响应。文章还提供了发送JSON和表单数据的示例代码，并说明了处理响应的方法。
tags:
  - Java
  - RestTemplate
  - POST
  - 请求
  - 设置
permalink: >-
  /post/java-resttemplate-send-post-request-set-the-request-body-example-zvmkr2.html
comments: true
toc: true
---





　　在 Java 中使用 `RestTemplate`​ 发送 POST 请求并设置请求体（body）参数，可以按照以下步骤进行。`RestTemplate`​ 是 Spring 提供的一个用于发送 HTTP 请求的工具类。

### 示例代码

　　以下是一个完整的示例，展示如何使用 `RestTemplate`​ 发送 POST 请求并设置请求体参数：

```java
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

public class RestTemplateExample {
    public static void main(String[] args) {
        // 1. 创建 RestTemplate 实例
        RestTemplate restTemplate = new RestTemplate();

        // 2. 设置请求 URL
        String url = "https://example.com/api/endpoint";

        // 3. 设置请求头（如果需要）
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON); // 设置请求体为 JSON 格式
        // 如果需要其他请求头，可以继续添加
        // headers.set("Authorization", "Bearer your_token");

        // 4. 设置请求体参数（以 Map 为例）
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("key1", "value1");
        requestBody.put("key2", "value2");

        // 5. 将请求体和请求头封装到 HttpEntity 中
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        // 6. 发送 POST 请求
        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

        // 7. 处理响应
        if (response.getStatusCode() == HttpStatus.OK) {
            System.out.println("请求成功，响应内容: " + response.getBody());
        } else {
            System.out.println("请求失败，状态码: " + response.getStatusCode());
        }
    }
}
```

### 代码说明

1. **创建** **​`RestTemplate`​**​ **实例**：

    * ​`RestTemplate`​ 是 Spring 提供的 HTTP 客户端工具，用于发送 HTTP 请求。
2. **设置请求 URL**：

    * 将目标 API 的 URL 设置为 `url`​ 变量。
3. **设置请求头**：

    * 使用 `HttpHeaders`​ 设置请求头，例如 `Content-Type`​ 为 `application/json`​。
    * 如果需要其他请求头（如 `Authorization`​），可以继续添加。
4. **设置请求体**：

    * 使用 `Map`​ 或其他对象（如自定义的 Java 对象）作为请求体。
    * 如果需要发送 JSON 数据，可以将 `Map`​ 或对象转换为 JSON 格式。
5. **封装请求体和请求头**：

    * 使用 `HttpEntity`​ 将请求体和请求头封装在一起。
6. **发送 POST 请求**：

    * 使用 `restTemplate.postForEntity`​ 方法发送 POST 请求。
    * 该方法返回一个 `ResponseEntity`​ 对象，包含响应状态码和响应体。
7. **处理响应**：

    * 检查响应状态码（如 `HttpStatus.OK`​），并处理响应体。

### 其他注意事项

* 如果需要发送复杂的 JSON 数据，可以定义一个 Java 类来表示请求体，然后直接传递该类的实例。
* 如果需要发送表单数据（`application/x-www-form-urlencoded`​），可以使用 `MultiValueMap`​ 作为请求体。
* 如果 API 需要其他认证方式（如 OAuth2.0），可以在请求头中添加 `Authorization`​。

### 示例：发送表单数据

　　如果需要发送表单数据，可以这样写：

```java
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

// 设置表单数据
MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
formData.add("key1", "value1");
formData.add("key2", "value2");

// 设置请求头为表单格式
headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

// 发送请求
HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formData, headers);
ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
```

　　希望这个示例对你有帮助！如果有其他问题，欢迎继续提问。
