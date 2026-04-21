# 搜索平台提交与 SEO 监控流程

本文档用于记录 `https://shenhuanjie.github.io/` 的搜索平台接入、sitemap 提交、文章发布后检查和日常 SEO 监控流程。

## 当前站点信息

- 站点地址：`https://shenhuanjie.github.io/`
- Sitemap：`https://shenhuanjie.github.io/sitemap.xml`
- Robots：`https://shenhuanjie.github.io/robots.txt`
- Atom Feed：`https://shenhuanjie.github.io/atom.xml`
- 发布方式：推送到 `main` 后由 GitHub Pages workflow 构建并部署。

## 搜索平台接入清单

### Google Search Console

账号操作阻塞项：

- 需要站点所有者登录 Google Search Console。
- 需要选择 URL-prefix 属性：`https://shenhuanjie.github.io/`。
- 需要按平台提示完成所有权验证。

建议步骤：

1. 打开 Google Search Console。
2. 添加 URL-prefix 属性：`https://shenhuanjie.github.io/`。
3. 优先选择 HTML 文件或 HTML meta 标签验证。
4. 如果选择 HTML 文件验证，将验证文件放入 `source/`，提交 PR，合并并等待 Pages 部署后再点击验证。
5. 验证成功后提交 sitemap：`https://shenhuanjie.github.io/sitemap.xml`。
6. 使用“网址检查”抽检首页、机器学习专题页和新发布文章。

首次检查 URL：

- `https://shenhuanjie.github.io/`
- `https://shenhuanjie.github.io/sitemap.xml`
- `https://shenhuanjie.github.io/machine-learning/`
- `https://shenhuanjie.github.io/post/machine-learning-engineering-lifecycle-20260421.html`

### Bing Webmaster Tools

账号操作阻塞项：

- 需要站点所有者登录 Bing Webmaster Tools。
- 可从 Google Search Console 导入站点；也可手动添加站点并验证。

建议步骤：

1. 打开 Bing Webmaster Tools。
2. 优先尝试从 Google Search Console 导入站点。
3. 如果手动添加，站点 URL 使用：`https://shenhuanjie.github.io/`。
4. 按平台提示完成 HTML 文件、meta 标签或 DNS 验证。
5. 提交 sitemap：`https://shenhuanjie.github.io/sitemap.xml`。
6. 使用 URL Inspection 抽检新文章和专题页。

### 百度搜索资源平台

账号操作阻塞项：

- 需要站点所有者登录百度搜索资源平台。
- GitHub Pages 在中文搜索生态中的抓取稳定性可能受访问速度和网络可达性影响。
- 如果后续绑定自有域名，应优先用自有域名接入百度。

建议步骤：

1. 在百度搜索资源平台添加站点。
2. 如果当前仍使用 `github.io`，先评估平台是否接受该子域名验证。
3. 如果已绑定自有域名，使用自有域名添加站点。
4. 按平台要求完成 HTML 文件、meta 标签或 DNS 验证。
5. 提交 sitemap。

## 发布后检查流程

每次新增或修改文章后执行：

1. 确认 PR 已合并到 `main`。
2. 确认 GitHub Pages workflow 成功。
3. 检查页面返回 200：

   ```bash
   curl -I -L https://shenhuanjie.github.io/post/example.html
   ```

4. 检查 sitemap 包含文章 URL：

   ```bash
   curl -L https://shenhuanjie.github.io/sitemap.xml | rg 'post/example.html'
   ```

5. 检查页面元信息：

   ```bash
   curl -L https://shenhuanjie.github.io/post/example.html | rg 'description|canonical|og:type|application/ld\\+json'
   ```

6. 在 Google Search Console 或 Bing Webmaster Tools 中使用 URL Inspection 请求索引。
7. 如果是专题页或高价值文章，检查站内是否至少有一个稳定入口链接到它。

## 每周监控指标

每周检查一次：

- GitHub Pages 最近一次部署是否成功。
- Search Console 中 sitemap 状态是否成功。
- 是否存在抓取错误、404、服务器错误或重定向异常。
- 新文章是否被发现和索引。
- 展示次数、点击次数、点击率和平均排名是否有异常波动。
- 机器学习专题页和重点文章是否开始获得曝光。

## 每月复盘指标

每月整理一次：

- 总索引页面数。
- 搜索展示量和点击量趋势。
- 带来点击的查询词。
- 点击最多的页面。
- 排名在 4 到 20 位之间、值得继续优化的页面。
- 没有被索引或被发现但未索引的页面。
- 需要补充内链、更新标题或增强内容深度的页面。

## 手动操作记录

执行账号侧操作后，在相关 issue 中记录：

- 平台名称。
- 验证方式。
- sitemap 提交时间。
- 首次检查的 URL。
- 是否存在平台报错。
- 下一次复查日期。

## 后续跟踪

以下事项不纳入本 issue 的交付范围，建议单独建 issue：

- GitHub Actions 的 Node.js 20 弃用提示处理。
- Dependabot 漏洞修复与依赖升级。
- 自有域名绑定后的 Search Console 属性迁移。
- 百度搜索资源平台对 GitHub Pages 抓取稳定性的专项验证。

