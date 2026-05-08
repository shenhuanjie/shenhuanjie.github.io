---
title: "Inside Claude Code Auto Mode: Anthropic’s Autonomous Coding System with Human Approval Gates"
date: 2026-05-05 00:00:00
updated: 2026-05-08
description: "Anthropic has introduced auto mode in Claude Code, enabling multi-step coding tasks with human approval gates"
cover:
  - https://res.infoq.com/news/2026/05/anthropic-claude-code-auto-mode/en/headerimage/generatedHeaderImage-1777787075311.jpg
categories:
  - AI资讯
tags:
  - InfoQ
  - AI
  - 资讯
source: InfoQ
source_link: https://www.infoq.com/news/2026/05/anthropic-claude-code-auto-mode/?utm_campaign=infoq_content&amp;utm_source=infoq&amp;utm_medium=feed&amp;utm_term=global
author: Leela Kumili
comments: true
toc: true
ai_generated: false
---

> 来源: InfoQ | [原文链接](https://www.infoq.com/news/2026/05/anthropic-claude-code-auto-mode/?utm_campaign=infoq_content&amp;utm_source=infoq&amp;utm_medium=feed&amp;utm_term=global)
> 采集时间: 2026-05-08 15:19:16

## 资讯概要

Anthropic在其受欢迎的AI编码工具Claude Code中推出**"自动模式"（Auto Mode）**功能，这是介于默认行为与"危险跳过权限"命令之间的中间路径。该模式允许AI在执行多步骤编码任务时自主选择操作权限，同时通过人类审批门控机制保持安全性。

## 详细内容

### 什么是Auto Mode？

Claude Code的默认行为要求AI为**每个文件写入和bash命令请求批准**。而一些开发者为了追求效率，会使用`--dangerously-skip-permissions`命令让AI完全自主运行，但这存在相当大的风险。

Auto Mode在这两个极端之间找到了一个**优雅的平衡点**——它允许AI自主执行低风险操作，同时在执行高风险操作前暂停等待人类确认。

### 核心安全机制：双层防御体系

Auto Mode采用**双层防御架构**：

1. **输入层：提示词注入探针（Prompt-injection Probe）**
   - 检测恶意指令，防止通过提示词注入攻击

2. **输出层：转录本分类器（Transcript Classifier）**
   - AI输出进行实时分类，判断是否需要人工介入

### 权限"漏斗"：三层放行规则

| 层级 | 操作类型 | 是否需要审批 |
|-----|---------|-------------|
| L1 | 读取文件、搜索代码、执行安全命令 | 自动放行 |
| L2 | 修改文件、创建新文件 | 风险评估后决定 |
| L3 | 删除文件、执行破坏性命令 | 必须审批 |

### 设计哲学

Anthropic的设计理念是**"基于模型的智能分类器"**——让AI自己判断某个操作是否需要人类批准。这解决了长期困扰开发者的问题：**审批疲劳**（Approval Fatigue）。

据调查，93%的Claude Code用户曾因频繁的审批提示而产生疲劳感，影响了开发效率。Auto Mode通过智能分类，显著减少了不必要的审批请求。

### 实际影响

这一功能发布后，IBM等大型企业的IT部门表示出浓厚兴趣——Claude Code可以帮助对老旧的COBOL系统进行现代化改造，这在一定程度上影响了IBM股价表现。

### 适用场景

Auto Mode特别适合：
- 已建立信任的**重复性任务**
- 大型代码重构项目
- 需要AI进行深度规划的多步骤任务
