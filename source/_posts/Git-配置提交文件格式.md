---
title: Git 配置提交文件格式
date: 2024-01-28 23:47:17
category:
  - Git
tags:
  - Git
---

在 Git 中可以通过设置 core.autocrlf 来控制提交的文件格式。该选项有三种取值：

1. true: 表示将换行符转换为 CRLF（Carriage Return + Line Feed）并进行提交；这适用于 Windows 系统上使用 Git Bash、Cygwin
   等工具时。
2. input: 表示保持原始的 LF（Line Feed）换行符不变，但会自动将 CRLF 转换为 LF 后再进行提交；这适用于跨平台开发或与其他人共同开发时。
3. false: 表示完全按照源文件的换行符进行提交，无需任何转换。

要查看当前的配置情况，可以运行命令 git config --get core.autocrlf。如果结果显示 "true"
，则说明已经启用了自动转换功能；如果结果显示 "input"，则说明只对输入内容进行转换而不影响提交；如果结果显示 "false"
，则说明没有启用自动转换功能。

若想修改配置，可以使用下面的命令之一：

* git config --global core.autocrlf true：全局生效，所有新建的仓库都默认启用自动转换功能。
* git config --local core.autocrlf input：本地生效，只对当前仓库生效。
* git config core.autocrlf false：临时性生效，只对当前操作生效。
