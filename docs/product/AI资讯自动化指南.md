# AI 资讯自动化指南

**适用范围：** shenhuanjie.github.io 博客
**维护人：** 内容运营团队
**最后更新：** 2026-05-08

---

## 一、概述

本文档介绍如何使用自动化脚本采集、质检和发布 AI 资讯内容。

### 自动化流程

```
RSS 采集 ──> 草稿生成 ──> 质量检查 ──> 定时发布 ──> Hexo 部署
```

### 脚本列表

| 脚本 | 功能 | 路径 |
|------|------|------|
| ai-news-fetch.js | RSS 资讯采集 | scripts/ai-news-fetch.js |
| quality-check.js | 文章质量检查 | scripts/quality-check.js |
| scheduled-publish.js | 定时发布管理 | scripts/scheduled-publish.js |
| ai-helper.js | AI 元数据生成 | scripts/ai-helper.js |
| ai-filter.js | Hexo 过滤器 | scripts/ai-filter.js |

---

## 二、环境配置

### 2.1 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# AI Helper 配置
ANTHROPIC_API_KEY=your_key_here

# RSS 采集配置（可选）
AI_NEWS_KEYWORDS=AI,大模型,LLM,ChatGPT
AI_NEWS_LIMIT=10
AI_NEWS_AS_DRAFT=true

# 定时发布配置（可选）
PUBLISH_MAX_PER_DAY=5
PUBLISH_TIME_ZONE=Asia/Shanghai
```

### 2.2 依赖安装

```bash
npm install
```

---

## 三、RSS 采集脚本

### 3.1 功能说明

`ai-news-fetch.js` 从多个 RSS 源采集 AI 相关资讯，自动生成 Hexo 格式草稿。

### 3.2 支持的 RSS 源

| 来源 | 名称 | 路径 |
|------|------|------|
| 36kr | 36氪 | https://36kr.com/feed |
| ithome | IT之家 | https://www.ithome.com/rss/ |
| oschina | 开源中国 | https://www.oschina.net/news/rss |
| infoq | InfoQ | https://feed.infoq.com/ |
| ai-plus | AI前线 | (自定义 RSS) |

### 3.3 使用方法

```bash
# 基本用法 - 采集所有源的资讯
node scripts/ai-news-fetch.js

# 限制每源采集数量
node scripts/ai-news-fetch.js --limit 20

# 只采集指定来源
node scripts/ai-news-fetch.js --source 36kr

# 预览模式（不创建文件）
node scripts/ai-news-fetch.js --dry-run

# 显示支持的源列表
node scripts/ai-news-fetch.js --list-sources
```

### 3.4 关键词配置

默认关键词过滤：

```
AI, 人工智能, 大模型, LLM, GPT, Claude, ChatGPT, OpenAI, AIGC,
生成式AI, 机器学习, 深度学习, 神经网络, RAG, Agent, 智能体
```

可通过环境变量自定义：

```bash
AI_NEWS_KEYWORDS="AI,大模型,ChatGPT" node scripts/ai-news-fetch.js
```

### 3.5 输出说明

- 草稿输出到 `source/_drafts/` 目录
- 文件名格式：标题 slug（中文转拼音/英文）
- 自动生成 front-matter（title, date, categories, tags, source_link）

---

## 四、质量检查脚本

### 4.1 功能说明

`quality-check.js` 检查文章的元数据完整性和内容质量。

### 4.2 检查项目

#### 必须字段检查
- [x] title - 文章标题
- [x] date - 发布日期（YYYY-MM-DD）
- [x] categories - 分类
- [x] tags - 标签

#### 推荐字段检查
- [ ] description - SEO 描述
- [ ] cover - 封面图
- [ ] permalink - 永久链接
- [ ] updated - 更新日期

#### 内容质量检查
- 标题长度（5-100 字）
- 内容长度（最少 100 字）
- 代码块语言标识
- 摘要长度（30-300 字）

### 4.3 使用方法

```bash
# 检查所有文章
node scripts/quality-check.js

# 检查指定目录
node scripts/quality-check.js source/_drafts/

# 检查指定文件
node scripts/quality-check.js source/_posts/my-article.md

# 详细输出
node scripts/quality-check.js --verbose

# 环境变量控制
QC_STRICT=true node scripts/quality-check.js
```

### 4.4 输出示例

```
===========================================
文章质量检查脚本
===========================================
检查路径: source/_posts
===========================================

✓ source/_posts/2026-ai-news-week1.md
  警告 建议添加字段: cover
  字数: 1500 | 预计阅读: 3 分钟

✗ source/_posts/draft-untitled.md
  错误 缺少必须字段: title
  错误 缺少必须字段: date

===========================================
检查摘要
===========================================
总计: 2 篇
通过: 1
失败: 1
错误: 2
警告: 1
===========================================
```

---

## 五、定时发布脚本

### 5.1 功能说明

`scheduled-publish.js` 管理草稿到文章的发布流程，支持定时规则和批量处理。

### 5.2 发布时间规则

默认配置：
- 发布日：周一、周三、周五
- 发布时间：9:00、14:00、20:00
- 每日上限：5 篇

可在脚本中修改 `CONFIG.scheduleRules` 调整。

### 5.3 使用方法

```bash
# 检查并发布待发布的草稿
node scripts/scheduled-publish.js

# 列出所有待发布草稿
node scripts/scheduled-publish.js --list

# 预览模式（不实际发布）
node scripts/scheduled-publish.js --dry-run

# 立即发布指定文件（忽略 schedule）
node scripts/scheduled-publish.js --now source/_drafts/my-draft.md

# 强制覆盖已存在的文件
node scripts/scheduled-publish.js --now source/_drafts/my-draft.md --force

# 显示当前配置
node scripts/scheduled-publish.js --config
```

### 5.4 front-matter 中的发布控制

草稿文件中可以设置 `schedule` 或 `publish_date` 字段：

```yaml
---
title: 我的文章
date: 2026-05-08
schedule: 2026-05-10 09:00  # 指定发布时间
# 或使用相对时间
# schedule: +1d  (1天后)
# schedule: +2h  (2小时后)
---
```

---

## 六、AI 元数据生成

### 6.1 ai-helper.js

提供 AI 辅助功能：

```bash
# 生成文章摘要
node scripts/ai-helper.js --help

# 清除所有缓存
node scripts/ai-helper.js --clear

# 清除过期缓存
node scripts/ai-helper.js --clean
```

### 6.2 ai-filter.js

Hexo 过滤器，在保存文章时自动生成：
- AI 摘要（ai_summary）
- SEO 描述（description）
- 标签推荐

需在 `_config.yml` 中启用：

```yaml
ai_auto_generate: true
```

---

## 七、完整工作流

### 7.1 手动采集发布流程

```bash
# 1. 采集资讯（生成草稿）
node scripts/ai-news-fetch.js --limit 10

# 2. 检查草稿质量
node scripts/quality-check.js source/_drafts/

# 3. 编辑草稿（补充内容、封面图等）
# 使用编辑器打开 source/_drafts/ 下的文件

# 4. 预览效果
npm run server

# 5. 发布草稿
node scripts/scheduled-publish.js --now source/_drafts/my-draft.md

# 6. 部署
npm run deploy
```

### 7.2 CI/CD 集成

可在 GitHub Actions 中集成：

```yaml
# .github/workflows/ai-news.yml
name: AI News Automation

on:
  schedule:
    # 每周一、周三、周五 8:00 执行
    - cron: '0 8 * * 1,3,5'

jobs:
 采集:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Fetch AI News
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node scripts/ai-news-fetch.js

      - name: Check Quality
        run: node scripts/quality-check.js source/_drafts/

      - name: Commit drafts
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: 自动采集 AI 资讯'
          file_pattern: 'source/_drafts/*.md'
```

---

## 八、常见问题

### Q1: RSS 采集失败

**可能原因：**
- 网络连接问题
- RSS 源不可用
- 请求被限流

**解决方案：**
- 检查网络连接
- 稍后重试
- 使用 `--dry-run` 预览

### Q2: 质量检查报错 "未找到 front-matter"

**可能原因：**
- 文件格式不正确
- YAML 语法错误

**解决方案：**
- 检查文件开头是否有 `---`
- 检查 YAML 缩进是否正确

### Q3: 定时发布未生效

**可能原因：**
- 草稿设置了未来的 `schedule` 时间
- 达到每日发布上限
- 不在允许的发布时间段

**解决方案：**
- 使用 `--now` 立即发布
- 检查 `source/_drafts/` 中的文件

### Q4: Claude API 调用失败

**可能原因：**
- API Key 未设置或无效
- API 配额用尽
- 网络问题

**解决方案：**
- 检查 `.env` 中的 `ANTHROPIC_API_KEY`
- 查看 https://console.anthropic.com 查看配额

---

## 九、配置文件参考

### 9.1 RSS 源配置 (ai-news-fetch.js)

```javascript
const RSS_SOURCES = {
  '36kr': {
    name: '36氪',
    url: 'https://36kr.com/feed',
    language: 'zh'
  },
  // 添加更多源...
};
```

### 9.2 发布规则配置 (scheduled-publish.js)

```javascript
const CONFIG = {
  scheduleRules: {
    days: [1, 3, 5],        // 周一、周三、周五
    hours: [9, 14, 20],     // 9:00、14:00、20:00
    strict: false
  },
  maxPerDay: 5
};
```

---

## 十、附录

### 10.1 相关文档

- [文章质量检查清单](./文章质量检查清单.md)
- [迭代规划-v1.8.md](./迭代规划-v1.8.md)

### 10.2 联系方式

如有问题，请提交 Issue 或联系维护团队。

---

**维护记录：**

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-05-08 | v1.0 | 初始版本，包含基础自动化脚本 |
