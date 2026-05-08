# SEO 检查清单

每次发布文章或进行重大更改后，使用此清单进行验证。

## 目录
- [标题标签检查](#标题标签检查)
- [Meta 描述检查](#meta-描述检查)
- [Open Graph 检查](#open-graph-检查)
- [结构化数据验证](#结构化数据验证)
- [站点地图验证](#站点地图验证)
- [移动端友好检查](#移动端友好检查)

---

## 标题标签检查

### 检查项
- [ ] 标题长度：30-60 个字符
- [ ] 包含核心关键词
- [ ] 不含重复关键词堆砌
- [ ] 格式：`文章标题 | 网站名称`

### 验证方法
1. 右键查看页面源代码
2. 搜索 `<title>` 标签
3. 确认格式正确

### 示例
```html
<title>Hexo 博客 SEO 优化指南 | Hello World</title>
```

---

## Meta 描述检查

### 检查项
- [ ] 长度：120-160 个字符
- [ ] 包含目标关键词
- [ ] 清晰描述页面内容
- [ ] 无重复内容
- [ ] 包含行动号召（可选）

### 验证方法
```bash
# 查看 meta 描述
grep -i "meta name=\"description\"" source/_partial/head.ejs
```

### 示例
```html
<meta name="description" content="深入解析 Hexo 博客 SEO 优化技巧，包括结构化数据、Open Graph 配置和站点地图生成。">
```

---

## Open Graph 检查

### 检查项
- [ ] og:title 存在且正确
- [ ] og:description 存在
- [ ] og:url 为规范 URL
- [ ] og:image 设置正确
- [ ] og:type 正确（article/website）
- [ ] og:locale 设置为 zh_CN

### 验证工具
1. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### 示例
```html
<meta property="og:type" content="article">
<meta property="og:title" content="文章标题">
<meta property="og:description" content="文章描述">
<meta property="og:url" content="https://shenhuanjie.github.io/2024/05/08/article/">
<meta property="og:image" content="https://shenhuanjie.github.io/images/cover.jpg">
<meta property="og:locale" content="zh_CN">
```

---

## 结构化数据验证

### 已实现的结构化数据
- [x] BlogPosting（文章页面）
- [x] BreadcrumbList（面包屑导航）
- [ ] FAQPage（FAQ 页面，可选）

### 验证工具
1. [Google Rich Results Test](https://search.google.com/test/rich-results)
2. [Schema.org Validator](https://validator.schema.org/)

### 检查 BlogPosting
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "文章标题",
  "datePublished": "2024-05-08T00:00:00.000Z",
  "dateModified": "2024-05-08T00:00:00.000Z",
  "author": {
    "@type": "Person",
    "name": "Shenhuanjie"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://shenhuanjie.github.io/2024/05/08/article/"
  }
}
```

### 检查 BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "首页", "item": "https://shenhuanjie.github.io/"},
    {"@type": "ListItem", "position": 2, "name": "分类", "item": "https://shenhuanjie.github.io/category/tech/"},
    {"@type": "ListItem", "position": 3, "name": "文章标题"}
  ]
}
```

---

## 站点地图验证

### 检查项
- [ ] sitemap.xml 可访问
- [ ] 包含所有文章链接
- [ ] 包含分类页面
- [ ] 包含标签页面
- [ ] 更新频率设置正确

### 验证方法
```bash
# 检查 sitemap.xml
curl -I https://shenhuanjie.github.io/sitemap.xml

# 本地检查
hexo generate
cat public/sitemap.xml | head -50
```

### 预期内容
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shenhuanjie.github.io/2024/05/08/article/</loc>
    <lastmod>2024-05-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 提交到 Search Console
1. 登录 Search Console
2. 进入 "sitemap" 部分
3. 输入 `sitemap.xml`
4. 点击 "提交"

---

## 移动端友好检查

### 检查项
- [ ] 视口元标签正确设置
- [ ] 字体大小 >= 16px
- [ ] 点击目标间距充足
- [ ] 无水平滚动
- [ ] 图片响应式

### 验证工具
1. [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
2. 浏览器开发者工具设备模拟

### 必需标签
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
```

---

## 技术 SEO 检查

### URL 结构
- [ ] URL 简短清晰
- [ ] 包含关键词
- [ ] 使用连字符分隔
- [ ] 无特殊字符

### 重复内容检查
- [ ] canonical 标签设置
- [ ] 无多个 URL 访问同一页面
- [ ] 分页处理正确

### 页面速度
- [ ] 图片已压缩
- [ ] CSS/JS 已精简
- [ ] 使用 CDN（如可能）
- [ ] 浏览器缓存已配置

### robots.txt 检查
```bash
curl https://shenhuanjie.github.io/robots.txt
```

预期内容：
```
User-agent: *
Allow: /

Sitemap: https://shenhuanjie.github.io/sitemap.xml
```

---

## 发布前最终检查

### 文章发布检查清单
- [ ] 标题包含目标关键词
- [ ] Meta 描述已填写（120-160 字符）
- [ ] 文章封面图已设置
- [ ] 分类已选择
- [ ] 标签已添加
- [ ] 文章链接已确认

### 部署后检查
- [ ] `hexo clean && hexo generate` 无错误
- [ ] `hexo deploy` 成功
- [ ] 网站可正常访问
- [ ] 结构化数据验证通过
- [ ] Google 已抓取新页面

---

## 常用验证工具

| 工具 | 用途 |
|------|------|
| [Google Rich Results Test](https://search.google.com/test/rich-results) | 结构化数据验证 |
| [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly) | 移动端友好检查 |
| [Schema.org Validator](https://validator.schema.org/) | Schema 验证 |
| [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) | OG 标签验证 |
| [Twitter Card Validator](https://cards-dev.twitter.com/validator) | Twitter Card 验证 |
| [Google Search Console](https://search.google.com/search-console) | 整体 SEO 监控 |
