/**
 * 文章外部链接检查脚本
 * 检查文章中外部链接的有效性（HEAD 请求验证）
 * 排除 localhost、127.0.0.1 等本地地址
 *
 * 用法: node scripts/check-article-links.js [选项]
 * 选项:
 *   --verbose, -v    显示详细信息
 *   --fix            自动输出修复建议
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');
const TIMEOUT_MS = 5000;
const MAX_CONCURRENT = 10;

// 排除的域名/地址（本地地址）
const EXCLUDED_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /0\.0\.0\.0/i,
  /::1/i,
  /\[::1\]/i
];

// HTTP/HTTPS 协议前缀
const URL_REGEX = /https?:\/\/[^\s\)"']+/gi;

/**
 * 检查 URL 是否应该被排除
 */
function shouldExclude(url) {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 提取文章中所有外部链接
 */
function extractLinks(content) {
  const links = [];
  const seen = new Set();

  // 匹配 Markdown 链接 [text](url) 和直接 URL
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (url && !seen.has(url) && (url.startsWith('http://') || url.startsWith('https://'))) {
      seen.add(url);
      links.push({ url, line: content.substring(0, match.index).split('\n').length });
    }
  }

  // 直接匹配 URL（不在 Markdown 链接中的）
  const directUrlRegex = /(?<![\]\(])\b(https?:\/\/[^\s\)"']+)/gi;
  while ((match = directUrlRegex.exec(content)) !== null) {
    const url = match[1].trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      links.push({ url, line: content.substring(0, match.index).split('\n').length });
    }
  }

  return links;
}

/**
 * 对 URL 发送 HEAD 请求检查有效性
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;

    const timeout = setTimeout(() => {
      resolve({ url, accessible: false, error: 'timeout', statusCode: null });
    }, TIMEOUT_MS);

    try {
      const req = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ArticleLinkChecker/1.0)',
          'Accept': '*/*'
        },
        method: 'HEAD'
      }, (res) => {
        clearTimeout(timeout);
        const accessible = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          url,
          accessible,
          statusCode: res.statusCode,
          error: accessible ? null : `HTTP ${res.statusCode}`
        });
      });

      req.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ url, accessible: false, error: err.message, statusCode: null });
      });

      req.on('timeout', () => {
        req.destroy();
        clearTimeout(timeout);
        resolve({ url, accessible: false, error: 'timeout', statusCode: null });
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ url, accessible: false, error: err.message, statusCode: null });
    }
  });
}

/**
 * 批量检查链接（控制并发数）
 */
async function checkLinksBatch(links) {
  const results = [];
  for (let i = 0; i < links.length; i += MAX_CONCURRENT) {
    const batch = links.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(batch.map(l => checkUrl(l.url)));
    results.push(...batchResults);
  }
  return results;
}

/**
 * 检查单篇文章
 */
async function checkArticle(filePath, verbose = false, checkExternal = true) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const links = extractLinks(content);

  // 过滤本地链接
  const externalLinks = links.filter(l => !shouldExclude(l.url));

  if (verbose) {
    console.log(`\n检查: ${fileName}`);
    console.log(`  总链接数: ${links.length}, 外部链接: ${externalLinks.length}`);
  }

  const invalidLinks = [];

  if (checkExternal && externalLinks.length > 0) {
    // 检查外部链接有效性
    const results = await checkLinksBatch(externalLinks);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const link = externalLinks[i];

      if (!result.accessible) {
        invalidLinks.push({
          url: result.url,
          line: link.line,
          error: result.error,
          statusCode: result.statusCode
        });

        if (verbose) {
          console.log(`  [无效] 第 ${link.line} 行: ${result.url}`);
          console.log(`         错误: ${result.error || 'HTTP ' + result.statusCode}`);
        }
      }
    }
  }

  return {
    fileName,
    totalLinks: links.length,
    externalLinks: externalLinks.length,
    invalidLinks,
    passed: invalidLinks.length === 0
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const showFix = args.includes('--fix');

  console.log('===========================================');
  console.log('文章外部链接检查');
  console.log('===========================================');
  console.log(`检查目录: ${POSTS_DIR}`);
  console.log(`超时设置: ${TIMEOUT_MS}ms`);
  console.log(`并发数: ${MAX_CONCURRENT}`);
  console.log('===========================================\n');

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`找到 ${files.length} 篇文章\n`);

  let totalLinks = 0;
  let totalExternalLinks = 0;
  let articlesWithIssues = 0;
  const allInvalidLinks = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const result = await checkArticle(filePath, verbose, true);

    totalLinks += result.totalLinks;
    totalExternalLinks += result.externalLinks;

    if (!result.passed) {
      articlesWithIssues++;
      allInvalidLinks.push(...result.invalidLinks.map(l => ({
        ...l,
        file: result.fileName
      })));
    }
  }

  // 输出汇总
  console.log('\n===========================================');
  console.log('检查结果汇总');
  console.log('===========================================');
  console.log(`检查文章数: ${files.length}`);
  console.log(`总链接数: ${totalLinks}`);
  console.log(`外部链接数: ${totalExternalLinks}`);
  console.log(`有问题文章数: ${articlesWithIssues}`);
  console.log(`无效链接总数: ${allInvalidLinks.length}`);
  console.log('===========================================');

  if (allInvalidLinks.length > 0) {
    console.log('\n=== 无效链接详情 ===\n');

    // 按文件分组显示
    const groupedByFile = {};
    for (const link of allInvalidLinks) {
      if (!groupedByFile[link.file]) {
        groupedByFile[link.file] = [];
      }
      groupedByFile[link.file].push(link);
    }

    for (const [file, links] of Object.entries(groupedByFile)) {
      console.log(`📄 ${file}`);
      for (const link of links) {
        console.log(`   第 ${link.line} 行: ${link.url}`);
        console.log(`   错误: ${link.error || 'HTTP ' + link.statusCode}`);
        if (showFix) {
          console.log(`   建议: 检查链接是否正确，或移除/替换该链接`);
        }
      }
      console.log('');
    }
  } else {
    console.log('\n✅ 所有外部链接检查通过！');
  }

  return allInvalidLinks.length === 0;
}

// 运行
if (require.main === module) {
  main()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
      console.error('检查失败:', err);
      process.exit(1);
    });
}

module.exports = { extractLinks, checkUrl, shouldExclude, checkArticle };