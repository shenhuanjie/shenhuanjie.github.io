/**
 * 发布前检查脚本
 * 自动化发布流程的检查清单
 *
 * 用法: node scripts/pre-publish-check.js [选项]
 *   --file <文件>  检查指定文章
 *   --fix          自动修复可修复的问题
 *   --verbose      显示详细信息
 *   --strict       严格模式，任何警告都导致失败
 *   --checklist    仅运行 CHECKLIST 检查（文章级别）
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

/**
 * 文章级别检查清单 (T43.1)
 * 用于自动化文章发布前的质量检查
 */
const CHECKLIST = [
  {
    name: 'title_length',
    label: '标题长度',
    rule: title => title.length >= 10 && title.length <= 60,
    message: '标题长度应在 10-60 字之间'
  },
  {
    name: 'description_exists',
    label: '描述存在性',
    rule: post => post.description && post.description.length >= 50,
    message: '描述应至少 50 字'
  },
  {
    name: 'keywords_optimized',
    label: '关键词优化',
    rule: post => post.keywords && post.keywords.length <= 5,
    message: '关键词数量应不超过 5 个'
  },
  {
    name: 'has_cover_image',
    label: '封面图',
    rule: post => post.cover_image !== null && post.cover_image !== undefined && post.cover_image !== '',
    message: '必须设置封面图'
  },
  {
    name: 'code_blocks_formatted',
    label: '代码块格式',
    rule: post => {
      if (!post.content) return true;
      // 检查代码块是否有正确的语法标记
      const codeBlockRegex = /```[\s\S]*?```|`[\s\S]*?`/g;
      const matches = post.content.match(codeBlockRegex);
      if (!matches) return true; // 没有代码块算通过
      // 检查是否有语言标记
      return matches.every(block => /^```\w*/.test(block) || /^`[^`]+`$/.test(block));
    },
    message: '代码块应使用正确的语法标记 (如 ```javascript)'
  },
  {
    name: 'internal_links',
    label: '内部链接',
    rule: post => {
      if (!post.content) return false;
      // 匹配内部链接 (以 / 或相对路径开头)
      const internalLinkRegex = /\[([^\]]+)\]\((?:\/|[^.])[^)]*\)/g;
      const matches = post.content.match(internalLinkRegex);
      return matches && matches.length >= 3;
    },
    message: '文章应至少包含 3 个内部链接'
  },
  {
    name: 'external_links_safe',
    label: '外链安全',
    rule: post => {
      if (!post.content) return true;
      // 检查外链格式是否正确 (https:// 开头)
      const externalLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      const matches = [...post.content.matchAll(externalLinkRegex)];
      if (matches.length === 0) return true;
      // 检查是否有可疑的协议
      const suspiciousProtocols = ['javascript:', 'data:', 'vbscript:'];
      return !matches.some(m => suspiciousProtocols.some(p => m[2].toLowerCase().startsWith(p)));
    },
    message: '外链格式不正确或包含可疑协议'
  },
  {
    name: 'reading_time_reasonable',
    label: '阅读时间',
    rule: post => {
      const rt = post.reading_time;
      if (typeof rt !== 'number') return false;
      return rt >= 3 && rt <= 20;
    },
    message: '阅读时间应在 3-20 分钟之间'
  }
];

/**
 * 解析文章内容提取检查所需数据
 */
function parseArticleForChecklist(content) {
  const { frontMatter, error } = parseFrontMatter(content);

  if (error) {
    return { error };
  }

  // 提取纯文本内容用于检查
  let textContent = content;
  // 移除 frontmatter
  if (textContent.startsWith('---')) {
    const endIndex = textContent.indexOf('---', 3);
    if (endIndex !== -1) {
      textContent = textContent.substring(endIndex + 3);
    }
  }

  // 移除 markdown 语法，获取纯文本
  textContent = textContent
    .replace(/```[\s\S]*?```/g, ' code ') // 保留 code 标记
    .replace(/`[^`]+`/g, ' code ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接转为文本
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/[*_~`]/g, '') // 移除格式字符
    .replace(/\n+/g, ' ') // 换行转空格
    .trim();

  return {
    title: frontMatter.title || '',
    description: frontMatter.description || frontMatter.excerpt || '',
    keywords: frontMatter.keywords || [],
    cover_image: frontMatter.cover_image || frontMatter.cover || null,
    content: content, // 保留原始内容用于代码块和链接检查
    reading_time: frontMatter.reading_time || frontMatter.readTime || null
  };
}

/**
 * 运行文章级别 CHECKLIST 检查 (T43.1)
 */
function runChecklist(filePath, verbose = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const article = parseArticleForChecklist(content);

  if (article.error) {
    return {
      passed: false,
      results: [{ name: 'frontmatter', passed: false, message: article.error }]
    };
  }

  const results = [];
  let passedCount = 0;

  for (const check of CHECKLIST) {
    let passed;
    try {
      // 根据检查项类型传入不同参数
      if (check.name === 'title_length') {
        passed = check.rule(article.title);
      } else {
        passed = check.rule(article);
      }
    } catch (e) {
      passed = false;
    }

    results.push({
      name: check.name,
      label: check.label,
      passed,
      message: passed ? '通过' : check.message
    });

    if (passed) passedCount++;
  }

  if (verbose) {
    console.log('\n--- CHECKLIST 检查结果 ---');
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.label}: ${result.message}`);
    }
    console.log(`\n通过率: ${passedCount}/${results.length}`);
  }

  return {
    passed: passedCount === results.length,
    results,
    article
  };
}

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
  const useChecklistOnly = args.includes('--checklist');

  let filePath = null;
  let result;

  // 解析 --file 参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') {
      filePath = args[++i];
      break;
    }
  }

  // 如果指定了文件，运行单文章 CHECKLIST 检查
  if (filePath) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ 文件不存在: ${fullPath}`);
      process.exit(1);
    }

    console.log('===========================================');
    console.log('文章发布前 CHECKLIST 检查 (T43.1)');
    console.log('===========================================');
    console.log(`文件: ${path.basename(fullPath)}`);
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('===========================================\n');

    result = runChecklist(fullPath, verbose);

    console.log('\n===========================================');
    if (result.passed) {
      console.log('✅ CHECKLIST 检查全部通过！');
    } else {
      console.log('❌ CHECKLIST 检查未通过');
      const failed = result.results.filter(r => !r.passed);
      console.log(`失败项目: ${failed.map(r => r.label).join(', ')}`);
    }
    console.log('===========================================');

    // 如果是严格模式且有失败项，退出码为 1
    const exitCode = (strict && !result.passed) ? 1 : (result.passed ? 0 : 1);
    process.exit(exitCode);
  }

  // 否则运行完整检查流程
  result = await runAllChecks(verbose, strict);

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
module.exports = {
  runAllChecks,
  checkFrontmatter,
  checkQuality,
  checkLinksValidity,
  checkImagesIntegrity,
  runChecklist,
  CHECKLIST
};