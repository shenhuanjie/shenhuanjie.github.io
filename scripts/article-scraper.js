/**
 * 文章爬虫脚本
 * 从博客园、CSDN、腾讯开发者社区爬取文章
 *
 * 用法: node scripts/article-scraper.js [选项]
 * 选项:
 *   --url URL        爬取指定URL的文章
 *   --list          显示支持的网站列表
 *   --dry-run       只显示，不创建文件
 *   --limit N       限制采集数量（默认 5）
 *   --keyword KEY   搜索关键词
 *   --output DIR    输出目录（默认 source/_posts）
 *
 * 示例:
 *   node scripts/article-scraper.js --url "https://blog.csdn.net/xxx/article/details/xxx"
 *   node scripts/article-scraper.js --keyword "大模型" --limit 10
 */

'use strict';

const https = require('https');
const http = require('http');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const url = require('url');
const moment = require('moment-timezone');
const aiHelper = require('./ai-helper');

// ============== 配置 ==============

const TIMEZONE = 'Asia/Shanghai';
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');
const IMAGES_DIR = path.join(__dirname, '..', 'source', 'images', 'posts');

// 支持的网站配置
const SUPPORTED_SITES = {
  'cnblogs': {
    name: '博客园',
    domains: ['cnblogs.com'],
    articleSelector: '#cnblogs_post_body',
    titleSelector: '.post-title',
    dateSelector: '.post-info',
    authorSelector: '.post-info'
  },
  'csdn': {
    name: 'CSDN',
    domains: ['blog.csdn.net', 'mp.csdn.net'],
    articleSelector: '.article-content, .htmledit_views',
    titleSelector: '.article-title',
    dateSelector: '.bar-content',
    authorSelector: '.follow-nickName'
  },
  'cloud': {
    name: '腾讯云开发者社区',
    domains: ['cloud.tencent.com', 'cloudcommunity.tencent.com'],
    articleSelector: '.article-content, .markdown-body',
    titleSelector: 'h1.article-title',
    dateSelector: '.article-info',
    authorSelector: '.article-info'
  }
};

// 内容质量阈值
const QUALITY_CONFIG = {
  minTitleLength: 8,
  maxTitleLength: 80,
  minContentLength: 200
};

// ============== 工具函数 ==============

/**
 * 生成 URL slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * 格式化日期
 * 自动修复只有日期没有时间的 frontmatter date（如 2026-05-08 -> 2026-05-08 00:00:00）
 */
function formatDate(dateStr) {
  try {
    if (!dateStr) return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    const date = moment(dateStr).tz(TIMEZONE);
    if (date.isValid()) {
      // 检查是否是纯日期格式（YYYY-MM-DD），如果是则添加时间部分
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return date.format('YYYY-MM-DD HH:mm:ss');
      }
      return date.format('YYYY-MM-DD HH:mm:ss');
    }
    return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
  } catch (e) {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
  }
}

/**
 * 修复文章日期格式：将 YYYY-MM-DD 转换为 YYYY-MM-DD HH:00:00
 */
function fixArticleDate(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 匹配只有日期没有时间的 frontmatter date
  // 例如: date: 2026-05-08 -> date: 2026-05-08 00:00:00
  content = content.replace(/^date: (\d{4}-\d{2}-\d{2})$/m, (match, date) => {
    return `date: ${date} 00:00:00`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

/**
 * 安全的 fetch 请求
 */
function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: 30000
    };

    protocol.get(targetUrl, options, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];

        if (encoding === 'gzip') {
          zlib.unzip(buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result.toString('utf-8'));
          });
        } else if (encoding === 'br') {
          zlib.brotliDecompress(buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result.toString('utf-8'));
          });
        } else {
          resolve(buffer.toString('utf-8'));
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

/**
 * 清理 HTML 标签
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 提取文本内容
 */
function extractText(html, selector) {
  const regex = new RegExp(`<[^>]*${selector}[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  const match = html.match(regex);
  return match ? match[1] : '';
}

/**
 * 确定网站类型
 */
function detectSite(targetUrl) {
  const hostname = new URL(targetUrl).hostname;
  for (const [key, site] of Object.entries(SUPPORTED_SITES)) {
    if (site.domains.some(d => hostname.includes(d))) {
      return key;
    }
  }
  return null;
}

/**
 * 解析博客园文章
 */
function parseCnblogsArticle(html, url) {
  // 提取标题
  let title = '';
  const titleMatch = html.match(/class="post-title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i);
  if (titleMatch) {
    title = stripHtml(titleMatch[1]);
  }

  // 尝试其他方式获取标题
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    title = h1Match ? stripHtml(h1Match[1]) : '未获取到标题';
  }

  // 提取日期
  const datePatterns = [
    /(\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2})/,
    /发布于\s*(\d{4}[-/]\d{2}[-/]\d{2})/
  ];
  let pubDate = '';
  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      pubDate = match[1];
      break;
    }
  }

  // 提取作者
  const authorMatch = html.match(/<a[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/a>/i);
  const author = authorMatch ? stripHtml(authorMatch[1]) : '博客园用户';

  // 提取文章内容 - 博客园使用 id="cnblogs_post_body"，结束于下一个<div标签
  let content = '';
  const startIdx = html.indexOf('id="cnblogs_post_body"');
  if (startIdx > -1) {
    // 找到下一个<div标签
    const endIdx = html.indexOf('<div', startIdx + 30);
    if (endIdx > -1) {
      content = html.slice(startIdx, endIdx);
    }
  }

  return { title, pubDate, author, content, originalUrl: url };
}

/**
 * 解析CSDN文章
 */
function parseCsdnArticle(html, url) {
  // 提取标题 - CSDN使用 id="articleContentId"
  const titleMatch = html.match(/<h1[^>]*id="articleContentId"[^>]*>([\s\S]*?)<\/h1>/i);
  let title = titleMatch ? stripHtml(titleMatch[1]) : '';

  if (!title) {
    const h1Match = html.match(/<h1[^>]*class="[^"]*title-article[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    title = h1Match ? stripHtml(h1Match[1]) : '未获取到标题';
  }

  // 提取日期 - 查找发布日期
  let pubDate = '';
  const datePatterns = [
    /<span[^>]*class="[^"]*date[^"]*"[^>]*>(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/i,
    /发表时间[\s:]*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/,
    /(\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2})/
  ];
  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      pubDate = match[1];
      break;
    }
  }

  // 提取作者
  const authorPatterns = [
    /<a[^>]*class="[^"]*nick-name[^"]*"[^>]*>([^<]+)<\/a>/i,
    /<span[^>]*class="[^"]*nick-name[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<a[^>]*class="[^"]*follow-nickName[^"]*"[^>]*>([^<]+)<\/a>/i
  ];
  let author = 'CSDN用户';
  for (const pattern of authorPatterns) {
    const match = html.match(pattern);
    if (match) {
      author = stripHtml(match[1]);
      break;
    }
  }

  // 提取文章内容 - CSDN使用 id="content_views" class="markdown_views"
  let content = '';
  const contentViewsMatch = html.match(/id="content_views"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i);
  if (contentViewsMatch && contentViewsMatch[1].length > 200) {
    content = contentViewsMatch[1];
  } else {
    // 备选：从 article_content 到 </article>
    const articleContentMatch = html.match(/id="article_content"[^>]*>([\s\S]*?)<\/article>/i);
    if (articleContentMatch && articleContentMatch[1].length > 200) {
      content = articleContentMatch[1];
    }
  }

  return { title, pubDate, author, content, originalUrl: url };
}

/**
 * 解析腾讯云社区文章
 */
function parseCloudArticle(html, url) {
  // 提取标题
  const titleMatch = html.match(/<h1[^>]*class="[^"]*article-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  let title = titleMatch ? stripHtml(titleMatch[1]) : '';

  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    title = h1Match ? stripHtml(h1Match[1]) : '未获取到标题';
  }

  // 提取日期
  const dateMatch = html.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
  const pubDate = dateMatch ? dateMatch[1] : '';

  // 提取作者
  const authorMatch = html.match(/<span[^>]*class="[^"]*nickName[^"]*"[^>]*>([^<]+)<\/span>/i);
  const author = authorMatch ? authorMatch[1] : '腾讯云用户';

  // 提取文章内容
  const articlePatterns = [
    /class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*article-operation[^"]*"/i,
    /class="[^"]*markdown-body[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*article-footer[^"]*"/i
  ];

  let content = '';
  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match && match[1].length > 200) {
      content = match[1];
      break;
    }
  }

  return { title, pubDate, author, content, originalUrl: url };
}

/**
 * 下载图片到本地
 */
async function downloadImage(imageUrl, articleSlug) {
  try {
    const parsedUrl = new URL(imageUrl);
    const ext = path.extname(parsedUrl.pathname) || '.png';
    const filename = `${slugify(articleSlug)}-${Date.now()}${ext}`;
    const dateDir = moment().tz(TIMEZONE).format('YYYY-MM-DD');
    const targetDir = path.join(IMAGES_DIR, dateDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filepath = path.join(targetDir, filename);
    const data = await fetchUrl(imageUrl);
    fs.writeFileSync(filepath, data, 'binary');

    return `/images/posts/${dateDir}/${filename}`;
  } catch (e) {
    console.log(`  [图片下载失败] ${imageUrl}: ${e.message}`);
    return imageUrl; // 返回原URL
  }
}

/**
 * 替换内容中的图片链接
 */
async function replaceImageLinks(content, articleSlug) {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = [...content.matchAll(imgRegex)];

  let processedContent = content;
  let imageCount = 0;

  for (const match of matches) {
    const originalTag = match[0];
    const imageUrl = match[1];

    // 跳过已处理或相对路径的图片
    if (imageUrl.startsWith('/') || imageUrl.startsWith('#') || imageUrl.startsWith('data:')) {
      continue;
    }

    // 跳过外部CDN图片（保留原链接）
    if (imageUrl.includes('alicdn.com') || imageUrl.includes('cdn.bytedance.com') || imageUrl.includes('bdstatic.com')) {
      continue;
    }

    const localPath = await downloadImage(imageUrl, articleSlug);
    if (localPath !== imageUrl) {
      processedContent = processedContent.replace(originalTag, originalTag.replace(imageUrl, localPath));
      imageCount++;
    }
  }

  return { content: processedContent, imageCount };
}

/**
 * 基于关键词自动分类
 */
function autoCategorize(title, content) {
  const categories = ['AI人工智能'];
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const text = titleLower + ' ' + contentLower;

  // 分类关键词映射
  const categoryKeywords = {
    '大模型': ['大模型', 'llm', 'gpt', 'claude', 'gemini', '文心一言', '通义千问', '智谱', 'kimi', 'chatgpt', '大语言模型'],
    'AI编程': ['编程', '开发', 'code', 'coding', 'python', 'javascript', 'java', '代码', '程序员', 'cursor', 'copilot', 'v0', 'bolt'],
    'AI应用': ['应用', 'app', '工具', '软件', 'saas', '产品', '平台'],
    'AI创业': ['创业', '融资', '投资', '商业', '盈利', '公司', ' startup', 'vc'],
    'AI安全': ['安全', '隐私', '风险', '监管', '合规', '伦理', '攻击', '漏洞'],
    'AI技术': ['技术', '算法', '模型', '训练', '推理', '部署', '架构'],
    'AI周报': ['周报', '周', '周总结', 'weekly'],
    'AI日更': ['日更', '日报', '今日', '最新', '快讯']
  };

  // 检测分类
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      if (!categories.includes(category)) {
        categories.push(category);
      }
    }
  }

  return categories;
}

/**
 * 基于关键词和内容生成标签
 */
function autoGenerateTags(title, content, source) {
  const tags = new Set(['AI', source]);
  const titleLower = title.toLowerCase();
  const text = titleLower + ' ' + content.toLowerCase();

  // 标签关键词映射
  const tagKeywords = {
    '大模型': ['大模型', 'llm', 'gpt', 'claude', 'gemini', '文心一言', '通义千问', '智谱ai', 'kimi', 'chatgpt', '大语言模型'],
    'Agent': ['agent', '智能体', 'agentic', 'multi-agent', '多智能体'],
    'RAG': ['rag', '检索增强', 'rag系统'],
    '深度学习': ['深度学习', 'deep learning', '神经网络', 'transformer'],
    '机器学习': ['机器学习', 'machine learning', 'ml'],
    'AI编程': ['编程', '开发', 'code', 'coding', 'cursor', 'copilot', 'v0', 'bolt', '代码生成'],
    'AI图像': ['图像', '图片', '视觉', 'cv', 'stable diffusion', 'midjourney', 'dall-e', 'ai绘画', '生成式图像'],
    'AI视频': ['视频', 'video', 'sora', 'runway', '生成视频'],
    'AI音频': ['音频', '语音', 'audio', 'tts', 'asr', '语音合成'],
    'AI安全': ['安全', '隐私', '对齐', '可控性', '监管'],
    'AI创业': ['创业', '融资', '投资', '上市', '并购', '独角兽'],
    'AI产品': ['产品', '发布', '更新', '新功能', '版本']
  };

  // 检测标签
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.add(tag);
    }
  }

  // 额外检测英文标签
  const extraTags = ['openai', 'anthropic', 'google', 'microsoft', 'meta', 'apple', 'nvidia', '特斯拉', '苹果'];
  extraTags.forEach(t => {
    if (text.includes(t.toLowerCase())) {
      tags.add(t);
    }
  });

  return Array.from(tags);
}

/**
 * 生成 Hexo 格式的 front-matter
 */
function generateFrontMatter(article, source, options = {}) {
  const { useAISummary = false, aiSummary = '', aiDescription = '' } = options;
  const cleanTitle = stripHtml(article.title).trim();
  const plainContent = stripHtml(article.content);

  // 使用 AI 描述或自动生成
  const description = aiDescription || plainContent.slice(0, 200).replace(/\s+/g, ' ');

  // 自动分类
  const categories = autoCategorize(cleanTitle, plainContent);

  // 自动生成标签
  const tags = autoGenerateTags(cleanTitle, plainContent, source);

  // AI 摘要（150字以内）
  const summary = aiSummary || plainContent.slice(0, 150).replace(/\s+/g, ' ').trim();

  return `---
title: ${cleanTitle}
date: '${formatDate(article.pubDate)}'
updated: '${moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')}'
permalink: /post/${slugify(cleanTitle)}.html
description: ${description}
categories:
  - ${categories[0]}
${categories.slice(1).map(c => `  - ${c}`).join('\n')}
tags:
  - ${tags.join('\n  - ')}
comments: true
toc: true
source: ${source}
source_link: ${article.originalUrl}
author: ${article.author}
ai_summary: ${summary}
---

`;
}

/**
 * 清理并转换内容为 Markdown
 */
function convertToMarkdown(content) {
  if (!content) return '';

  // 替换图片
  let markdown = content
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '![]($1)')

  // 替换标题
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')

  // 替换链接
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

  // 替换代码块
    .replace(/<pre[^>]*><code[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1\n$2\n```')
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')

  // 替换列表
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, list) => {
      return list.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list) => {
      let index = 0;
      return list.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${++index}. $1\n`);
    })

  // 替换加粗和斜体
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')

  // 替换换行和段落
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')

  // 移除剩余标签
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // 清理多余空行
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

/**
 * 保存文章
 * @param {Object} article - 文章对象
 * @param {string} source - 来源
 * @param {boolean} dryRun - 是否预览
 * @param {Object} options - 可选参数 { useAI: 是否使用AI生成摘要 }
 */
async function saveArticle(article, source, dryRun = false, options = {}) {
  const { useAI = false } = options;
  const slug = slugify(article.title);
  const filename = `${moment().tz(TIMEZONE).format('YYYY-MM-DD')}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  // 检查是否已存在
  if (fs.existsSync(filepath)) {
    console.log(`  [跳过] 已存在: ${filename}`);
    return { saved: false, reason: 'already_exists' };
  }

  // 检查标题长度
  const titleLength = stripHtml(article.title).length;
  if (titleLength < QUALITY_CONFIG.minTitleLength) {
    return { saved: false, reason: 'title_too_short' };
  }
  if (titleLength > QUALITY_CONFIG.maxTitleLength) {
    article.title = stripHtml(article.title).slice(0, QUALITY_CONFIG.maxTitleLength);
  }

  // 检查内容长度
  if (article.content.length < QUALITY_CONFIG.minContentLength) {
    return { saved: false, reason: 'content_too_short' };
  }

  // 下载并替换图片
  console.log(`  [处理图片] 开始下载...`);
  const { content: processedContent, imageCount } = await replaceImageLinks(article.content, slug);
  console.log(`  [处理图片] 完成，下载 ${imageCount} 张图片`);

  // 转换为 Markdown
  const markdownContent = convertToMarkdown(processedContent);

  // AI 摘要生成
  let aiSummary = '';
  let aiDescription = '';
  if (useAI && process.env.ANTHROPIC_API_KEY) {
    try {
      console.log(`  [AI] 正在生成摘要...`);
      aiSummary = await aiHelper.generateSummary(markdownContent);
      console.log(`  [AI] 摘要生成成功: ${aiSummary.slice(0, 50)}...`);

      console.log(`  [AI] 正在生成描述...`);
      aiDescription = await aiHelper.generateDescription(article.title, markdownContent);
      console.log(`  [AI] 描述生成成功: ${aiDescription.slice(0, 50)}...`);
    } catch (error) {
      console.log(`  [AI] AI 生成失败，使用默认描述: ${error.message}`);
    }
  }

  // 生成 front-matter
  const frontMatter = generateFrontMatter(article, source, { useAISummary: !!aiSummary, aiSummary, aiDescription });

  // 组装完整内容
  const fullContent = frontMatter + '\n' + markdownContent;

  if (dryRun) {
    console.log(`  [预览] ${filename}`);
    console.log(`  标题: ${stripHtml(article.title).slice(0, 50)}...`);
    console.log(`  字数: ${markdownContent.length}`);
    console.log(`  图片: ${imageCount} 张`);
    if (aiSummary) console.log(`  AI摘要: ${aiSummary.slice(0, 50)}...`);
    return { saved: false, reason: 'dry_run' };
  }

  // 确保目录存在
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, fullContent, 'utf8');
  console.log(`  [创建] ${filename}`);

  // 修复日期格式
  if (fixArticleDate(filepath)) {
    console.log(`  [日期修复] 已修复日期格式`);
  }

  return { saved: true, filename, imageCount, aiSummary };
}

/**
 * 爬取单篇文章
 * @param {string} targetUrl - 目标URL
 * @param {boolean} dryRun - 是否预览
 * @param {Object} options - 可选参数 { useAI: 是否使用AI生成摘要 }
 */
async function scrapeArticle(targetUrl, dryRun = false, options = {}) {
  const { useAI = false } = options;
  console.log(`\n正在爬取: ${targetUrl}`);

  // 检测网站类型
  const siteKey = detectSite(targetUrl);
  if (!siteKey) {
    console.error(`  [错误] 不支持的网站: ${targetUrl}`);
    console.log('使用 --list 查看支持的网站列表');
    return { success: false, reason: 'unsupported_site' };
  }

  const site = SUPPORTED_SITES[siteKey];

  try {
    // 获取页面内容
    const html = await fetchUrl(targetUrl);

    // 解析文章
    let article;
    switch (siteKey) {
      case 'cnblogs':
        article = parseCnblogsArticle(html, targetUrl);
        break;
      case 'csdn':
        article = parseCsdnArticle(html, targetUrl);
        break;
      case 'cloud':
        article = parseCloudArticle(html, targetUrl);
        break;
      default:
        return { success: false, reason: 'parse_failed' };
    }

    // 验证解析结果
    if (!article.title || article.title === '未获取到标题') {
      console.log(`  [警告] 可能无法正确解析标题`);
    }
    if (!article.content || article.content.length < 100) {
      console.log(`  [警告] 文章内容可能未正确提取`);
    }

    console.log(`  标题: ${stripHtml(article.title).slice(0, 50)}...`);
    console.log(`  作者: ${article.author}`);
    console.log(`  日期: ${article.pubDate}`);
    if (useAI) console.log(`  [AI] AI 功能已启用`);

    // 保存文章
    const result = await saveArticle(article, site.name, dryRun, { useAI });

    return {
      success: result.saved,
      reason: result.reason,
      filename: result.filename,
      title: article.title,
      aiSummary: result.aiSummary
    };

  } catch (e) {
    console.error(`  [错误] ${e.message}`);
    return { success: false, reason: 'fetch_error', error: e.message };
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
文章爬虫脚本

用法:
  node scripts/article-scraper.js [选项]

选项:
  --url URL        爬取指定URL的文章
  --list           显示支持的网站列表
  --dry-run        只显示，不创建文件
  --limit N        限制采集数量（默认 5）
  --keyword KEY    搜索关键词（暂不支持）
  --output DIR     输出目录（默认 source/_posts）
  --ai             启用 AI 摘要和描述生成（需要 ANTHROPIC_API_KEY）

功能:
  - 自动识别网站类型并解析文章
  - 自动下载并替换图片链接为本地路径
  - 基于关键词自动分类和打标签
  - 自动生成 AI 摘要（150字以内）
  - 自动修复日期格式（YYYY-MM-DD -> YYYY-MM-DD HH:00:00）

支持的网站:
  - 博客园 (cnblogs.com)
  - CSDN (blog.csdn.net)
  - 腾讯云开发者社区 (cloud.tencent.com)

环境变量:
  ANTHROPIC_API_KEY    Claude API 密钥（用于 AI 摘要生成）

示例:
  node scripts/article-scraper.js --url "https://blog.csdn.net/xxx/article/details/xxx"
  node scripts/article-scraper.js --dry-run --url "https://www.cnblogs.com/xxx/p/xxx.html"
  node scripts/article-scraper.js --url "..." --ai
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  // 解析参数
  let targetUrl = null;
  let dryRun = false;
  let useAI = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' && args[i + 1]) {
      targetUrl = args[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--ai') {
      useAI = true;
    } else if (arg === '--list') {
      console.log('\n支持的网站:');
      for (const [key, site] of Object.entries(SUPPORTED_SITES)) {
        console.log(`  ${key}: ${site.name}`);
        site.domains.forEach(d => console.log(`    - ${d}`));
      }
      return;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      return;
    }
  }

  if (!targetUrl) {
    console.error('请指定要爬取的URL，使用 --url 参数');
    console.log('使用 --help 查看帮助');
    process.exit(1);
  }

  console.log('===========================================');
  console.log('文章爬虫');
  console.log('===========================================');
  console.log(`目标URL: ${targetUrl}`);
  console.log(`模式: ${dryRun ? '预览（不创建文件）' : '创建文件'}`);
  console.log(`AI摘要: ${useAI ? '启用' : '禁用'}`);
  console.log('===========================================');

  const result = await scrapeArticle(targetUrl, dryRun, { useAI });

  console.log('\n===========================================');
  if (result.success) {
    console.log('爬取成功!');
    console.log(`文件: ${result.filename}`);
    if (result.aiSummary) {
      console.log(`AI摘要: ${result.aiSummary}`);
    }
  } else {
    console.log(`爬取失败: ${result.reason}`);
  }
  console.log('===========================================');

  if (result.success && !dryRun) {
    console.log('\n提示:');
    console.log('1. 运行 npm run server 预览文章');
    console.log('2. 检查图片是否正确显示');
    console.log('3. 运行 node scripts/automated-review.js 审核文章质量');
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeArticle, saveArticle, detectSite, replaceImageLinks, fixArticleDate, autoCategorize, autoGenerateTags };