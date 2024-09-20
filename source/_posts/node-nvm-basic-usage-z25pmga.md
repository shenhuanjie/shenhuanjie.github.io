---
title: node nvm 基础用法
date: '2024-09-20 21:59:31'
updated: '2024-09-20 22:00:06'
tags:
  - Node
  - nvm
permalink: /post/node-nvm-basic-usage-z25pmga.html
comments: true
toc: true
---

NVM（Node Version Manager）是一个用于管理多个Node.js版本的工具。它允许你在同一台机器上安装和切换不同版本的Node.js，而不会相互干扰。以下是NVM的一些基础用法：

1. **安装NVM**:

    * 在Linux或macOS上，你可以使用CURL或WGET来安装NVM。例如，使用CURL:

      ```bash
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
      ```
    * 在Windows上，你可以使用nvm-windows。
2. **安装Node.js**:

    * 安装特定版本的Node.js:

      ```bash
      nvm install 14.17.0
      ```
    * 安装最新的LTS（长期支持）版本:

      ```bash
      nvm install --lts
      ```
    * 安装最新的Node.js版本:

      ```bash
      nvm install node
      ```
3. **列出已安装的Node.js版本**:

    ```bash
    nvm ls
    ```
4. **切换Node.js版本**:

    * 切换到特定版本:

      ```bash
      nvm use 14.17.0
      ```
    * 切换到最新的LTS版本:

      ```bash
      nvm use --lts
      ```
5. **设置默认Node.js版本**:

    * 设置默认版本，这样每次打开新的终端时都会使用这个版本:

      ```bash
      nvm alias default 14.17.0
      ```
6. **卸载Node.js版本**:

    ```bash
    nvm uninstall 14.17.0
    ```
7. **查看当前使用的Node.js版本**:

    ```bash
    node -v
    ```
8. **查看NVM的帮助信息**:

    ```bash
    nvm --help
    ```

确保在安装NVM之后，重启你的终端或者运行`source ~/.nvm/nvm.sh`​（Linux/macOS）来使NVM的命令立即可用。对于Windows用户，nvm-windows通常会自动设置好环境变量。

这些是NVM的一些基本命令，可以帮助你管理Node.js的不同版本。如果你需要更高级的用法，可以查看NVM的官方文档或使用`nvm --help`​命令获取更多信息。
