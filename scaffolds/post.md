---
# 文章标题（必填）- 用于生成 URL 和页面标题
title: {{ title }}

# 发布日期（必填）- 格式：YYYY-MM-DD HH:mm:ss
date: {{ date }}

# 更新日期（选填）- 文章如有修改更新于此
updated: {{ updated }}

# 文章描述（必填）- SEO友好的简短描述，用于 Meta 标签和文章摘要
# 建议长度：80-150 字，避免超过 200 字
# 策略：优先 AI 生成 > 手动撰写 > 自动截取
description: 文章描述（SEO友好的简短描述，80-150字）

# 封面图片（选填）- 文章封面图路径
# 规范：JPG/WebP 格式，宽度 >= 600px，大小 <= 500KB
# 默认：/images/covers/cover-default.png
cover: /images/covers/cover-default.png

# 永久链接（选填）- 自定义文章 URL 格式
# 变量：{{ slug }} 自动从标题生成
permalink: /post/{{ slug }}.html

# 开启评论（选填）- 默认 true
comments: true

# 开启目录（选填）- 根据文章标题自动生成目录，默认 true
toc: true

# 分类（必填）- 用于文章归类，一个文章只能属于一个分类
# 规范：小写英文优先，中文可接受
# 示例：ai-application, tutorial, industry-news, tech-analysis
categories:
  - ai-application

# 标签（选填）- 用于文章标记，一篇文章可以有多个标签
# 规范：统一英文优先，全小写，连字符分隔
# 示例：llm, ai-agent, tutorial, open-source
tags:
  - llm
  - ai-application

# AI 摘要（选填）- AI 生成的文章摘要，用于 AI 相关功能
ai_summary:

# AI 生成标识（选填）- 标识文章是否由 AI 生成
# 值：true / false
ai_generated: false
---
