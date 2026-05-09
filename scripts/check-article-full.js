/**
 * 文章全面检查脚本
 * 检查图片引用、样式问题、Front-matter完整性
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const POSTS_DIR = path.join(__dirname, '../source/_posts');

// 已检查的文章列表
const CHECKED_ARTICLES = [
  'chapter-1-software-architecture-design-principles-z26a8yb.md',
  'jetbrains-webstorm-etc-the-latest-version-2024-sets-chinese-and-does-not-take-effect-sx7o6.md',
  'gitlab-migrate-and-push-the-code-warehouse-1qrdso.md',
  'docker-huawei-cloud-mirror-image-accelerator-configuration-z1cwhrk.md',
  'how-to-access-wechat-jssdk-in-the-project-correctly-z1fw4wi.md',
  'how-to-implement-the-ios-version-update-detection-in-uniapp-2wfecn.md'
];

function isLocalImage(imageUrl) {
  return imageUrl.includes('127.0.0.1') ||
         imageUrl.includes('localhost') ||
         imageUrl.startsWith('../images/') ||
         imageUrl.startsWith('/images/');
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      resolve({ url, accessible: false, error: 'timeout' });
    }, 5000);

    const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      clearTimeout(timeout);
      resolve({ url, accessible: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ url, accessible: false, error: err.message });
    });
  });
}

async function checkArticle(filePath, checkExternalLinks = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const imageUrls = [];

  // 提取所有图片引用
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const imageUrl = match[2];

    if (isLocalImage(imageUrl)) {
      issues.push({
        type: 'local_path',
        line: content.substring(0, match.index).split('\n').length,
        imageUrl
      });
    } else if (checkExternalLinks) {
      imageUrls.push(imageUrl);
    }
  }

  // 检查Front-matter
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontMatterMatch) {
    const fm = frontMatterMatch[1];
    const required = ['title', 'date', 'categories'];
    for (const field of required) {
      if (!fm.includes(`${field}:`)) {
        issues.push({
          type: 'missing_frontmatter',
          field
        });
      }
    }
  } else {
    issues.push({
      type: 'missing_frontmatter',
      field: 'entire_frontmatter'
    });
  }

  // 检查外部链接
  if (checkExternalLinks && imageUrls.length > 0) {
    const results = await Promise.all(imageUrls.map(url => checkUrl(url)));
    for (const result of results) {
      if (!result.accessible) {
        issues.push({
          type: 'external_image_unaccessible',
          imageUrl: result.url,
          error: result.error || `status: ${result.statusCode}`
        });
      }
    }
  }

  return {
    fileName: path.basename(filePath),
    issues,
    totalImages: imageUrls.length + issues.filter(i => i.type === 'local_path').length
  };
}

async function main() {
  console.log('开始全面检查文章...\n');

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  let totalArticles = 0;
  let checkedArticles = 0;
  let uncheckedArticles = 0;
  let articlesWithIssues = [];
  let allChecked = [];

  for (const file of files) {
    totalArticles++;

    const filePath = path.join(POSTS_DIR, file);
    const result = await checkArticle(filePath, false); // 默认不检查外部链接（太慢）

    const status = CHECKED_ARTICLES.includes(file) ? '已检查' : '未检查';

    allChecked.push({
      fileName: file,
      status,
      issueCount: result.issues.length,
      issues: result.issues
    });

    if (CHECKED_ARTICLES.includes(file)) {
      checkedArticles++;
      continue;
    }

    uncheckedArticles++;

    if (result.issues.length > 0) {
      articlesWithIssues.push(result);
    }
  }

  console.log('=== 检查结果汇总 ===');
  console.log(`文章总数: ${totalArticles}`);
  console.log(`已检查文章: ${checkedArticles}`);
  console.log(`未检查文章: ${uncheckedArticles}`);
  console.log(`发现问题的文章: ${articlesWithIssues.length}`);
  console.log('');

  // 显示未检查且有问题的文章
  if (articlesWithIssues.length > 0) {
    console.log('=== 未检查但有问题的文章 ===\n');
    for (const article of articlesWithIssues) {
      console.log(`📄 ${article.fileName}`);
      for (const issue of article.issues) {
        if (issue.type === 'local_path') {
          console.log(`   ⚠️ 第 ${issue.line} 行: 本地图片路径 - ${issue.imageUrl}`);
        } else if (issue.type === 'missing_frontmatter') {
          console.log(`   ⚠️ 缺少 Front-matter 字段: ${issue.field}`);
        }
      }
      console.log('');
    }
  }

  // 输出完整的检查结果统计
  console.log('=== 各文章检查状态 ===');
  for (const item of allChecked.slice(0, 50)) {
    const statusIcon = item.issueCount > 0 ? '⚠️' : '✅';
    console.log(`${statusIcon} ${item.status} - ${item.fileName} (问题: ${item.issueCount})`);
  }

  if (allChecked.length > 50) {
    console.log(`... 还有 ${allChecked.length - 50} 篇文章`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}