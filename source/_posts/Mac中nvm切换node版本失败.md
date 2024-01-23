---
title: Mac中nvm切换node版本失败
date: 2024-01-23 20:59:38
category:
  - node
tags:
  - node
  - nvm
---
Mac中使用 nvm 管理 node 版本，在使用指令：nvm use XXX 切换版本之后。

关闭终端，再次打开，输入 node -v 还是得到之前的 node 版本。

## 原因

因为 .nvm/aliases 文件中，default 中有个 node 的版本号，使用 nvm use 时，没法修改这个版本号。

## 解决方案

- 使用 nvm alias default XXX，将 XXX 设置为默认版本号

目前看来，Mac 中通过 nvm 长期有效的切换 node 版本可能需要两个指令：

- nvm use XXX（只对当前终端窗口有效）

- nvm alias default XXX（长期有效，即使关闭终端窗口后，再打开一个新的终端窗口）