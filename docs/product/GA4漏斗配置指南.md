# GA4 漏斗配置指南

**版本：** v2.13
**更新日期：** 2026-05-11
**追踪代码位置：** `themes/Chic/layout/_page/post.ejs`

---

## 一、用户漏斗设计

### 漏斗阶段定义

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户增长漏斗模型                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1          Step 2          Step 3          Step 4        │
│  首页浏览    →   文章点击    →   文章阅读    →   深度互动      │
│                                                                 │
│  homepage_view   article_click   article_read   deep_engagement │
│                                                                 │
│  [进入]          [点击阅读]      [阅读中]       [75%滚动+]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 漏斗阶段详情

| 阶段 | 事件名称 | 触发条件 | 关键指标 |
|------|----------|----------|----------|
| 1 | `homepage_view` | 用户访问首页 | 浏览量 |
| 2 | `article_click` | 用户点击文章链接 | 点击率 (CTR) |
| 3 | `article_read` | 页面加载完成 | 阅读开始 |
| 4 | `deep_engagement` | 滚动超过 75% | 深度互动率 |

---

## 二、GA4 事件追踪列表

### 2.1 漏斗事件 (T35.1)

| 事件名称 | 参数 | 说明 |
|----------|------|------|
| `funnel_step` | step, step_number, article_id, article_category | 漏斗阶段追踪 |

**事件示例：**
```javascript
gtag('event', 'funnel_step', {
    step: 'homepage_view',
    step_number: 1,
    article_id: '文章标题',
    article_category: 'AI大模型'
});
```

### 2.2 内容效果事件 (T35.2)

| 事件名称 | 参数 | 说明 |
|----------|------|------|
| `scroll_depth_25` | article_id, scroll_depth, max_scroll_depth | 25% 滚动深度 |
| `scroll_depth_50` | article_id, scroll_depth, max_scroll_depth | 50% 滚动深度 |
| `scroll_depth_75` | article_id, scroll_depth, max_scroll_depth | 75% 滚动深度 |
| `scroll_depth_90` | article_id, scroll_depth, max_scroll_depth | 90% 滚动深度 |
| `article_completed` | article_id, total_time_seconds, visible_time_seconds | 完读事件 |
| `article_bounce` | article_id, is_bounce, max_scroll_depth | 跳出事件 |
| `reading_time_update` | article_id, total_time_seconds, visible_time_seconds | 阅读时长更新 |
| `reading_time_final` | article_id, total_time_seconds, visible_time_depth | 阅读时长最终 |

### 2.3 用户互动事件

| 事件名称 | 参数 | 说明 |
|----------|------|------|
| `share` | method, content_type, article_id | 分享事件 |
| `bookmark_add` | article_id, article_category | 收藏事件 |
| `related_article_click` | from_article, to_article, click_position | 相关文章点击 |
| `article_view` | article_id, article_category, reading_time | 文章浏览 |

### 2.4 A/B 测试事件 (T35.3)

| 事件名称 | 参数 | 说明 |
|----------|------|------|
| `ab_test_exposure` | experiment_id, experiment_name, variant | 实验曝光 |
| `share_action` | article_id, share_method, variant | 实验转化追踪 |

---

## 三、GA4 漏斗配置步骤

### 3.1 在 GA4 中创建漏斗

1. **登录 GA4 管理后台**
   - 访问 https://analytics.google.com/
   - 选择目标媒体资源

2. **创建自定义漏斗**
   - 进入「配置」→「漏斗」
   - 点击「新建漏斗」
   - 填写漏斗名称

3. **添加漏斗步骤**
   ```
   步骤 1: homepage_view
   步骤 2: article_click
   步骤 3: scroll_depth_75
   步骤 4: article_completed
   ```

### 3.2 漏斗可视化配置 (Google Analytics)

```javascript
// GA4 漏斗配置参数
{
    funnel_name: "文章阅读漏斗",
    steps: [
        {
            name: "首页浏览",
            event: "homepage_view",
            target: "首页"
        },
        {
            name: "文章点击",
            event: "article_click",
            target: "文章链接"
        },
        {
            name: "文章阅读",
            event: "scroll_depth_50",
            target: "文章详情页"
        },
        {
            name: "深度互动",
            event: "scroll_depth_75",
            target: "深度阅读用户"
        }
    ]
}
```

---

## 四、关键指标定义

### 4.1 漏斗转化率

| 指标 | 计算公式 | 目标值 |
|------|----------|--------|
| 首页→文章点击率 | 点击次数 / 首页浏览量 | > 15% |
| 点击→阅读完成率 | 阅读完成 / 点击次数 | > 40% |
| 阅读→深度互动率 | 深度互动 / 阅读开始 | > 30% |
| 总体转化率 | 深度互动 / 首页浏览 | > 2% |

### 4.2 内容效果指标

| 指标 | 定义 | 目标值 |
|------|------|--------|
| 平均阅读时长 | 读者在页面上停留的时间 | > 3 分钟 |
| 完读率 | 滚动 > 90% 的用户比例 | > 25% |
| 跳出率 | 停留 < 10秒 或 滚动 < 30% | < 50% |
| 平均滚动深度 | 用户滚动百分比平均值 | > 50% |

### 4.3 互动指标

| 指标 | 定义 | 目标值 |
|------|------|--------|
| 分享率 | 分享次数 / 文章浏览量 | > 2% |
| 收藏率 | 收藏次数 / 文章浏览量 | > 5% |
| 相关文章点击率 | 相关文章点击 / 文章浏览量 | > 10% |

---

## 五、数据看板配置

### 5.1 GA4 自定义报告

```
报告名称: 用户增长漏斗分析
维度:
  - 文章类别 (article_category)
  - 作者 (author)
  - 日期

指标:
  - 漏斗转化率
  - 平均阅读时长
  - 完读率
  - 跳出率
```

### 5.2 自动化看板 (GDS)

可以使用 Google Data Studio 创建自动化看板，连接 GA4 数据源。

---

## 六、配置检查清单

- [x] T35.1 用户漏斗分析代码已添加
- [x] T35.2 内容效果分析代码已添加
- [x] 滚动深度追踪 (25%, 50%, 75%, 90%)
- [x] 阅读时长追踪
- [x] 跳出率分析
- [x] 完读率追踪 (90%)
- [ ] GA4 后台漏斗配置
- [ ] 数据看板创建
- [ ] 历史数据回溯

---

## 七、事件追踪代码位置

所有追踪代码位于：
```
themes/Chic/layout/_page/post.ejs
```

代码结构：
- 第 288-430 行：GA4 用户增长分析追踪代码
- 函数：`abTest` (A/B测试框架)、`funnel` (漏斗追踪)、`contentAnalytics` (内容分析)

---

## 八、常见问题

### Q1: 如何验证追踪是否生效？
A: 使用 GA4 DebugView 或 Chrome 扩展 "GA Debugger" 查看实时事件。

### Q2: 如何处理已存在的文章？
A: 追踪代码对所有文章自动生效，无需额外配置。

### Q3: 漏斗数据丢失怎么办？
A: 检查 GA4 Measurement ID 配置是否正确，确认 gtag.js 已正确加载。
