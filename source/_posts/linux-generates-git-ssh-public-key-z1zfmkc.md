---
title: Linux 生成 git ssh 公钥
date: '2024-09-14 16:08:20'
updated: '2024-09-14 16:09:04'
tags:
  - Linux
  - Git
  - SSH
permalink: /post/linux-generates-git-ssh-public-key-z1zfmkc.html
comments: true
toc: true
---

在Linux系统中生成SSH公钥以用于Git的步骤如下：

1. **打开终端**：首先，你需要打开你的Linux系统的终端。
2. **检查SSH密钥**：在生成新的SSH密钥之前，你可以检查是否已经存在SSH密钥。在终端中输入以下命令：

    ```bash
    ls -al ~/.ssh
    ```

    如果看到`id_rsa`​和`id_rsa.pub`​这样的文件，那么你已经有了SSH密钥。
3. **生成新的SSH密钥**：如果你没有SSH密钥，或者想要生成一个新的密钥，可以使用`ssh-keygen`​命令。在终端中输入以下命令：

    ```bash
    ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
    ```

    * ​`-t rsa`​ 表示使用RSA算法。
    * ​`-b 4096`​ 表示生成4096位的密钥，这是推荐的最小长度，以确保安全性。
    * ​`-C "your_email@example.com"`​ 是一个可选参数，用于添加一个注释，通常是你的电子邮件地址。

    在执行这个命令后，系统会提示你输入保存密钥的文件位置。默认位置是`~/.ssh/id_rsa`​，你可以直接按回车键接受。
4. **设置权限**：为了安全，你应该设置SSH密钥的权限，使得只有你自己可以读取。

    ```bash
    chmod 600 ~/.ssh/id_rsa
    ```
5. **复制公钥到Git服务器**：生成密钥对后，你需要将公钥（`.pub`​ 文件）的内容添加到你的Git服务器账户中。使用以下命令来复制公钥内容：

    ```bash
    cat ~/.ssh/id_rsa.pub
    ```

    然后，将输出的内容粘贴到你的Git服务器（如GitHub、GitLab等）的SSH密钥部分。
6. **测试SSH连接**：为了确保一切设置正确，你可以测试SSH连接。例如，如果你使用的是GitHub，可以使用以下命令：

    ```bash
    ssh -T git@github.com
    ```

    如果一切正常，你应该会看到一条欢迎消息。

按照这些步骤，你就可以在Linux系统中生成SSH公钥，并将其用于Git了。
