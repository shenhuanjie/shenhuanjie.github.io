const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 文章URL列表
const ARTICLES = [
  {
    url: 'https://www.cnblogs.com/itech/p/19823070',
    source: 'cnblogs',
    title: 'AI Native Engineer: 2026年软件工程师的终极形态'
  },
  {
    url: 'https://blog.csdn.net/2401_85325557/article/details/157543818',
    source: 'csdn',
    title: '2026AI大模型应用开发终极指南: 从入门到精通的完整学习路线图'
  },
  {
    url: 'https://blog.csdn.net/2401_85325726/article/details/158320901',
    source: 'csdn',
    title: '2026年大模型最值得关注的9个研究方向'
  },
  {
    url: 'https://blog.csdn.net/2301_81888214/article/details/160135708',
    source: 'csdn',
    title: '2026 Top 5的本地大语言模型工具'
  },
  {
    url: 'https://cloud.tencent.com/developer/article/2435158',
    source: 'tencent',
    title: '腾讯发布大模型时代的AI十大趋势：走进"机器外脑"时代'
  },
  {
    url: 'https://cloud.tencent.com/developer/article/2438018',
    source: 'tencent',
    title: '用腾讯Cloud Studio一键免费部署AI大模型'
  }
];

// 配置常量
const MIN_CONTENT_LENGTH = 200;  // 最小文章长度
const MAX_RETRIES = 3;           // 最大重试次数
const RETRY_DELAY = 2000;        // 重试延迟(ms)
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

/**
 * 获取已存在的文章标题列表（用于去重）
 */
function getExistingArticles() {
  const existing = new Set();
  if (!fs.existsSync(POSTS_DIR)) return existing;

  const dirs = fs.readdirSync(POSTS_DIR);
  for (const dir of dirs) {
    const indexPath = path.join(POSTS_DIR, dir, 'index.md');
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        if (titleMatch) existing.add(titleMatch[1].trim());
      } catch (e) {
        console.warn(`警告: 读取已有文章失败 ${dir}: ${e.message}`);
      }
    }
  }
  return existing;
}

/**
 * 检查URL是否已采集
 */
function isUrlAlreadyCrawled(url, existingArticles) {
  for (const title of existingArticles) {
    const slug = sanitizeFilename(title);
    const articleDir = path.join(POSTS_DIR, slug);
    if (fs.existsSync(articleDir)) {
      const indexPath = path.join(articleDir, 'index.md');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        if (content.includes(url)) return true;
      }
    }
  }
  return false;
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的URL获取
 */
async function fetchUrl(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  [${attempt}/${retries}] 请求: ${url}`);
      const protocol = url.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        timeout: 30000
      };

      const response = await new Promise((resolve, reject) => {
        const req = protocol.get(url, options, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // 处理重定向
            resolve(fetchUrl(res.headers.location, 1));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return response;
    } catch (e) {
      console.log(`  请求失败: ${e.message}`);
      if (attempt < retries) {
        console.log(`  ${RETRY_DELAY}ms 后重试...`);
        await delay(RETRY_DELAY);
      } else {
        throw e;
      }
    }
  }
}

function extractCnblogsContent(html) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const postBody = doc.querySelector('#post_detail');
    if (!postBody) return null;

    const title = doc.querySelector('.postTitle')?.textContent?.trim() || '';
    const date = doc.querySelector('.postDesc')?.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
    const content = postBody.querySelector('.blogpost-body')?.innerHTML || postBody.innerHTML;

    const images = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      images.push(match[1]);
    }

    return { title, date, content, images };
  } catch (e) {
    console.error(`  提取博客园内容失败: ${e.message}`);
    return null;
  }
}

function extractCsdnContent(html, url) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const title = doc.querySelector('h1.title-h1')?.textContent?.trim() ||
                  doc.querySelector('h1')?.textContent?.trim() || '';
    const dateMatch = doc.querySelector('.time')?.textContent?.match(/\d{4}-\d{2}-\d{2}/) ||
                      html.match(/发布时间.*?(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    const content = doc.querySelector('#content_views')?.innerHTML ||
                    doc.querySelector('.article-content')?.innerHTML || '';

    let cleanContent = content.replace(/data-src=/g, 'src=');
    cleanContent = cleanContent.replace(/https:\/\/img-blog\.csdn\.net[^"']*/g, (match) => {
      return match;
    });

    const images = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(cleanContent)) !== null) {
      images.push(match[1]);
    }

    return { title, date, content: cleanContent, images };
  } catch (e) {
    console.error(`  提取CSDN内容失败: ${e.message}`);
    return null;
  }
}

function extractTencentContent(html, url) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const articleContent = doc.querySelector('.mod-article-content') ||
                           doc.querySelector('.mod-content__markdown') ||
                           doc.querySelector('.article-content');

    const title = doc.querySelector('h1')?.textContent?.trim() ||
                   doc.querySelector('.cdc-m-header-article__title')?.textContent?.trim() || '';

    const dateMeta = doc.querySelector('meta[name="subjectTime"]')?.getAttribute('content');
    const dateMatch = dateMeta ? dateMeta.match(/\d{4}-\d{2}-\d{2}/) : null;
    const date = dateMatch ? dateMatch[0] : '';

    const content = articleContent?.innerHTML || '';

    let cleanContent = content.replace(/data-src=/g, 'src=');
    cleanContent = cleanContent.replace(/src="[^"]*cloudcache[^"]*"/g, (match) => {
      return match;
    });

    const images = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(cleanContent)) !== null) {
      images.push(imgMatch[1]);
    }

    return { title, date, content: cleanContent, images };
  } catch (e) {
    console.error(`  提取腾讯内容失败: ${e.message}`);
    return null;
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * 下载图片（带重试）
 */
async function downloadImage(imgUrl, saveDir, index, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const ext = path.extname(imgUrl.split('?')[0]) || '.png';
      const filename = `image-${index}${ext}`;
      const filepath = path.join(saveDir, filename);

      if (fs.existsSync(filepath)) return filename;

      const response = await fetchUrl(imgUrl, 1);
      fs.writeFileSync(filepath, response);
      console.log(`    图片已下载: ${filename}`);
      return filename;
    } catch (e) {
      console.warn(`    图片下载失败 (${attempt}/${retries}): ${imgUrl}`);
      if (attempt < retries) {
        await delay(RETRY_DELAY);
      } else {
        console.warn(`    跳过图片: ${imgUrl}`);
        return null;
      }
    }
  }
}

async function processImages(content, articleDir, articleTitle) {
  let processedContent = content;
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const images = [...content.matchAll(imgRegex)];

  for (let i = 0; i < images.length; i++) {
    const imgUrl = images[i][1];
    if (imgUrl.startsWith('data:') || imgUrl.startsWith('//')) continue;

    const filename = await downloadImage(imgUrl, articleDir, i + 1);
    if (filename) {
      processedContent = processedContent.replace(imgUrl, `images/${filename}`);
    }
  }

  return processedContent;
}

function convertToHexoPost(title, date, content, source, originalUrl) {
  const slug = sanitizeFilename(title);
  const hexoDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const frontMatter = `---
title: ${title}
date: ${hexoDate}
source: ${originalUrl}
categories:
  - AI编程
  - 大模型
tags:
  - ${source}
  - AI
  - 大模型
---

> 来源: ${source}
> 原文: ${originalUrl}

`;

  return frontMatter + content;
}

/**
 * 文章质量检查
 */
function checkQuality(extracted, originalUrl) {
  if (!extracted) {
    console.log(`  质量检查: 提取内容为空`);
    return false;
  }

  if (!extracted.content || extracted.content.length < MIN_CONTENT_LENGTH) {
    console.log(`  质量检查: 内容过短 (${extracted.content?.length || 0} < ${MIN_CONTENT_LENGTH} 字)`);
    return false;
  }

  // 过滤无意义内容
  const strippedContent = extracted.content.replace(/<[^>]+>/g, '').trim();
  if (strippedContent.length < MIN_CONTENT_LENGTH) {
    console.log(`  质量检查: 纯文本内容过短`);
    return false;
  }

  return true;
}

async function crawlArticle(article) {
  console.log(`\n▶ 开始采集: ${article.title}`);
  console.log(`  URL: ${article.url}`);

  try {
    const html = await fetchUrl(article.url);
    let extracted;

    if (article.source === 'cnblogs') {
      extracted = extractCnblogsContent(html);
    } else if (article.source === 'csdn') {
      extracted = extractCsdnContent(html, article.url);
    } else if (article.source === 'tencent') {
      extracted = extractTencentContent(html, article.url);
    } else {
      console.log(`  未知来源: ${article.source}`);
      return false;
    }

    // 质量检查
    if (!checkQuality(extracted, article.url)) {
      return false;
    }

    const slug = sanitizeFilename(extracted.title || article.title);
    const articleDir = path.join(POSTS_DIR, slug);
    const imagesDir = path.join(articleDir, 'images');

    fs.mkdirSync(articleDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // 处理图片
    const processedContent = await processImages(extracted.content, imagesDir, extracted.title);

    // 生成Hexo文章
    const hexoPost = convertToHexoPost(
      extracted.title || article.title,
      extracted.date,
      processedContent,
      article.source,
      article.url
    );

    const mdPath = path.join(articleDir, 'index.md');
    fs.writeFileSync(mdPath, hexoPost, 'utf-8');

    console.log(`  ✓ 已保存: ${mdPath}`);
    console.log(`  ✓ 字数: ${processedContent.replace(/<[^>]+>/g, '').length}`);
    return true;
  } catch (e) {
    console.error(`  ✗ 错误: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('===========================================');
  console.log('       文章采集脚本 v2.0');
  console.log('===========================================');
  console.log(`\n配置:`);
  console.log(`  - 最小文章长度: ${MIN_CONTENT_LENGTH} 字`);
  console.log(`  - 最大重试次数: ${MAX_RETRIES}`);
  console.log(`  - 文章目录: ${POSTS_DIR}`);
  console.log('');

  // 获取已存在的文章
  console.log('检查已存在的文章...');
  const existingArticles = getExistingArticles();
  console.log(`已发现 ${existingArticles.size} 篇文章\n`);

  let success = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    // 去重检查
    if (isUrlAlreadyCrawled(article.url, existingArticles)) {
      console.log(`\n⏭ 跳过已采集: ${article.title}`);
      console.log(`  URL: ${article.url}`);
      skipped++;
      continue;
    }

    const ok = await crawlArticle(article);
    if (ok) success++;
  }

  console.log('\n===========================================');
  console.log('       采集完成');
  console.log('===========================================');
  console.log(`成功: ${success}/${ARTICLES.length}`);
  console.log(`跳过: ${skipped}`);
  console.log(`失败: ${ARTICLES.length - success - skipped}`);
  console.log('===========================================\n');
}

main().catch(e => {
  console.error('脚本执行失败:', e);
  process.exit(1);
});
