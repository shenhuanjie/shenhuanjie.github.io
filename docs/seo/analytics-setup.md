# Google Analytics 4 配置指南

## 目录
- [创建 GA4 账号](#创建-ga4-账号)
- [配置测量 ID](#配置-测量-id)
- [核心事件追踪](#核心事件追踪)
- [Search Console 验证](#search-console-验证)
- [月度数据检查清单](#月度数据检查清单)

---

## 创建 GA4 账号

### 步骤 1：注册 Google Analytics
1. 访问 [Google Analytics](https://analytics.google.com/)
2. 使用 Google 账号登录
3. 点击 "开始衡量" 按钮

### 步骤 2：创建媒体资源
1. 输入账户名称（建议使用个人/公司名称）
2. 配置媒体资源设置：
   - 时区：中国（China）
   - 币种：人民币（CNY）
3. 点击 "下一步"

### 步骤 3：业务信息
1. 选择业务规模
2. 选择主要业务类型：内容/新闻/视频

### 步骤 4：获取测量 ID
1. 选择 "Web" 平台
2. 输入网站 URL：https://shenhuanjie.github.io/
3. 输入网站名称
4. 点击 "获取测量 ID"
5. 复制显示的 Measurement ID（如 G-XXXXXXXXXX）

---

## 配置测量 ID

### 更新主题配置

编辑 `themes/Chic/_config.yml`：

```yaml
google_analytics:
  enable: true
  tracking_id: G-XXXXXXXXXX  # 替换为你的实际测量 ID
```

### 验证配置
1. 部署博客
2. 访问网站首页
3. 在 GA4 Realtime 报告中查看当前访问者
4. 确认页面浏览被正确记录

---

## 核心事件追踪

博客已自动追踪以下事件：

### 页面浏览（自动）
- **事件名**：page_view
- **触发**：每次页面加载
- **参数**：page_location, page_path, page_title

### 文章阅读追踪

在 `source/js/user-interaction.js` 中实现：

```javascript
// 阅读进度追踪
function trackReadingProgress(postId, progress) {
  gtag('event', 'reading_progress', {
    event_category: 'engagement',
    event_label: postId,
    value: Math.round(progress)
  });
}
```

### 收藏功能追踪

```javascript
// 收藏事件
function trackFavorite(postId, action) {
  gtag('event', 'favorite_action', {
    event_category: 'engagement',
    event_label: postId,
    action: action  // 'add' 或 'remove'
  });
}
```

### 评论事件追踪

通过 Utterances 回调实现：

```javascript
// 评论事件
function trackComment(postId) {
  gtag('event', 'comment', {
    event_category: 'engagement',
    event_label: postId
  });
}
```

### 自定义事件配置

如需添加更多事件，在 `user-interaction.js` 中添加：

```javascript
// 示例：滚动到底部追踪
function trackScrollDepth(postId, depth) {
  gtag('event', 'scroll_depth', {
    event_category: 'engagement',
    event_label: postId,
    depth: depth  // 25, 50, 75, 100
  });
}
```

---

## Search Console 验证

### 方法一：HTML 文件验证（推荐）

1. 登录 [Search Console](https://search.google.com/search-console)
2. 选择 "网域" 或 "网址前缀"
3. 下载验证 HTML 文件
4. 将文件放入 `source/` 目录
5. 部署博客
6. 点击 "验证"

### 方法二：HTML 元标签验证

验证 HTML 已包含在 head.ejs 中，自动生效。

### 验证步骤
1. 登录 Search Console
2. 选择资源
3. 点击左侧菜单 "设置" > "用户和权限"
4. 确认所有权状态显示 "有效"

---

## 月度数据检查清单

### 每周检查
- [ ] Realtime 报告：确认实时访客正常
- [ ] Top pages：检查热门文章
- [ ] 流量来源：确认搜索引擎引荐正常

### 每月检查
- [ ] 访问量趋势：对比上月数据
- [ ] 用户地域分布：分析读者分布
- [ ] 设备分布：确认移动端比例
- [ ] 跳出率：检查高跳出率页面
- [ ] 平均会话时长：评估内容质量

### 关键指标目标
| 指标 | 目标值 |
|------|--------|
| 日均访问量 | > 100 |
| 平均会话时长 | > 2 分钟 |
| 跳出率 | < 60% |
| 移动端占比 | > 50% |

### 季度检查
- [ ] SEO 表现：搜索流量趋势
- [ ] 内容效果：识别高/低表现文章
- [ ] 转化追踪：收藏、评论、分享率
- [ ] 技术问题：检查抓取错误

---

## 常见问题

### Q: GA4 显示 "无数据"
**解决方案**：
1. 确认 measurement ID 配置正确
2. 清除浏览器缓存后重试
3. 使用 GA Debug 模式检查
4. 确认网站已部署且可访问

### Q: Realtime 显示 0 用户但有历史数据
**解决方案**：
1. 检查广告拦截器
2. 确认网站可公开访问
3. 检查 analytics.js 是否被正确加载

### Q: 如何追踪外部链接点击？
在 `user-interaction.js` 中添加：

```javascript
document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', function() {
    gtag('event', 'outbound_click', {
      event_category: 'engagement',
      event_label: this.href
    });
  });
});
```

---

## 相关资源

- [GA4 官方文档](https://support.google.com/analytics/answer/10089681)
- [Google Tag Manager](https://tagmanager.google.com/)
- [Search Console 帮助](https://support.google.com/webmasters/)
