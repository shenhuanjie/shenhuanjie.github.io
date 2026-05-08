/**
 * 文章图片检查脚本
 * 检查所有文章中的图片引用，查找本地路径或不可用的图片
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../source/_posts');

// 已检查的文章列表（来自检查报告）
const CHECKED_ARTICLES = [
  'chapter-1-software-architecture-design-principles-z26a8yb.md', // 第 1 章 软件架构设计原则
  'jetbrains-webstorm-etc-the-latest-version-2024-sets-chinese-and-does-not-take-effect-sx7o6.md',
  'gitlab-migrate-and-push-the-code-warehouse-1qrdso.md',
  'docker-huawei-cloud-mirror-image-accelerator-configuration-z1cwhrk.md',
  'how-to-access-wechat-jssdk-in-the-project-correctly-z1fw4wi.md',
  'how-to-implement-the-ios-version-update-detection-in-uniapp-2wfecn.md'
];

// 图片问题模式
const IMAGE_PATTERNS = [
  /127\.0\.0\.1:\d+/g,                    // 本地开发服务器
  /localhost:\d+/g,                        // localhost
  /\.\.\/images\//g,                       // 相对路径图片
  /!\[\]\(.*?\.(png|jpg|jpeg|gif|webp|svg)/gi  // 任何图片引用
];

// 不安全的图片引用模式（本地路径）
function isLocalImage(imageUrl) {
  return imageUrl.includes('127.0.0.1') ||
         imageUrl.includes('localhost') ||
         imageUrl.startsWith('../images/') ||
         imageUrl.startsWith('/images/');
}

function checkArticle(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const lines = content.split('\n');

  // 提取所有图片引用
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const altText = match[1];
    const imageUrl = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (isLocalImage(imageUrl)) {
      issues.push({
        type: 'local_path',
        line: lineNum,
        imageUrl,
        altText
      });
    }
  }

  // 检查是否有 Markdown 图片语法
  const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];

  return {
    fileName: path.basename(filePath),
    issueCount: issues.length,
    issues,
    totalImages: imageMatches.length
  };
}

function main() {
  console.log('开始检查文章图片...\n');

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  let totalArticles = 0;
  let checkedArticles = 0;
  let uncheckedArticles = 0;
  let articlesWithIssues = [];

  for (const file of files) {
    totalArticles++;

    if (CHECKED_ARTICLES.includes(file)) {
      checkedArticles++;
      continue;
    }

    uncheckedArticles++;

    const filePath = path.join(POSTS_DIR, file);
    const result = checkArticle(filePath);

    if (result.issueCount > 0) {
      articlesWithIssues.push(result);
    }
  }

  console.log('=== 检查结果汇总 ===');
  console.log(`文章总数: ${totalArticles}`);
  console.log(`已检查文章: ${checkedArticles}`);
  console.log(`未检查文章: ${uncheckedArticles}`);
  console.log(`发现问题的文章: ${articlesWithIssues.length}`);
  console.log('');

  if (articlesWithIssues.length > 0) {
    console.log('=== 问题文章详情 ===\n');

    for (const article of articlesWithIssues) {
      console.log(`📄 ${article.fileName}`);
      console.log(`   问题数量: ${article.issueCount}`);
      console.log(`   总图片数: ${article.totalImages}`);

      for (const issue of article.issues) {
        console.log(`   - 第 ${issue.line} 行: ${issue.imageUrl}`);
      }
      console.log('');
    }
  } else {
    console.log('✅ 未检查的文章中没有发现图片问题！');
  }

  // 输出未检查文章列表
  console.log('=== 未检查文章列表 ===');
  let i = 1;
  for (const file of files) {
    if (!CHECKED_ARTICLES.includes(file)) {
      console.log(`${i}. ${file}`);
      i++;
    }
  }
}

main();