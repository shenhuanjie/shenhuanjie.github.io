---
title: Docker 日志文件过大问题的解决方案
date: '2024-11-21 12:15:34'
updated: '2024-11-21 12:18:01'
tags:
  - Docker
  - 服务器运维
  - 日志清理
permalink: /post/docker-log-file-is-too-large-problem-solutions-z22pknw.html
comments: true
toc: true
---

## 问题场景

今天我们来聊聊一个让不少 Docker 用户头疼的问题——日志文件越积越多，磁盘空间越来越紧张。想象一下，你的硬盘里塞满了 Docker 日志，就像一个装满杂物的抽屉，想找点有用的东西都得翻半天。别担心，今天我们就来分享一些小窍门，帮你轻松搞定这些“杂物”，让你的 Docker 环境整洁有序。

## 识别问题

你有没有检查过 `/var/lib/docker/containers/`​ 这个目录？这里面藏着每个 Docker 容器的日志文件。这些日志文件就像不请自来的客人，悄悄占据了你宝贵的磁盘空间。如果不及时清理，它们可能会让你的硬盘喘不过气来。

## 手动清理日志文件

手动清理日志文件就像大扫除，虽然能解决问题，但实在是费时费力。你可以用 `docker logs`​ 命令看看日志内容，然后用 `truncate`​ 或者 `echo`​ 命令把日志文件清空。比如这样：

```bash
truncate -s 0 /var/lib/docker/containers/<container_id>/*.log
```

或者更简单的：

```bash
echo "" > /var/lib/docker/containers/<container_id>/*.log
```

## 自动化清理脚本

但是，谁想天天做清洁工呢？我们可以写个脚本来自动帮我们清理。这个脚本会找到所有超过100MB的 `.log`​ 文件，然后把它们清空。下面是脚本的代码：

```bash
#!/bin/bash

# 获取当前时间戳
timestamp=$(date +"%Y%m%d_%H%M%S")

# 定义输出文件名
output_file="log_cleanup_$timestamp.txt"

# 输出开始清理日志的信息，并重定向到文件
echo "开始清理大于100MB的.log文件..." > "$output_file"

# 查找当前目录及子目录下所有大于100MB的.log文件
log_files=$(find /var/lib/docker/containers/ -type f -name "*.log" -size +100M)

# 检查是否找到文件
if [ -z "$log_files" ]; then
    echo "没有找到大于100MB的.log文件。" >> "$output_file"
else
    # 列出找到的文件，并重定向到文件
    echo "找到的文件：" >> "$output_file"
    echo "$log_files" >> "$output_file"

    # 清空找到的文件内容
    for file in $log_files; do
        # 清空文件并记录结果，重定向到文件
        echo "" > "$file" && echo "已清空文件：$file" >> "$output_file"
    done
fi

# 输出清理完成的信息，并重定向到文件
echo "清理完成。" >> "$output_file"
```

## 设置定时任务

为了定期执行这个脚本，我们可以使用 `cron`​ 来设置一个定时任务。编辑 `crontab`​ 文件并添加以下行：

```text
0 1 * * * /path/to/clean_logs.sh
```

这行命令会在每天凌晨1点执行 `clean_logs.sh`​ 脚本。

## 结尾语

好了，今天的分享就到这里。通过这个自动化脚本，我们可以轻松地管理 Docker 日志文件的大小，让硬盘空间不再被无谓地占用。希望这些小技巧能帮助你让你的 Docker 环境更加健康。记得时不时检查一下脚本，确保它适应你的最新需求。

原文链接：[https://skyner.cn/archives/docker-log-file-is-too-large-problem-solutions-z22pknw](https://skyner.cn/archives/docker-log-file-is-too-large-problem-solutions-z22pknw)

‍
