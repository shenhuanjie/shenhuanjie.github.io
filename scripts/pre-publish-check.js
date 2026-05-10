/**
 * 发布前检查脚本
 * 自动化发布流程的检查清单
 *
 * 用法: node scripts/pre-publish-check.js [选项]
 *   --fix      自动修复可修复的问题
 *   --verbose  显示详细信息
 *   --strict   严格模式，任何警告都导致失败
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { checkFile } = require('./quality-check.js');
const { checkArticle: checkLinks } = require('./check-article-links.js');
const { checkArticle: checkImages } = require('./check-article-images.js');
const { parseFrontMatter } = require('./validate-frontmatter.js');

// 检查项定义
const CHECK_ITEMS = [
  { name: 'frontmatter', label: 'Frontmatter 验证', critical: true },
  { name: 'quality', label: '文章质量检查', critical: true },
  { name: 'links', label: '链接有效性', critical: false },
  { name: 'images', label: '图片完整性', critical: false }
];

// 问题类型到退出码的映射
const EXIT_CODES = {
  frontmatter: 1,
  quality: 1,
  links: 0,  // 非关键，警告
  images: 0  // 非关键，警告
};

/**
 * 获取所有文章文件
 */
function getArticleFiles() {
  const postsDir = path.join(__dirname, '..', 'source', '_posts');
  const files = [];

  if (!fs.existsSync(postsDir)) {
    return files;
  }

  const items = fs.readdirSync(postsDir);
  for (const item of items) {
    const fullPath = path.join(postsDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && item.endsWith('.md')) {
      files.push(fullPath);
    } else if (stat.isDirectory()) {
      // 递归获取子目录中的文件
      const subFiles = fs.readdirSync(fullPath)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(fullPath, f));
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * 检查 frontmatter
 */
function checkFrontmatter(verbose = false) {
  const files = getArticleFiles();
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const { frontMatter, error } = parseFrontMatter(content);

    if (error) {
      issues.push({ file, type: 'error', message: error });
      continue;
    }

    // 检查必需字段
    const required = ['title', 'date', 'tags', 'categories'];
    for (const field of required) {
      if (!frontMatter[field]) {
        issues.push({ file, type: 'error', message: `缺少字段: ${field}` });
      }
    }

    // 检查日期格式
    if (frontMatter.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontMatter.date)) {
        issues.push({ file, type: 'error', message: `日期格式错误: ${frontMatter.date}` });
      }
    }
  }

  return issues;
}

/**
 * 检查文章质量
 */
function checkQuality(verbose = false) {
  const files = getArticleFiles();
  const issues = [];

  for (const file of files) {
    const result = checkFile(file);

    for (const err of result.errors) {
      issues.push({ file, type: 'error', message: err.message });
    }
    for (const warn of result.warnings) {
      issues.push({ file, type: 'warning', message: warn.message });
    }
  }

  return issues;
}

/**
 * 检查链接
 */
function checkLinksValidity(verbose = false) {
  const files = getArticleFiles();
  const issues = [];

  for (const file of files) {
    const result = checkLinks(file);

    if (result.brokenLinks && result.brokenLinks.length > 0) {
      for (const link of result.brokenLinks) {
        issues.push({
          file,
          type: 'error',
          message: `失效链接: ${link.url} (在 ${link.context || '未知位置'})`
        });
      }
    }
  }

  return issues;
}

/**
 * 检查图片
 */
function checkImagesIntegrity(verbose = false) {
  const files = getArticleFiles();
  const issues = [];

  for (const file of files) {
    const result = checkImages(file);

    if (result.missingImages && result.missingImages.length > 0) {
      for (const img of result.missingImages) {
        issues.push({
          file,
          type: 'warning',
          message: `缺失图片: ${img}`
        });
      }
    }
  }

  return issues;
}

/**
 * 运行所有检查
 */
async function runAllChecks(verbose = false, strict = false) {
  console.log('===========================================');
  console.log('发布前检查清单');
  console.log('===========================================');
  console.log(`检查时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`模式: ${strict ? '严格模式' : '常规模式'}`);
  console.log('===========================================\n');

  const results = {};
  let criticalErrors = 0;
  let warnings = 0;

  // 1. Frontmatter 检查
  console.log('[1/4] 检查 Frontmatter...');
  results.frontmatter = checkFrontmatter(verbose);
  if (results.frontmatter.length > 0) {
    criticalErrors += results.frontmatter.filter(i => i.type === 'error').length;
    warnings += results.frontmatter.filter(i => i.type === 'warning').length;
    console.log(`   发现 ${results.frontmatter.length} 个问题`);
  } else {
    console.log('   ✅ 通过');
  }

  // 2. 质量检查
  console.log('\n[2/4] 检查文章质量...');
  results.quality = checkQuality(verbose);
  if (results.quality.length > 0) {
    criticalErrors += results.quality.filter(i => i.type === 'error').length;
    warnings += results.quality.filter(i => i.type === 'warning').length;
    console.log(`   发现 ${results.quality.length} 个问题`);
  } else {
    console.log('   ✅ 通过');
  }

  // 3. 链接检查
  console.log('\n[3/4] 检查链接有效性...');
  results.links = checkLinksValidity(verbose);
  if (results.links.length > 0) {
    criticalErrors += results.links.filter(i => i.type === 'error').length;
    warnings += results.links.filter(i => i.type === 'warning').length;
    console.log(`   发现 ${results.links.length} 个问题`);
  } else {
    console.log('   ✅ 通过');
  }

  // 4. 图片检查
  console.log('\n[4/4] 检查图片完整性...');
  results.images = checkImagesIntegrity(verbose);
  if (results.images.length > 0) {
    warnings += results.images.length;
    console.log(`   发现 ${results.images.length} 个问题`);
  } else {
    console.log('   ✅ 通过');
  }

  // 打印汇总
  console.log('\n===========================================');
  console.log('检查结果汇总');
  console.log('===========================================');
  console.log(`关键错误: ${criticalErrors}`);
  console.log(`警告: ${warnings}`);

  // 详细输出
  if (verbose && criticalErrors > 0) {
    console.log('\n--- 错误详情 ---');
    for (const [category, issues] of Object.entries(results)) {
      const errors = issues.filter(i => i.type === 'error');
      if (errors.length > 0) {
        console.log(`\n[${category}]`);
        for (const issue of errors) {
          const relPath = path.relative(process.cwd(), issue.file);
          console.log(`  ${relPath}: ${issue.message}`);
        }
      }
    }
  }

  if (verbose && warnings > 0 && strict) {
    console.log('\n--- 警告详情 ---');
    for (const [category, issues] of Object.entries(results)) {
      const warns = issues.filter(i => i.type === 'warning');
      if (warns.length > 0) {
        console.log(`\n[${category}]`);
        for (const issue of warns) {
          const relPath = path.relative(process.cwd(), issue.file);
          console.log(`  ${relPath}: ${issue.message}`);
        }
      }
    }
  }

  console.log('===========================================');

  // 确定是否通过
  const passed = strict ? (criticalErrors === 0 && warnings === 0) : (criticalErrors === 0);

  if (passed) {
    console.log('\n✅ 所有关键检查通过，可以发布！');
  } else {
    console.log('\n❌ 检查未通过，请修复上述问题后重试');
  }

  return { passed, criticalErrors, warnings, results };
}

/**
 * 生成检查报告（用于通知）
 */
function generateReport(results) {
  const lines = [];

  lines.push('# 发布前检查报告\n');
  lines.push(`检查时间: ${new Date().toLocaleString('zh-CN')}\n`);
  lines.push('---\n');

  for (const [category, issues] of Object.entries(results)) {
    if (issues.length > 0) {
      lines.push(`## ${category}\n`);
      for (const issue of issues) {
        const relPath = path.relative(process.cwd(), issue.file);
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        lines.push(`${icon} ${relPath}: ${issue.message}\n`);
      }
      lines.push('\n');
    }
  }

  return lines.join('');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const strict = args.includes('--strict');
  const fix = args.includes('--fix');
  const report = args.includes('--report');

  const result = await runAllChecks(verbose, strict);

  // 生成报告
  if (report) {
    const reportContent = generateReport(result.results);
    const reportPath = path.join(__dirname, '..', 'reports', `pre-publish-check-${Date.now()}.md`);
    const reportsDir = path.dirname(reportPath);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 报告已生成: ${reportPath}`);
  }

  // 退出码
  process.exit(result.passed ? 0 : 1);
}

// 导出
module.exports = { runAllChecks, checkFrontmatter, checkQuality, checkLinksValidity, checkImagesIntegrity };