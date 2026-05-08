# 监控配置说明

本文档描述博客站点的监控和告警配置方案。

## 监控目标

- 实时监控站点可用性
- 及时发现并响应异常
- 追踪性能指标变化

---

## 一、可用性监控

### 1.1 UptimeRobot（推荐）

免费且易用的站点监控服务。

**配置步骤**：

1. 注册 [UptimeRobot](https://uptimerobot.com/)
2. 添加监控项：
   - 监控类型：HTTP(s)
   - 监控间隔：5 分钟
   - 告警渠道：邮件/微信

3. 配置告警阈值：
   - 连续 2 次失败触发告警
   - 恢复后发送通知

### 1.2 GitHub Pages 状态

GitHub Pages 自带基础监控，可关注 [GitHub Status](https://www.githubstatus.com/)。

---

## 二、性能监控

### 2.1 Google Analytics 4

已集成 GA4 用于流量分析。

**配置说明**：
- 跟踪 ID：在 `_config.yml` 中配置
- 事件追踪：文章阅读、分享点击等

### 2.2 百度统计（可选）

国内访问统计补充方案。

**配置步骤**：

1. 注册百度统计
2. 获取跟踪代码
3. 在主题文件中引入

---

## 三、错误监控

### 3.1 页面错误追踪

通过 GA4 事件追踪 JS 错误：

```javascript
window.onerror = function(msg, url, line) {
  gtag('event', 'error', {
    'event_category': 'JS Error',
    'event_label': `${msg} at ${line}`
  });
};
```

### 3.2 死链监控

定期检查死链，避免用户体验和 SEO 损失。

**工具推荐**：
- [Google Search Console](https://search.google.com/search-console)
- [Broken Link Checker](https://www.brokenlinkcheck.com/)

---

## 四、告警配置

### 4.1 告警级别

| 级别 | 触发条件 | 响应时间 |
|------|----------|----------|
| P0 - 紧急 | 站点完全不可用 | 15 分钟内 |
| P1 - 重要 | 关键功能异常 | 1 小时内 |
| P2 - 一般 | 性能下降 | 24 小时内 |

### 4.2 告警渠道

| 渠道 | 适用场景 |
|------|----------|
| 邮件 | 低优先级告警 |
| 微信 | 重要/紧急告警 |
| 短信 | P0 级别告警 |

---

## 五、巡检清单

### 每日检查

- [ ] 查看 UptimeRobot 状态
- [ ] 检查 GA4 数据异常

### 每周检查

- [ ] Google Search Console 错误
- [ ] 死链扫描
- [ ] 性能数据趋势

### 每月检查

- [ ] 监控配置有效性
- [ ] 备份完整性验证
- [ ] SSL 证书有效期

---

## 六、相关文档

- [数据分析配置指南](../product/数据分析配置指南.md)
- [SEO 检查清单](../seo/seo-checklist.md)
- [备份指南](./备份指南.md)