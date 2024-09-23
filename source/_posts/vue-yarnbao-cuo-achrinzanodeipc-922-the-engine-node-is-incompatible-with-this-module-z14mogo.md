---
title: >-
  vue yarn报错@achrinzanode-ipc@9.2.2: The engine “node“ is incompatible with this
  module.
date: '2024-09-23 23:53:13'
updated: '2024-09-23 23:54:01'
tags:
  - Vue
  - yarn
  - Node.js
permalink: >-
  /post/vue-yarnbao-cuo-achrinzanodeipc-922-the-engine-node-is-incompatible-with-this-module-z14mogo.html
comments: true
toc: true
---

```bash
@achrinza/node-ipc@9.2.2: The engine "node" is incompatible with this module. Expected version "8 || 10 || 12 || 14 || 16 || 17". Got "18.3.0"
```

输入以下命令：

```bash
yarn config set ignore-engines true
```
