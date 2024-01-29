---
title: 通过 CDN 使用 Vue 组合式 API
date: 2024-01-29 19:35:08
category:
  - Vue
tags:
  - Vue
  - 组合式 API
  - CDN
---

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>通过 CDN 使用 Vue 组合式 API</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
        }

        #app {
            color: #222;
            padding: 10px;
        }
    </style>
</head>

<body>
    <div id="app">
        <span>Message：{{ msg}}</span>
        <button @click="increment">Click Me</button>
    </div>

    <script>
        const { createApp, ref } = Vue

        const msg = ref('Hello Vue!')

        function increment() {
            msg.value = '你好 Vue！'
        }
        // 创建Vue应用
        const app = createApp({
            setup() {
                return {
                    msg, increment
                };
            }
        }).mount('#app');
    </script>
</body>

</html>
```
