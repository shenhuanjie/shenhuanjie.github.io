---
title: 'vue yarn报错@achrinzanode-ipc@9.2.2: The engine “node“ is incompatible with this module.'
published: 2024-09-23T15:53:13.000Z
updated: 2024-09-23T15:54:01.000Z
draft: false
description: ''
tags:
  - Vue
  - yarn
  - Node.js
category: ''
---

```bash
@achrinza/node-ipc@9.2.2: The engine "node" is incompatible with this module. Expected version "8 || 10 || 12 || 14 || 16 || 17". Got "18.3.0"
```

输入以下命令：

```bash
yarn config set ignore-engines true
```
