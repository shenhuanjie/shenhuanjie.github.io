/**
 * 文章质量检查脚本
 * 检查 Hexo 文章的元数据完整性和内容质量
 *
 * 用法: node scripts/quality-check.js [路径或目录]
 *
 * 环境变量:
 *   QC_AUTO_FIX     自动修复可修复的问题（true/false）
 *   QC_STRICT       严格模式，检查所有项目（true/false）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ============== 配置 ==============

// 必须的 front-matter 字段
const REQUIRED_FIELDS = ['title', 'date', 'categories', 'tags'];

// 推荐字段
const RECOMMENDED_FIELDS = ['description', 'cover', 'permalink', 'updated'];

// 代码语言白名单
const VALID_CODE_LANGUAGES = [
  'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'go',
  'rust', 'ruby', 'rb', 'php', 'c', 'cpp', 'c++', 'csharp', 'cs',
  'bash', 'shell', 'sh', 'zsh', 'powershell', 'ps1',
  'json', 'yaml', 'yml', 'xml', 'html', 'css', 'scss', 'sass', 'less',
  'sql', 'graphql', 'markdown', 'md', 'dockerfile', 'nginx', 'conf',
  'vim', 'viml', 'lua', 'perl', 'r', 'ruby', 'swift', 'kotlin', 'scala',
  'react', 'jsx', 'tsx', 'vue', 'angular', 'svelte',
  'terraform', 'hcl', 'gradle', 'maven', 'makefile', 'cmake'
];

// 最小/最大长度配置
const MIN_CONTENT_LENGTH = 100;        // 最少 100 字
const MAX_TITLE_LENGTH = 100;           // 标题最多 100 字
const MIN_TITLE_LENGTH = 5;             // 标题最少 5 字
const MIN_SUMMARY_LENGTH = 30;          // 摘要最少 30 字
const MAX_SUMMARY_LENGTH = 300;         // 摘要最多 300 字

// ============== 工具函数 ==============

/**
 * 递归获取所有 .md 文件
 */
function getMarkdownFiles(dirOrFile) {
  const results = [];

  if (!fs.existsSync(dirOrFile)) {
    console.error(`路径不存在: ${dirOrFile}`);
    return results;
  }

  const stat = fs.statSync(dirOrFile);
  if (stat.isFile() && dirOrFile.endsWith('.md')) {
    results.push(dirOrFile);
    return results;
  }

  if (stat.isDirectory()) {
    const files = fs.readdirSync(dirOrFile);
    for (const file of files) {
      const fullPath = path.join(dirOrFile, file);
      const fileStat = fs.statSync(fullPath);

      if (fileStat.isDirectory()) {
        // 跳过 node_modules 等目录
        if (!['node_modules', '.git', 'themes', 'public'].includes(file)) {
          results.push(...getMarkdownFiles(fullPath));
        }
      } else if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * 解析 front-matter
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return { frontMatter: {}, body: content, error: '未找到 front-matter' };
  }

  try {
    const frontMatter = yaml.load(match[1]);
    const body = content.slice(match[0].length).trim();
    return { frontMatter, body, error: null };
  } catch (e) {
    return { frontMatter: {}, body: content, error: `YAML 解析错误: ${e.message}` };
  }
}

/**
 * 检查代码块语言标识
 */
function checkCodeBlocks(body) {
  const codeBlockRegex = /```(\w*)\r?\n[\s\S]*?```/g;
  const issues = [];
  let match;

  while ((match = codeBlockRegex.exec(body)) !== null) {
    const language = match[1].toLowerCase();

    // 检查是否有语言标识
    if (!language) {
      issues.push({
        type: 'warning',
        message: '代码块缺少语言标识',
        line: contentLineNumber(body, match.index)
      });
    } else if (!VALID_CODE_LANGUAGES.includes(language) && language !== 'text' && language !== 'plain') {
      issues.push({
        type: 'info',
        message: `代码语言 "${language}" 不在常用列表中`,
        line: contentLineNumber(body, match.index)
      });
    }
  }

  return issues;
}

/**
 * 获取内容行号（近似）
 */
function contentLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

/**
 * 检查标题长度
 */
function checkTitleLength(title) {
  const issues = [];
  const chineseChars = (title.match(/[一-龥]/g) || []).length;
  const englishChars = (title.match(/[a-zA-Z]/g) || []).length;
  const totalLength = chineseChars + englishChars;

  if (totalLength < MIN_TITLE_LENGTH) {
    issues.push({
      type: 'error',
      message: `标题太短（${totalLength} 字），最少 ${MIN_TITLE_LENGTH} 字`
    });
  }

  if (totalLength > MAX_TITLE_LENGTH) {
    issues.push({
      type: 'warning',
      message: `标题太长（${totalLength} 字），建议不超过 ${MAX_TITLE_LENGTH} 字`
    });
  }

  return issues;
}

/**
 * 检查日期格式
 */
function checkDateFormat(dateStr) {
  const issues = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (dateStr && !dateRegex.test(dateStr)) {
    issues.push({
      type: 'error',
      message: `日期格式错误: "${dateStr}"，应为 YYYY-MM-DD`
    });
  }

  return issues;
}

/**
 * 检查内容长度
 */
function checkContentLength(body) {
  const issues = [];

  // 移除 front-matter 和 markdown 语法
  const cleanContent = body
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/`[^`]*`/g, '')        // 行内代码
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接
    .replace(/[#*_~>`-]/g, '')      // markdown 符号
    .replace(/\s+/g, ' ')           // 空白字符
    .trim();

  // 计算字数
  const chineseChars = (cleanContent.match(/[一-龥]/g) || []).length;
  const englishWords = (cleanContent.match(/[a-zA-Z]+/g) || []).length;
  const totalChars = chineseChars + englishWords;

  if (totalChars < MIN_CONTENT_LENGTH) {
    issues.push({
      type: 'warning',
      message: `内容太短（${totalChars} 字），建议至少 ${MIN_CONTENT_LENGTH} 字`
    });
  }

  return { totalChars, issues };
}

/**
 * 估算阅读时长
 */
function estimateReadingTime(content) {
  const chineseChars = (content.match(/[一-龥]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = chineseChars + Math.ceil(englishWords / 3);

  return Math.ceil(totalWords / 500); // 按 500 字/分钟
}

/**
 * 清理文件名（用于 slug）
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ============== 检查器 ==============

/**
 * 检查单个文件
 */
function checkFile(filepath) {
  const result = {
    file: filepath,
    relativePath: path.relative(process.cwd(), filepath),
    errors: [],
    warnings: [],
    infos: [],
    passed: true
  };

  const content = fs.readFileSync(filepath, 'utf8');
  const { frontMatter, body, error } = parseFrontMatter(content);

  // 检查 front-matter 解析
  if (error) {
    result.errors.push({ message: error });
    result.passed = false;
    return result;
  }

  // 检查必须字段
  for (const field of REQUIRED_FIELDS) {
    if (!frontMatter[field]) {
      result.errors.push({ message: `缺少必须字段: ${field}` });
      result.passed = false;
    }
  }

  // 检查推荐字段
  for (const field of RECOMMENDED_FIELDS) {
    if (!frontMatter[field]) {
      result.warnings.push({ message: `建议添加字段: ${field}` });
    }
  }

  // 检查标题
  if (frontMatter.title) {
    result.warnings.push(...checkTitleLength(frontMatter.title));
  }

  // 检查日期格式
  if (frontMatter.date) {
    result.errors.push(...checkDateFormat(frontMatter.date));
  }

  // 检查更新日期格式
  if (frontMatter.updated) {
    result.errors.push(...checkDateFormat(frontMatter.updated));
  }

  // 检查分类
  if (frontMatter.categories) {
    const cats = Array.isArray(frontMatter.categories) ? frontMatter.categories : [frontMatter.categories];
    if (cats.length === 0 || (cats.length === 1 && !cats[0])) {
      result.errors.push({ message: '分类不能为空' });
      result.passed = false;
    }
  }

  // 检查标签
  if (frontMatter.tags) {
    const tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [frontMatter.tags];
    if (tags.length === 0 || (tags.length === 1 && !tags[0])) {
      result.warnings.push({ message: '建议添加标签' });
    }
    if (tags.length > 10) {
      result.warnings.push({ message: '标签过多，建议不超过 10 个' });
    }
  }

  // 检查摘要
  if (frontMatter.description) {
    const desc = frontMatter.description;
    if (desc.length < MIN_SUMMARY_LENGTH) {
      result.warnings.push({ message: `摘要太短（${desc.length} 字），建议 ${MIN_SUMMARY_LENGTH}-${MAX_SUMMARY_LENGTH} 字` });
    }
    if (desc.length > MAX_SUMMARY_LENGTH) {
      result.warnings.push({ message: `摘要太长（${desc.length} 字），建议不超过 ${MAX_SUMMARY_LENGTH} 字` });
    }
  }

  // 检查封面图
  if (!frontMatter.cover) {
    result.warnings.push({ message: '建议添加封面图 (cover)' });
  }

  // 检查内容长度
  const { totalChars } = checkContentLength(body);
  if (totalChars < MIN_CONTENT_LENGTH) {
    result.passed = false;
  }

  // 检查代码块
  const codeIssues = checkCodeBlocks(body);
  result.warnings.push(...codeIssues);

  // 检查永久链接格式
  if (frontMatter.permalink) {
    if (!frontMatter.permalink.endsWith('.html') && !frontMatter.permalink.endsWith('/')) {
      result.warnings.push({ message: '永久链接建议以 .html 结尾' });
    }
  }

  // 添加阅读时长估算
  result.readingTime = estimateReadingTime(body);
  result.contentLength = totalChars;

  return result;
}

/**
 * 打印检查结果
 */
function printResult(result, verbose = false) {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? '\x1b[32m' : '\x1b[31m';

  console.log(`\n${color}${icon}\x1b[0m ${result.relativePath}`);

  if (verbose || !result.passed) {
    for (const err of result.errors) {
      console.log(`  \x1b[31m错误\x1b[0m ${err.message}`);
    }
  }

  for (const warn of result.warnings) {
    console.log(`  \x1b[33m警告\x1b[0m ${warn.message}`);
  }

  for (const info of result.infos) {
    console.log(`  \x1b[36m信息\x1b[0m ${info.message}`);
  }

  if (verbose) {
    console.log(`  字数: ${result.contentLength} | 预计阅读: ${result.readingTime} 分钟`);
  }
}

/**
 * 打印摘要
 */
function printSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log('\n===========================================');
  console.log('检查摘要');
  console.log('===========================================');
  console.log(`总计: ${total} 篇`);
  console.log(`通过: \x1b[32m${passed}\x1b[0m`);
  console.log(`失败: \x1b[31m${failed}\x1b[0m`);
  console.log(`错误: ${totalErrors}`);
  console.log(`警告: ${totalWarnings}`);
  console.log('===========================================');

  if (failed > 0) {
    console.log('\n失败的文章:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.relativePath}`);
    });
  }
}

// ============== 主函数 ==============

function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'source/_posts';
  const verbose = args.includes('--verbose') || args.includes('-v');
  const autoFix = process.env.QC_AUTO_FIX === 'true';
  const strict = process.env.QC_STRICT === 'true';

  console.log('===========================================');
  console.log('文章质量检查脚本');
  console.log('===========================================');
  console.log(`检查路径: ${targetPath}`);
  console.log(`模式: ${strict ? '严格' : '常规'}${autoFix ? ' (自动修复)' : ''}`);
  console.log('===========================================');

  const files = getMarkdownFiles(targetPath);
  console.log(`找到 ${files.length} 篇文章\n`);

  if (files.length === 0) {
    console.log('未找到任何 Markdown 文件');
    return;
  }

  const results = [];
  for (const file of files) {
    const result = checkFile(file);
    results.push(result);
    printResult(result, verbose);
  }

  printSummary(results);

  // 返回退出码
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { checkFile, getMarkdownFiles, parseFrontMatter };