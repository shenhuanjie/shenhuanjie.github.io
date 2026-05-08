# 前端性能优化指南

本文档提供博客性能优化相关指南，包括性能指标说明、Lighthouse 使用方法和优化建议清单。

## 性能指标说明

### Core Web Vitals

#### 1. FCP (First Contentful Paint) - 首次内容绘制

**定义**: 浏览器首次绘制任何文本、图片、非空白 SVG 或 WebGL 等内容的时间。

**目标值**:
- 优秀 (绿色): < 1.8 秒
- 需要改进 (橙色): 1.8s - 3.0s
- 较差 (红色): > 3.0s

#### 2. LCP (Largest Contentful Paint) - 最大内容绘制

**定义**: 页面视口内最大的图片或文本块渲染时间。

**目标值**:
- 优秀 (绿色): < 2.5 秒
- 需要改进 (橙色): 2.5s - 4.0s
- 较差 (红色): > 4.0s

**优化建议**:
- 优化服务器响应时间
- 使用 CDN 加速静态资源
- 图片懒加载 (已实现)
- 优化图片格式和压缩

#### 3. CLS (Cumulative Layout Shift) - 累计布局偏移

**定义**: 页面视觉稳定性指标，测量页面在加载过程中布局偏移的程度。

**目标值**:
- 优秀 (绿色): < 0.1
- 需要改进 (橙色): 0.1 - 0.25
- 较差 (红色): > 0.25

**优化建议**:
- 为图片和视频指定尺寸属性
- 使用 `font-display: swap` 避免字体加载导致的布局偏移 (已实现)
- 避免在页面顶部插入动态内容

### 其他重要指标

#### TTFB (Time to First Byte) - 首字节时间

**定义**: 浏览器从服务器接收第一个字节的时间。

**目标值**: < 600ms

#### FID (First Input Delay) - 首次输入延迟

**定义**: 用户首次与页面交互到页面响应的时间。

**目标值**: < 100ms

#### TBT (Total Blocking Time) - 总阻塞时间

**定义**: 主线程被阻塞导致输入无响应的总时间。

**目标值**: < 200ms

---

## Lighthouse 使用指南

### 使用方法

#### 1. Chrome DevTools

1. 打开 Chrome 浏览器
2. 访问博客页面
3. 按 `F12` 打开开发者工具
4. 切换到 **Lighthouse** 标签
5. 选择要分析的类别（建议勾选 Performance、SEO）
6. 点击 **Analyze page load**
7. 等待分析完成，查看报告

#### 2. 命令行工具

```bash
# 安装 lighthouse
npm install -g lighthouse

# 运行分析
lighthouse https://shenhuanjie.github.io/ --output html --output-path ./lighthouse-report.html
```

#### 3. Chrome 扩展

在 Chrome Web Store 搜索 "Lighthouse" 并安装扩展。

### Lighthouse 报告解读

报告包含以下部分：

| 类别 | 说明 |
|------|------|
| Performance | 性能分数 (0-100) |
| Accessibility | 无障碍访问分数 |
| Best Practices | 最佳实践分数 |
| SEO | 搜索引擎优化分数 |

### 性能分数计算

性能分数基于以下指标加权计算：

| 指标 | 权重 |
|------|------|
| First Contentful Paint | 10% |
| Speed Index | 10% |
| Largest Contentful Paint | 25% |
| Cumulative Layout Shift | 15% |
| Total Blocking Time | 30% |

---

## 优化建议清单

### 已实现的优化

| 优化项 | 状态 | 说明 |
|--------|------|------|
| 图片懒加载 | ✅ 已完成 | 使用 Intersection Observer API 实现 |
| CSS/JS 压缩 | ✅ 已完成 | 添加 hexo-html-minifier |
| 字体优化 | ✅ 已完成 | font-display: swap 已配置 |
| DNS 预取 | ✅ 已完成 | 预连接七牛云等外部域名 |

### 建议的后续优化

#### 高优先级

1. **图片优化**
   - 使用 WebP 格式替代 JPEG/PNG
   - 响应式图片 (`srcset` 属性)
   - 图片压缩 (使用 imagemin 或 similar)
   - 考虑使用 CSS Sprite 合并小图标

2. **缓存策略**
   - 配置合理的 Cache-Control
   - 启用浏览器缓存
   - 考虑 Service Worker

3. **关键渲染路径优化**
   - 消除阻塞渲染的 JavaScript
   - CSS 内联到 HTML (对于关键 CSS)
   - 延迟加载非关键 CSS

#### 中优先级

4. **JavaScript 优化**
   - 代码分割
   - Tree shaking
   - 移除未使用的 JavaScript
   - 使用 `defer` 或 `async` 属性

5. **服务器优化**
   - 启用 Gzip/Brotli 压缩
   - HTTP/2 支持
   - 减少 DNS 查询

6. **字体优化**
   - 字体子集化 (只加载使用的字符)
   - 考虑使用系统字体栈作为后备

#### 低优先级

7. **预加载优化**
   - 使用 `<link rel="preload">` 预加载关键资源
   - 预加载字体文件

8. **移动端优化**
   - 触摸事件延迟优化
   - 视口配置优化

---

## 监控工具推荐

### 在线工具

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://www.pingdom.com/)

### 浏览器扩展

- Lighthouse
- Web Vitals
- PageSpeed Insights

### 持续监控

- [web.dev](https://web.dev/) - Google 性能监控平台
- [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report)

---

## 参考资料

- [Web Vitals - Google Developers](https://web.dev/vitals/)
- [Lighthouse - Google Developers](https://developer.chrome.com/docs/lighthouse/)
- [MDN Web Docs - Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Core Web Vitals - Google Search Central](https://developers.google.com/search/docs/core-expectations/core-web-vitals)