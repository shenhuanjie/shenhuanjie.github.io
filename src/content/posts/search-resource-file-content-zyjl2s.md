---
title: 搜索资源文件内容
published: 2023-08-05T15:02:18.000Z
updated: 2024-02-03T16:45:47.000Z
draft: false
description: 在 <kbd搜索</kbd​ 界面右上角可以将搜索功能切换到 <kbd搜索资源文件内容</kbd​，目前支持如下格式的资源文件内容搜索：
tags: []
category: ''
---

# 搜索资源文件内容

在 <kbd>搜索</kbd>​ 界面右上角可以将搜索功能切换到 <kbd>搜索资源文件内容</kbd>​，目前支持如下格式的资源文件内容搜索：

* 文本文件（.txt、.md、.json、.log、.sql、.html、.xml、.java、.h、.c、.cpp、.go、.rs、.swift、.kt、.py、.php、.js、.css、.ts、.sh、.bat、.cmd、.ini、.yaml、.rst、.adoc、.textile、.opml、.org、.wiki）
* .docx
* .pptx
* .xlsx
* .pdf

​#注意#​​：

* 不支持大于 4MB 的文本文件
* 不支持大于 1024 页的 PDF
* 默认不支持大于 128MB 的 PDF，可通过环境变量 `SIYUAN_PDF_ASSET_CONTENT_INDEX_MAX_SIZE`​ 设置，值的单位是字节，比如：`SIYUAN_PDF_ASSET_CONTENT_INDEX_MAX_SIZE=256000000`​ 将上限调整为 256MB
* Android/iOS 端不支持 PDF 资源文件内容搜索
