---
title: GitHub Pages 绑定自定义域名完整教程：DNS、HTTPS 与费用说明
date: '2026-04-21 16:53:32'
updated: '2026-04-21 16:53:32'
excerpt: >-
  本文系统讲解 GitHub Pages 如何绑定自定义域名，覆盖域名购买成本、DNS 记录配置、apex 根域名与 www 子域名的选择、CNAME 文件、GitHub Pages 设置、HTTPS 生效、验证命令、常见故障和 SEO 迁移注意事项。
permalink: /post/github-pages-custom-domain-guide-cost-20260421.html
categories:
  - DevOps
  - GitHub
tags:
  - GitHub Pages
  - 自定义域名
  - DNS
  - HTTPS
  - SEO
  - 域名解析
comments: true
toc: true
---

GitHub Pages 默认会给个人站点分配一个 `github.io` 域名，例如：

```text
https://shenhuanjie.github.io/
```

这个地址可以正常访问，也可以被搜索引擎收录。但如果你希望长期经营个人博客、技术品牌或项目文档，更推荐绑定自己的域名，例如：

```text
https://www.example.com/
https://blog.example.com/
https://example.com/
```

自定义域名最大的价值不是“看起来更酷”，而是把访问入口、品牌识别、搜索权重和后续迁移主动权掌握在自己手里。以后你从 GitHub Pages 迁到 Vercel、Cloudflare Pages、自己的服务器，只要域名不变，用户和搜索引擎都能沿着同一个地址继续访问。

本文会从准备、费用、DNS、GitHub 设置、Hexo 配置、HTTPS、验证和故障排查几个方面，完整梳理 GitHub Pages 绑定自定义域名的流程。

## 一、绑定自定义域名前先理解几个概念

### 1. GitHub Pages 默认域名

个人或组织站点通常使用：

```text
https://username.github.io/
```

项目站点通常使用：

```text
https://username.github.io/repository-name/
```

如果你的仓库名是 `username.github.io`，它就是用户站点；如果仓库名是普通项目名，它就是项目站点。绑定域名时，两者都支持自定义域名，但 URL 结构和站点根路径配置可能不同。

### 2. Apex 域名与子域名

域名分两类常见形态：

```text
example.com          # apex / root / 裸域名
www.example.com      # 子域名
blog.example.com     # 子域名
```

`example.com` 通常叫 apex domain、root domain 或裸域名。`www.example.com`、`blog.example.com` 是子域名。

GitHub Pages 官方文档更推荐使用 `www` 子域名，因为它更容易配置 CDN、DNS 和重定向，也更符合很多托管平台的最佳实践。实际个人博客中，下面两种都很常见：

- 主站：`https://www.example.com/`
- 博客：`https://blog.example.com/`

如果你坚持使用裸域名 `https://example.com/`，也可以配置，但 DNS 记录稍微多一些。

### 3. DNS 记录

DNS 的作用是把域名解析到 GitHub Pages。常见记录包括：

| 记录类型 | 用途 |
| --- | --- |
| `A` | 将裸域名解析到 IPv4 地址 |
| `AAAA` | 将裸域名解析到 IPv6 地址 |
| `CNAME` | 将子域名指向另一个域名 |
| `TXT` | 常用于域名所有权验证 |

对于 GitHub Pages：

- 裸域名通常配置 `A` 和 `AAAA`。
- `www` 或 `blog` 子域名通常配置 `CNAME`。

## 二、费用说明：哪些免费，哪些需要付费

很多人绑定自定义域名前最关心费用。整体来说，GitHub Pages 本身成本很低，但域名不是免费的。

### 1. GitHub Pages 托管费用

对于公开仓库，GitHub Pages 可以直接用于发布静态网站。公开技术博客、文档站点、个人主页通常不需要为 GitHub Pages 单独付费。

如果你使用私有仓库发布 Pages，则是否可用取决于 GitHub 账号和仓库的可见性策略。实际以 GitHub 当前账户计划和仓库设置为准。

### 2. 自定义域名费用

自定义域名需要从域名注册商购买，例如阿里云、腾讯云、Cloudflare Registrar、Namecheap、GoDaddy、Porkbun 等。

常见费用项：

| 项目 | 是否必须 | 说明 |
| --- | --- | --- |
| 域名注册费 | 必须 | 通常按年付费，不同后缀和注册商差异很大 |
| 域名续费 | 必须 | 第二年续费价格可能高于首年促销价 |
| DNS 解析 | 通常免费 | 大多数注册商提供基础 DNS，Cloudflare 也提供免费 DNS |
| WHOIS 隐私保护 | 视情况 | 有些注册商免费提供，有些需要单独付费 |
| HTTPS 证书 | 通常免费 | GitHub Pages 支持自动签发和续期证书 |
| 邮箱服务 | 非必须 | 如果要用 `me@example.com` 这类邮箱，需要额外服务 |
| CDN/WAF | 非必须 | GitHub Pages 已有基础托管能力，复杂防护可另配 |

以 `.com` 域名为例，常见注册和续费可能落在每年几十到一百多元人民币，或十几美元上下。但这个区间只能作为经验参考，不是固定报价。不同注册商、后缀、促销、汇率、隐私保护和续费策略都会影响实际成本。

选购域名时要特别注意：

1. 不要只看首年价格，要看续费价格。
2. 确认是否支持修改 DNS 记录。
3. 确认是否提供免费的 WHOIS 隐私保护。
4. 确认域名是否可以正常转出。
5. 尽量选择稳定、口碑好、后台清晰的注册商。

### 3. HTTPS 费用

GitHub Pages 支持为自定义域名自动启用 HTTPS。通常不需要你自己购买 SSL 证书，也不需要手动上传证书。

在 DNS 配置正确后，GitHub Pages 可能需要一段时间签发证书。证书生效后，可以在仓库的 Pages 设置中启用 `Enforce HTTPS`。

## 三、推荐域名方案

### 方案 A：使用 `www` 子域名

推荐程度：高。

示例：

```text
www.example.com
```

DNS 配置：

```text
www  CNAME  username.github.io
```

优点：

- 配置简单。
- 很多平台都推荐子域名。
- 后续迁移 CDN 或托管平台更灵活。
- 可以把裸域名跳转到 `www`。

### 方案 B：使用 `blog` 子域名

推荐程度：高，适合博客独立于主站。

示例：

```text
blog.example.com
```

DNS 配置：

```text
blog  CNAME  username.github.io
```

优点：

- 语义清晰，适合个人博客或技术文章站。
- 不影响未来主站 `www.example.com` 的建设。
- DNS 配置简单。

### 方案 C：使用裸域名

推荐程度：中。

示例：

```text
example.com
```

DNS 配置通常需要添加 GitHub Pages 的 `A` 记录：

```text
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

如果注册商支持 IPv6，也可以添加 `AAAA` 记录：

```text
@  AAAA  2606:50c0:8000::153
@  AAAA  2606:50c0:8001::153
@  AAAA  2606:50c0:8002::153
@  AAAA  2606:50c0:8003::153
```

裸域名可以使用，但建议同时配置 `www`，并统一一个主访问地址，避免搜索引擎看到多个重复版本。

## 四、绑定 GitHub Pages 自定义域名的完整步骤

下面以 `www.example.com` 为例说明。请把示例域名替换成你自己的域名。

### 第 1 步：购买域名

在域名注册商购买域名后，进入 DNS 解析管理页面。

如果你只是做博客，建议优先考虑：

```text
blog.example.com
```

或者：

```text
www.example.com
```

原因是子域名只需要一条 `CNAME`，配置更简单。

### 第 2 步：配置 DNS 解析

如果使用 `www.example.com`：

```text
记录类型：CNAME
主机记录：www
记录值：username.github.io
```

如果使用 `blog.example.com`：

```text
记录类型：CNAME
主机记录：blog
记录值：username.github.io
```

如果使用裸域名 `example.com`，添加 GitHub Pages 的 `A` 记录：

```text
记录类型：A
主机记录：@
记录值：185.199.108.153

记录类型：A
主机记录：@
记录值：185.199.109.153

记录类型：A
主机记录：@
记录值：185.199.110.153

记录类型：A
主机记录：@
记录值：185.199.111.153
```

DNS 生效可能需要几分钟到数小时。少数情况下，受 TTL 和注册商影响，全球完全生效可能更久。

### 第 3 步：在 GitHub 仓库中设置 Custom domain

进入仓库：

```text
Settings -> Pages -> Custom domain
```

填入你的域名，例如：

```text
www.example.com
```

保存后，GitHub 会检查 DNS 是否指向正确。如果检查通过，GitHub Pages 会开始为该域名准备 HTTPS 证书。

### 第 4 步：在 Hexo 中添加 CNAME 文件

如果你使用 Hexo，并且通过 GitHub Actions 构建 `public/` 再部署 Pages，建议在源码目录中添加：

```text
source/CNAME
```

文件内容只有一行：

```text
www.example.com
```

这样 Hexo 构建后，`public/CNAME` 会被一起发布，GitHub Pages 能稳定识别自定义域名。

如果你使用的是 `blog.example.com`，文件内容就是：

```text
blog.example.com
```

### 第 5 步：修改 Hexo 的站点 URL

打开 `_config.yml`：

```yaml
url: https://www.example.com/
```

如果是博客子域名：

```yaml
url: https://blog.example.com/
```

这个配置非常重要。它会影响：

- canonical URL
- sitemap URL
- feed URL
- Open Graph URL
- 部分主题生成的绝对链接

如果你已经做了 sitemap 和结构化数据，域名迁移时一定要同步改这里。

### 第 6 步：提交并等待 GitHub Pages 部署

提交修改：

```bash
git add _config.yml source/CNAME
git commit -m "chore: configure custom domain"
git push origin main
```

等待 GitHub Actions 或 GitHub Pages 构建完成。

### 第 7 步：启用 Enforce HTTPS

回到：

```text
Settings -> Pages
```

如果证书已经签发成功，就勾选：

```text
Enforce HTTPS
```

如果这个选项暂时不能勾选，通常是 DNS 还没完全生效，或者证书还在签发中。可以等一段时间再刷新。

## 五、如何验证配置是否成功

### 1. 检查 DNS

macOS 或 Linux 可以使用：

```bash
dig www.example.com
```

如果是子域名，检查 CNAME：

```bash
dig www.example.com CNAME
```

如果是裸域名，检查 A 记录：

```bash
dig example.com A
```

也可以用：

```bash
nslookup www.example.com
```

### 2. 检查 HTTP 状态

```bash
curl -I -L https://www.example.com/
```

期望看到：

```text
HTTP/2 200
```

如果有跳转，也要确认最终跳转到你想要的主域名。

### 3. 检查 sitemap

```bash
curl -L https://www.example.com/sitemap.xml
```

确认其中的 URL 已经是新域名，而不是旧的 `github.io`。

### 4. 检查 canonical

打开任意文章页，查看 HTML：

```bash
curl -L https://www.example.com/post/example.html | grep canonical
```

期望看到：

```html
<link rel="canonical" href="https://www.example.com/post/example.html">
```

## 六、SEO 迁移注意事项

从 `username.github.io` 切换到自定义域名时，要注意搜索引擎可能需要一段时间重新识别主域名。

建议做法：

1. 先确认自定义域名稳定可访问。
2. 确认 `_config.yml` 的 `url` 已改为新域名。
3. 确认 sitemap 中全部是新域名。
4. 确认文章页 canonical 指向新域名。
5. 在 Google Search Console 和 Bing Webmaster Tools 添加新域名或新 URL-prefix 属性。
6. 提交新 sitemap。
7. 保留旧 `github.io` 可访问，不要让旧链接突然 404。
8. 观察搜索平台中的索引、点击和抓取错误。

对于 GitHub Pages 用户站点，配置自定义域名后，GitHub 通常会把默认 `github.io` 域名请求引导到自定义域名。但实际表现仍建议上线后用 `curl -I -L` 检查。

## 七、常见问题排查

### 1. GitHub 提示 DNS check unsuccessful

可能原因：

- DNS 记录刚配置，还没有生效。
- CNAME 写错，例如多写了 `https://`。
- 记录值写成了错误仓库地址。
- 裸域名用了 CNAME，但注册商不支持。
- 同一个主机记录存在冲突记录。

处理方式：

1. 删除冲突记录。
2. 子域名使用 CNAME 指向 `username.github.io`。
3. 裸域名使用 GitHub Pages 官方 A/AAAA 地址。
4. 等待 DNS 生效后重新检查。

### 2. HTTPS 不能启用

可能原因：

- DNS 尚未完全生效。
- GitHub 证书还在签发。
- 域名之前绑定过其他 Pages 站点。
- CAA 记录限制了证书签发机构。

处理方式：

1. 确认 DNS 正确。
2. 等待一段时间。
3. 检查仓库 Pages 设置。
4. 如果域名很久不能签发证书，检查 DNS 中是否有异常 CAA 记录。

### 3. 访问新域名显示 404

可能原因：

- 仓库 Pages 没有部署成功。
- Custom domain 配错。
- Hexo 构建产物没有包含 `CNAME`。
- DNS 指向了错误目标。

处理方式：

1. 检查 GitHub Actions 是否成功。
2. 检查 `public/CNAME` 是否存在。
3. 检查 GitHub Pages 设置中的域名。
4. 检查 DNS 解析结果。

### 4. sitemap 还是旧域名

这是 Hexo 站点最常见的问题之一。原因通常是 `_config.yml` 的 `url` 没有改。

修复方式：

```yaml
url: https://www.example.com/
```

然后重新构建发布。

### 5. 搜索引擎同时收录新旧域名

短期内这是正常现象。需要通过 canonical、sitemap、站内链接和稳定跳转逐步统一信号。

建议：

- 所有 canonical 指向新域名。
- sitemap 只保留新域名。
- 站内链接优先使用相对路径或新域名。
- 在搜索平台提交新 sitemap。
- 不要频繁切换主域名。

## 八、推荐配置示例

假设你的 GitHub 用户名是：

```text
shenhuanjie
```

你准备使用：

```text
blog.example.com
```

DNS 配置：

```text
blog  CNAME  shenhuanjie.github.io
```

GitHub Pages Custom domain：

```text
blog.example.com
```

Hexo `source/CNAME`：

```text
blog.example.com
```

Hexo `_config.yml`：

```yaml
url: https://blog.example.com/
```

验证命令：

```bash
dig blog.example.com CNAME
curl -I -L https://blog.example.com/
curl -L https://blog.example.com/sitemap.xml
```

## 九、最终检查清单

绑定完成后，建议逐项确认：

- [ ] 域名已购买并能正常管理 DNS。
- [ ] DNS 记录已配置。
- [ ] GitHub Pages Custom domain 已填写。
- [ ] `source/CNAME` 已添加。
- [ ] `_config.yml` 的 `url` 已改成新域名。
- [ ] GitHub Actions 或 Pages 构建成功。
- [ ] `Enforce HTTPS` 已启用。
- [ ] 首页返回 200。
- [ ] sitemap 返回 200，且 URL 是新域名。
- [ ] 文章页 canonical 指向新域名。
- [ ] Google Search Console / Bing Webmaster Tools 已添加新域名或 URL-prefix。
- [ ] 新 sitemap 已提交。

## 结语

GitHub Pages 绑定自定义域名并不复杂，真正需要谨慎的是 DNS、HTTPS 和 SEO 迁移细节。

如果只是个人技术博客，最省心的方案通常是：

```text
blog.example.com -> CNAME -> username.github.io
```

然后在 Hexo 中同步：

```text
source/CNAME
_config.yml url
```

费用方面，GitHub Pages 通常不额外收费，HTTPS 证书也通常不额外收费；主要成本是域名注册和续费。买域名时不要只看首年优惠价，一定要看续费价、隐私保护、DNS 能力和转出政策。

自定义域名配置好之后，网站的长期价值会更稳：用户记住的是你的域名，搜索权重沉淀在你的域名，未来迁移平台也更自由。

## 参考资料

- [GitHub Docs：About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [GitHub Docs：Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Docs：Verifying your custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub Docs：GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

