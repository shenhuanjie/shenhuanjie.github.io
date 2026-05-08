/**
 * AI 资讯 RSS 采集脚本
 * 从多个 RSS 源采集 AI 相关资讯，生成 Hexo 格式草稿
 *
 * 用法: node scripts/ai-news-fetch.js [选项]
 * 选项:
 *   --dry-run    只显示，不创建文件
 *   --limit N    限制采集数量（默认 10）
 *   --source NAME 只采集指定来源
 *
 * 环境变量:
 *   AI_NEWS_KEYWORDS - 关键词过滤（逗号分隔）
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// ============== 配置 ==============

// RSS 源配置
const RSS_SOURCES = {
  '36kr': {
    name: '36氪',
    url: 'https://36kr.com/feed',
    language: 'zh'
  },
  'ithome': {
    name: 'IT之家',
    url: 'https://www.ithome.com/rss/',
    language: 'zh'
  },
  'oschina': {
    name: '开源中国',
    url: 'https://www.oschina.net/news/rss',
    language: 'zh'
  },
  'infoq': {
    name: 'InfoQ',
    url: 'https://feed.infoq.com/',
    language: 'zh'
  },
  'ai-plus': {
    name: 'AI前线',
    url: 'https://aipei-news.oss-cn-beijing.aliyuncs.com/RSS/AI前线.xml',
    language: 'zh'
  }
};

// 默认关键词（用于过滤非 AI 相关的内容）
const DEFAULT_KEYWORDS = [
  'AI', '人工智能', '大模型', 'LLM', 'GPT', 'Claude',
  'ChatGPT', 'OpenAI', 'AIGC', '生成式AI', '机器学习',
  '深度学习', '神经网络', 'RAG', 'Agent', '智能体'
];

// 关键词黑名单（排除的内容）
const BLACKLIST_KEYWORDS = [
  '广告', '招聘', '优惠券', '促销', '赌博', '色情'
];

// 输出目录
const DRAFTS_DIR = path.join(__dirname, '..', 'source', '_drafts');
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

// 时间时区
const TIMEZONE = 'Asia/Shanghai';

// ============== 工具函数 ==============

/**
 * 获取配置
 */
function getConfig() {
  return {
    // 从环境变量或默认配置获取关键词
    keywords: process.env.AI_NEWS_KEYWORDS
      ? process.env.AI_NEWS_KEYWORDS.split(',').map(k => k.trim())
      : DEFAULT_KEYWORDS,
    // 采集数量限制
    limit: parseInt(process.env.AI_NEWS_LIMIT || '10', 10),
    // 是否为草稿模式
    asDraft: process.env.AI_NEWS_AS_DRAFT !== 'false',
    // 输出目录
    outputDir: (process.env.AI_NEWS_AS_DRAFT === 'true') ? DRAFTS_DIR : POSTS_DIR
  };
}

/**
 * 安全的 fetch 请求
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 30000
    };

    protocol.get(url, options, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

/**
 * 解析 RSS XML（使用正则表达式）
 */
function parseRSS(xml, sourceName) {
  const items = [];

  try {
    // 匹配 item 或 entry 标签
    const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      // 提取各字段
      const getContent = (tag) => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const m = itemXml.match(regex);
        return m ? m[1].trim() : '';
      };

      const title = getContent('title');
      let link = getContent('link');

      // link 可能是 <link>url</link> 或 <link href="url"></link>
      if (!link) {
        const hrefMatch = itemXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
        if (hrefMatch) link = hrefMatch[1];
      }

      const description = getContent('description') ||
                         getContent('content:encoded') ||
                         getContent('encoded') ||
                         getContent('summary') || '';
      const pubDate = getContent('pubDate') ||
                     getContent('published') ||
                     getContent('updated') || '';
      const author = getContent('author') ||
                    getContent('dc:creator') ||
                    getContent('creator') || sourceName;

      if (title && link) {
        items.push({
          title,
          link,
          description,
          pubDate,
          author
        });
      }
    }
  } catch (e) {
    console.error(`[${sourceName}] 解析 RSS 失败: ${e.message}`);
  }

  return items;
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
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 检查标题/内容是否包含关键词
 */
function containsKeywords(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * 检查是否包含黑名单关键词
 */
function containsBlacklist(text) {
  if (!text) return false;
  return BLACKLIST_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * 生成 URL slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  try {
    if (!dateStr) return moment().tz(TIMEZONE).format('YYYY-MM-DD');
    const date = moment(dateStr).tz(TIMEZONE);
    if (date.isValid()) {
      return date.format('YYYY-MM-DD');
    }
    return moment().tz(TIMEZONE).format('YYYY-MM-DD');
  } catch (e) {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD');
  }
}

/**
 * 生成 Hexo 草稿的 front-matter
 */
function generateFrontMatter(post, source) {
  const categories = ['AI资讯'];
  const tags = [source, 'AI', '资讯'];

  // 根据内容添加更多标签
  const content = post.title + ' ' + stripHtml(post.description);
  if (content.includes('大模型') || content.includes('LLM')) {
    tags.push('大模型');
  }
  if (content.includes('GPT') || content.includes('ChatGPT')) {
    tags.push('GPT');
  }
  if (content.includes('应用')) {
    tags.push('AI应用');
  }

  return `---
title: ${post.title}
date: ${formatDate(post.pubDate)}
updated: ${moment().tz(TIMEZONE).format('YYYY-MM-DD')}
description: ${stripHtml(post.description).slice(0, 150)}
cover:
categories:
  - ${categories[0]}
tags:
  - ${tags.join('\n  - ')}
source: ${source}
source_link: ${post.link}
author: ${post.author || 'AI资讯机器人'}
comments: true
toc: true
ai_generated: false
---

> 来源: ${source} | [原文链接](${post.link})
> 采集时间: ${moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')}

`;
}

/**
 * 从 URL 获取内容（可选，用于获取完整文章）
 */
async function fetchArticleContent(url) {
  try {
    const html = await fetchUrl(url);

    // 使用正则提取文章内容
    const selectors = [
      /class="article-content"[^>]*>([\s\S]*?)<\/div>/i,
      /class="post-content"[^>]*>([\s\S]*?)<\/div>/i,
      /class="entry-content"[^>]*>([\s\S]*?)<\/div>/i,
      /id="content"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i
    ];

    for (const regex of selectors) {
      const match = html.match(regex);
      if (match && match[1] && match[1].length > 200) {
        return stripHtml(match[1]).slice(0, 500);
      }
    }
  } catch (e) {
    // 忽略错误
  }
  return '';
}

/**
 * 保存草稿文件
 */
async function saveDraft(post, source, outputDir) {
  const slug = slugify(post.title);
  const filename = `${slug}.md`;
  const filepath = path.join(outputDir, filename);

  // 检查是否已存在
  if (fs.existsSync(filepath)) {
    console.log(`  [跳过] 已存在: ${filename}`);
    return false;
  }

  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成内容
  const frontMatter = generateFrontMatter(post, source);
  const summary = stripHtml(post.description).slice(0, 500);

  // 尝试获取完整文章内容
  let fullContent = '';
  try {
    fullContent = await fetchArticleContent(post.link);
  } catch (e) {
    // 忽略错误
  }

  // 根据是否有完整内容决定输出格式
  let content;
  if (fullContent && fullContent.length > 200) {
    content = `${frontMatter}## 资讯概要\n\n${summary}\n\n## 详细内容\n\n${fullContent}\n`;
  } else {
    // RSS只有摘要，没有完整内容时，不生成空洞的"详细内容"部分
    content = `${frontMatter}## 资讯概要\n\n${summary}\n\n> ⚠️ 注意：本文为RSS摘要采集，完整内容请访问 [原文链接](${post.link}) 查看。\n`;
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`  [创建] ${filename}`);
  return true;
}

// ============== 主函数 ==============

/**
 * 采集指定来源的 RSS
 */
async function fetchSource(sourceKey, sourceConfig, config) {
  console.log(`\n正在采集: ${sourceConfig.name} (${sourceConfig.url})`);

  try {
    const xml = await fetchUrl(sourceConfig.url);
    const items = parseRSS(xml, sourceConfig.name);

    console.log(`  获取到 ${items.length} 条内容`);

    let savedCount = 0;
    let skipCount = 0;

    for (const item of items) {
      // 检查黑名单
      if (containsBlacklist(item.title) || containsBlacklist(item.description)) {
        skipCount++;
        continue;
      }

      // 检查关键词
      if (!containsKeywords(item.title, config.keywords) &&
          !containsKeywords(item.description, config.keywords)) {
        skipCount++;
        continue;
      }

      // 保存草稿
      if (await saveDraft(item, sourceConfig.name, config.outputDir)) {
        savedCount++;
      }

      // 检查数量限制
      if (savedCount >= config.limit) {
        console.log(`  已达到限制数量: ${config.limit}`);
        break;
      }
    }

    console.log(`  完成: 新增 ${savedCount} 篇, 跳过 ${skipCount} 篇`);
    return savedCount;
  } catch (e) {
    console.error(`  [错误] ${e.message}`);
    return 0;
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
AI 资讯 RSS 采集脚本

用法:
  node scripts/ai-news-fetch.js [选项]

选项:
  --dry-run          只显示，不创建文件
  --limit N          限制每来源采集数量（默认 10）
  --source NAME      只采集指定来源（如: --source 36kr）
  --list-sources     显示支持的 RSS 源
  --help             显示帮助

环境变量:
  AI_NEWS_KEYWORDS  关键词过滤（逗号分隔）
  AI_NEWS_LIMIT      采集数量限制
  AI_NEWS_AS_DRAFT   是否作为草稿（true/false，默认 true）

示例:
  node scripts/ai-news-fetch.js
  node scripts/ai-news-fetch.js --limit 20
  node scripts/ai-news-fetch.js --source 36kr
  AI_NEWS_KEYWORDS="AI,大模型" node scripts/ai-news-fetch.js
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const config = getConfig();

  // 解析命令行参数
  let dryRun = false;
  let specificSource = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--limit' && args[i + 1]) {
      config.limit = parseInt(args[++i], 10);
    } else if (arg === '--source' && args[i + 1]) {
      specificSource = args[++i];
    } else if (arg === '--list-sources') {
      console.log('支持的 RSS 源:');
      Object.entries(RSS_SOURCES).forEach(([key, source]) => {
        console.log(`  ${key}: ${source.name}`);
      });
      return;
    } else if (arg === '--help') {
      showHelp();
      return;
    }
  }

  console.log('===========================================');
  console.log('AI 资讯 RSS 采集脚本');
  console.log('===========================================');
  console.log(`采集数量限制: ${config.limit}`);
  console.log(`输出模式: ${dryRun ? '预览（不创建文件）' : '创建文件'}`);
  console.log(`输出目录: ${config.outputDir}`);
  console.log(`关键词: ${config.keywords.join(', ')}`);
  console.log('===========================================');

  const sources = specificSource
    ? { [specificSource]: RSS_SOURCES[specificSource] }
    : RSS_SOURCES;

  if (!sources[specificSource] && specificSource) {
    console.error(`未知的 RSS 源: ${specificSource}`);
    console.log('使用 --list-sources 查看支持的源');
    return;
  }

  let totalSaved = 0;

  for (const [key, source] of Object.entries(sources)) {
    const saved = await fetchSource(key, source, config);
    totalSaved += saved;

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n===========================================');
  console.log(`采集完成！共新增 ${totalSaved} 篇`);
  console.log('===========================================');

  if (!dryRun && totalSaved > 0) {
    console.log(`\n提示: 运行 'npm run server' 预览草稿`);
    console.log(`发布前请检查文章质量，运行: node scripts/quality-check.js`);
  }
}

// 运行
main().catch(console.error);

module.exports = { main, fetchSource, saveDraft };