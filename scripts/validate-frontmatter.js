/**
 * Frontmatter 验证脚本
 * 检查所有文章的 frontmatter 是否完整
 * 必需字段：title, date, tags, categories
 *
 * 用法: node scripts/validate-frontmatter.js [选项]
 * 选项:
 *   --verbose, -v    显示详细信息
 *   --fix            自动输出修复建议
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 配置
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

// 必须字段
const REQUIRED_FIELDS = ['title', 'date', 'tags', 'categories'];

// 推荐字段
const RECOMMENDED_FIELDS = ['description', 'cover', 'permalink', 'updated'];

// 日期格式验证
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

/**
 * 解析 frontmatter
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return { frontMatter: null, body: content, error: '未找到 frontmatter 分隔符' };
  }

  try {
    const frontMatter = yaml.load(match[1]);
    const body = content.slice(match[0].length).trim();
    return { frontMatter, body, error: null };
  } catch (e) {
    return { frontMatter: null, body: content, error: `YAML 解析错误: ${e.message}` };
  }
}

/**
 * 检查单个字段
 */
function checkField(frontMatter, fieldName) {
  const issues = [];
  const value = frontMatter[fieldName];

  // 检查是否存在
  if (value === undefined || value === null) {
    return [{ type: 'error', field: fieldName, message: `缺少必需字段: ${fieldName}` }];
  }

  // 检查是否为空
  if (typeof value === 'string' && value.trim() === '') {
    return [{ type: 'error', field: fieldName, message: `字段 ${fieldName} 不能为空` }];
  }

  if (Array.isArray(value) && value.length === 0) {
    return [{ type: 'error', field: fieldName, message: `字段 ${fieldName} 数组不能为空` }];
  }

  // 特定字段验证
  if (fieldName === 'date') {
    if (typeof value === 'string' && !DATE_REGEX.test(value)) {
      issues.push({
        type: 'error',
        field: fieldName,
        message: `日期格式错误: "${value}"，应为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss`
      });
    }
  }

  if (fieldName === 'tags' || fieldName === 'categories') {
    const arr = Array.isArray(value) ? value : [value];
    if (arr.some(item => !item || (typeof item === 'string' && item.trim() === ''))) {
      issues.push({
        type: 'error',
        field: fieldName,
        message: `${fieldName} 包含空值`
      });
    }
  }

  return issues;
}

/**
 * 检查单篇文章
 */
function checkArticle(filePath, verbose = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const { frontMatter, body, error } = parseFrontMatter(content);

  const issues = [];

  if (error) {
    issues.push({ type: 'error', field: 'frontmatter', message: error });
    return { fileName, issues, passed: false };
  }

  if (!frontMatter) {
    issues.push({ type: 'error', field: 'frontmatter', message: 'Frontmatter 为空' });
    return { fileName, issues, passed: false };
  }

  // 检查必须字段
  for (const field of REQUIRED_FIELDS) {
    issues.push(...checkField(frontMatter, field));
  }

  // 检查推荐字段（警告级别）
  for (const field of RECOMMENDED_FIELDS) {
    const value = frontMatter[field];
    if (value === undefined || value === null) {
      issues.push({ type: 'warning', field, message: `建议添加字段: ${field}` });
    }
  }

  // 检查内容是否存在
  if (!body || body.trim().length < 10) {
    issues.push({ type: 'error', field: 'content', message: '文章内容过短或为空' });
  }

  const passed = !issues.some(i => i.type === 'error');

  if (verbose && !passed) {
    console.log(`\n检查: ${fileName}`);
    for (const issue of issues) {
      if (issue.type === 'error') {
        console.log(`  [错误] ${issue.message}`);
      } else {
        console.log(`  [警告] ${issue.message}`);
      }
    }
  }

  return { fileName, issues, passed };
}

/**
 * 生成修复建议
 */
function generateFixSuggestions(frontMatter, issues) {
  const suggestions = [];

  for (const issue of issues) {
    if (issue.type !== 'error') continue;

    switch (issue.field) {
      case 'title':
        suggestions.push('title: 请输入文章标题');
        break;
      case 'date':
        suggestions.push(`date: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
        break;
      case 'tags':
        suggestions.push('tags:\n  - 标签1\n  - 标签2');
        break;
      case 'categories':
        suggestions.push('categories:\n  - 分类1');
        break;
      default:
        break;
    }
  }

  return suggestions;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const showFix = args.includes('--fix');

  console.log('===========================================');
  console.log('Frontmatter 验证');
  console.log('===========================================');
  console.log(`检查目录: ${POSTS_DIR}`);
  console.log(`必需字段: ${REQUIRED_FIELDS.join(', ')}`);
  console.log(`推荐字段: ${RECOMMENDED_FIELDS.join(', ')}`);
  console.log('===========================================\n');

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`找到 ${files.length} 篇文章\n`);

  let articlesWithErrors = 0;
  let articlesWithWarnings = 0;
  const allIssues = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const result = checkArticle(filePath, verbose);

    if (result.issues.length > 0) {
      allIssues.push({ file: result.fileName, issues: result.issues });

      if (!result.passed) {
        articlesWithErrors++;
      } else {
        articlesWithWarnings++;
      }
    }
  }

  // 输出汇总
  console.log('\n===========================================');
  console.log('验证结果汇总');
  console.log('===========================================');
  console.log(`检查文章数: ${files.length}`);
  console.log(`有错误的文章数: ${articlesWithErrors}`);
  console.log(`有警告的文章数: ${articlesWithWarnings}`);
  console.log('===========================================');

  // 按错误和警告分组
  const errorsByArticle = allIssues.filter(a => a.issues.some(i => i.type === 'error'));
  const warningsByArticle = allIssues.filter(a => a.issues.every(i => i.type === 'warning'));

  if (errorsByArticle.length > 0) {
    console.log('\n=== 有错误的文章 ===\n');
    for (const article of errorsByArticle) {
      console.log(`📄 ${article.file}`);
      for (const issue of article.issues.filter(i => i.type === 'error')) {
        console.log(`   ✗ ${issue.message}`);
      }
      if (showFix) {
        const suggestions = generateFixSuggestions({}, article.issues);
        for (const suggestion of suggestions) {
          console.log(`   建议: ${suggestion}`);
        }
      }
      console.log('');
    }
  }

  if (warningsByArticle.length > 0) {
    console.log('\n=== 有警告的文章 ===\n');
    for (const article of warningsByArticle) {
      console.log(`📄 ${article.file}`);
      for (const issue of article.issues.filter(i => i.type === 'warning')) {
        console.log(`   ⚠ ${issue.message}`);
      }
      console.log('');
    }
  }

  if (errorsByArticle.length === 0 && warningsByArticle.length === 0) {
    console.log('\n✅ 所有文章的 Frontmatter 验证通过！');
  }

  // 返回结果
  return { passed: errorsByArticle.length === 0, totalErrors: articlesWithErrors, totalWarnings: articlesWithWarnings };
}

// 运行
if (require.main === module) {
  main()
    .then(result => process.exit(result.passed ? 0 : 1))
    .catch(err => {
      console.error('验证失败:', err);
      process.exit(1);
    });
}

module.exports = { parseFrontMatter, checkArticle, checkField, REQUIRED_FIELDS, RECOMMENDED_FIELDS };