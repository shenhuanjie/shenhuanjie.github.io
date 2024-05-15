---
title: 代理访问 OpenAI 接口示例 CURL
date: '2024-04-10 12:28:27'
updated: '2024-05-15 15:54:15'
permalink: /post/agent-visit-openai-interface-example-curl-zbioja.html
comments: true
toc: true
---

```sh
curl -X POST https://gateway.ai.cloudflare.com/v1/9c1001a32cac90822d5d3e51b2b828de2/api-openai/openai/chat/completions \
  -H 'Authorization: Bearer sk-NtofMMZRFomGigKTalH0T3Bl4AbkFJGY3Rl6GnfjsDzXe3dP7j' \
  -H 'Content-Type: application/json' \
  -d ' {
      "model": "gpt-4",
      "messages": [
        {
          "role": "user",
          "content": "ES 如何整合进 springboot，请给出尽可能详细的技术实现方案"
        }
      ]
    }'

```
