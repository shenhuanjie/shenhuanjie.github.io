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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 30000
    };

    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function extractCnblogsContent(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 博客园文章内容
  const postBody = doc.querySelector('#post_detail');
  if (!postBody) return null;

  const title = doc.querySelector('.postTitle')?.textContent?.trim() || '';
  const date = doc.querySelector('.postDesc')?.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
  const content = postBody.querySelector('.blogpost-body')?.innerHTML || postBody.innerHTML;

  // 提取图片并下载
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return { title, date, content, images };
}

function extractCsdnContent(html, url) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title = doc.querySelector('h1.title-h1')?.textContent?.trim() ||
                doc.querySelector('h1')?.textContent?.trim() || '';
  const dateMatch = doc.querySelector('.time')?.textContent?.match(/\d{4}-\d{2}-\d{2}/) ||
                    html.match(/发布时间.*?(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';

  const content = doc.querySelector('#content_views')?.innerHTML ||
                  doc.querySelector('.article-content')?.innerHTML || '';

  // 清理CSDN的图片引用
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
}

function extractTencentContent(html, url) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 腾讯开发者社区文章内容提取
  const articleContent = doc.querySelector('.mod-article-content') ||
                         doc.querySelector('.mod-content__markdown') ||
                         doc.querySelector('.article-content');

  const title = doc.querySelector('h1')?.textContent?.trim() ||
                 doc.querySelector('.cdc-m-header-article__title')?.textContent?.trim() || '';

  // 提取日期
  const dateMeta = doc.querySelector('meta[name="subjectTime"]')?.getAttribute('content');
  const dateMatch = dateMeta ? dateMeta.match(/\d{4}-\d{2}-\d{2}/) : null;
  const date = dateMatch ? dateMatch[0] : '';

  const content = articleContent?.innerHTML || '';

  // 清理腾讯的图片引用
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
}

function sanitizeFilename(name) {
  return name.replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '');
}

async function downloadImage(imgUrl, saveDir, index) {
  try {
    const filename = `image-${index}${path.extname(imgUrl.split('?')[0]) || '.png'}`;
    const filepath = path.join(saveDir, filename);

    if (fs.existsSync(filepath)) return filename;

    const response = await fetchUrl(imgUrl);
    fs.writeFileSync(filepath, response);

    return filename;
  } catch (e) {
    console.log(`Failed to download image: ${imgUrl}`);
    return null;
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

function convertToHexoPost(title, date, content, source) {
  const slug = sanitizeFilename(title);
  const hexoDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const frontMatter = `---
title: ${title}
date: ${hexoDate}
categories:
  - AI编程
  - 大模型
tags:
  - ${source}
  - AI
  - 大模型
---

> 来源: ${source}

`;

  return frontMatter + content;
}

async function crawlArticle(article) {
  console.log(`\n Crawling: ${article.title}`);
  console.log(` URL: ${article.url}`);

  try {
    const html = await fetchUrl(article.url);
    let extracted;

    if (article.source === 'cnblogs') {
      extracted = extractCnblogsContent(html);
    } else if (article.source === 'csdn') {
      extracted = extractCsdnContent(html, article.url);
    } else if (article.source === 'tencent') {
      extracted = extractTencentContent(html, article.url);
    }

    if (!extracted || !extracted.content) {
      console.log(` Failed to extract content`);
      return false;
    }

    const slug = sanitizeFilename(extracted.title || article.title);
    const articleDir = path.join(__dirname, '..', 'source', '_posts', slug);
    const imagesDir = path.join(articleDir, 'images');

    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 处理图片
    const processedContent = await processImages(extracted.content, imagesDir, extracted.title);

    // 生成Hexo文章
    const hexoPost = convertToHexoPost(
      extracted.title || article.title,
      extracted.date,
      processedContent,
      article.source
    );

    const mdPath = path.join(articleDir, 'index.md');
    fs.writeFileSync(mdPath, hexoPost, 'utf-8');

    console.log(` Saved: ${mdPath}`);
    return true;
  } catch (e) {
    console.log(` Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('Starting article crawl...\n');

  let success = 0;
  for (const article of ARTICLES) {
    const ok = await crawlArticle(article);
    if (ok) success++;
  }

  console.log(`\n Done! ${success}/${ARTICLES.length} articles crawled successfully.`);
}

main().catch(console.error);
