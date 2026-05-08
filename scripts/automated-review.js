/**
 * 文章自动化审核脚本
 * 检查文章质量并生成审核报告
 *
 * 用法: node scripts/automated-review.js [选项]
 * 选项:
 *   --verbose, -v    显示详细信息
 *   --output FILE    输出报告到指定文件
 *   --format FORMAT  报告格式（json/summary，默认 summary）
 *   --threshold N    质量分数阈值（默认 60）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const moment = require('moment-timezone');

// ============== 配置 ==============

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');
const DRAFTS_DIR = path.join(__dirname, '..', 'source', '_drafts');
const TIMEZONE = 'Asia/Shanghai';

// 质量评分权重
const SCORE_WEIGHTS = {
  frontmatter: 20,      // Frontmatter 完整性
  title: 15,           // 标题质量
  content: 30,         // 内容质量
  meta: 20,            // 元信息质量
  structure: 15        // 结构质量
};

// 质量阈值
const QUALITY_THRESHOLDS = {
  minTitleLength: 8,
  maxTitleLength: 80,
  minContentLength: 200,
  maxContentLength: 50000,
  minWordCount: 100,
  maxWordCount: 10000,
  minDescriptionLength: 50,
  maxDescriptionLength: 500
};

// 必须字段
const REQUIRED_FIELDS = ['title', 'date', 'categories', 'tags'];

// 推荐字段
const RECOMMENDED_FIELDS = ['description', 'cover', 'author', 'excerpt'];

// ============== 工具函数 ==============

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
 * 计算中文字符数
 */
function countChineseChars(text) {
  return (text.match(/[一-龥]/g) || []).length;
}

/**
 * 计算英文字符数
 */
function countEnglishWords(text) {
  return (text.match(/[a-zA-Z]+/g) || []).length;
}

/**
 * 估算总字数
 */
function estimateWordCount(text) {
  const chinese = countChineseChars(text);
  const english = countEnglishWords(text);
  return chinese + english;
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

// ============== 检查函数 ==============

/**
 * 检查 Frontmatter 完整性
 */
function checkFrontmatter(frontMatter) {
  const result = {
    score: 0,
    maxScore: SCORE_WEIGHTS.frontmatter,
    issues: [],
    warnings: []
  };

  if (!frontMatter) {
    result.issues.push({ field: 'frontmatter', message: '无法解析 frontmatter' });
    return result;
  }

  // 检查必需字段
  for (const field of REQUIRED_FIELDS) {
    if (!frontMatter[field]) {
      result.issues.push({ field, message: `缺少必需字段: ${field}` });
    } else if (Array.isArray(frontMatter[field]) && frontMatter[field].length === 0) {
      result.issues.push({ field, message: `字段 ${field} 不能为空数组` });
    }
  }

  // 检查推荐字段
  for (const field of RECOMMENDED_FIELDS) {
    if (!frontMatter[field]) {
      result.warnings.push({ field, message: `建议添加字段: ${field}` });
    }
  }

  // 检查日期格式
  if (frontMatter.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    if (!dateRegex.test(frontMatter.date)) {
      result.warnings.push({ field: 'date', message: '日期格式应为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss' });
    }
  }

  // 计算分数
  const issueCount = result.issues.length;
  if (issueCount === 0) {
    result.score = SCORE_WEIGHTS.frontmatter;
  } else if (issueCount <= 2) {
    result.score = Math.round(SCORE_WEIGHTS.frontmatter * 0.5);
  } else {
    result.score = Math.round(SCORE_WEIGHTS.frontmatter * 0.2);
  }

  return result;
}

/**
 * 检查标题质量
 */
function checkTitle(title, frontMatter) {
  const result = {
    score: 0,
    maxScore: SCORE_WEIGHTS.title,
    issues: [],
    warnings: []
  };

  if (!title) {
    result.issues.push({ field: 'title', message: '标题为空' });
    return result;
  }

  const titleLength = title.length;

  // 检查长度
  if (titleLength < QUALITY_THRESHOLDS.minTitleLength) {
    result.issues.push({ field: 'title', message: `标题过短 (${titleLength}/${QUALITY_THRESHOLDS.minTitleLength} 字符)` });
  } else if (titleLength > QUALITY_THRESHOLDS.maxTitleLength) {
    result.warnings.push({ field: 'title', message: `标题过长 (${titleLength}/${QUALITY_THRESHOLDS.maxTitleLength} 字符)` });
  }

  // 检查标题格式
  if (/^\d+[-._]/.test(title)) {
    result.warnings.push({ field: 'title', message: '标题以序号开头，建议移除' });
  }

  if (/[?!。？！⋯⋯]/.test(title) && titleLength < 15) {
    result.warnings.push({ field: 'title', message: '标题过短且包含标点符号，可能不够规范' });
  }

  // 计算分数
  if (result.issues.length > 0) {
    result.score = 0;
  } else if (result.warnings.length > 0) {
    result.score = Math.round(SCORE_WEIGHTS.title * 0.7);
  } else if (titleLength >= 15 && titleLength <= 50) {
    result.score = SCORE_WEIGHTS.title;
  } else {
    result.score = Math.round(SCORE_WEIGHTS.title * 0.8);
  }

  return result;
}

/**
 * 检查内容质量
 */
function checkContent(body, frontMatter) {
  const result = {
    score: 0,
    maxScore: SCORE_WEIGHTS.content,
    issues: [],
    warnings: [],
    wordCount: 0,
    chineseCharCount: 0
  };

  if (!body) {
    result.issues.push({ field: 'content', message: '文章内容为空' });
    return result;
  }

  const cleanBody = stripHtml(body);
  const wordCount = estimateWordCount(cleanBody);
  const chineseCharCount = countChineseChars(cleanBody);

  result.wordCount = wordCount;
  result.chineseCharCount = chineseCharCount;

  // 检查字数
  if (wordCount < QUALITY_THRESHOLDS.minWordCount) {
    result.issues.push({ field: 'content', message: `内容过短 (${wordCount}/${QUALITY_THRESHOLDS.minWordCount} 字)` });
  } else if (wordCount > QUALITY_THRESHOLDS.maxWordCount) {
    result.warnings.push({ field: 'content', message: `内容过长 (${wordCount}/${QUALITY_THRESHOLDS.maxWordCount} 字)` });
  }

  // 检查纯文本比例
  const rawLength = body.length;
  const cleanLength = cleanBody.length;
  const ratio = cleanLength / rawLength;

  if (ratio < 0.3) {
    result.warnings.push({ field: 'content', message: 'HTML 标签过多，文本比例较低' });
  }

  // 检查是否包含图片
  const hasImages = /<img/i.test(body);
  if (!hasImages && wordCount > 500) {
    result.warnings.push({ field: 'content', message: '长文章建议添加图片' });
  }

  // 检查是否包含链接
  const hasLinks = /<a href=/i.test(body);
  if (!hasLinks) {
    result.warnings.push({ field: 'content', message: '建议添加相关链接' });
  }

  // 计算分数
  const issueCount = result.issues.length;
  if (issueCount > 0) {
    result.score = Math.round(SCORE_WEIGHTS.content * 0.3);
  } else {
    let score = SCORE_WEIGHTS.content;
    // 根据字数调整
    if (wordCount < 500) score *= 0.8;
    else if (wordCount > 3000) score *= 0.9;
    // 扣分警告
    score -= result.warnings.length * 2;
    result.score = Math.max(0, Math.round(score));
  }

  return result;
}

/**
 * 检查元信息质量
 */
function checkMeta(frontMatter, body) {
  const result = {
    score: 0,
    maxScore: SCORE_WEIGHTS.meta,
    issues: [],
    warnings: []
  };

  if (!frontMatter) {
    result.issues.push({ field: 'frontmatter', message: '无法解析 frontmatter' });
    return result;
  }

  // 检查 description/excerpt
  const description = frontMatter.description || frontMatter.excerpt || '';
  const descLength = description.length;

  if (!description) {
    result.warnings.push({ field: 'description', message: '缺少 description/excerpt 字段' });
  } else if (descLength < QUALITY_THRESHOLDS.minDescriptionLength) {
    result.warnings.push({ field: 'description', message: `描述过短 (${descLength}/${QUALITY_THRESHOLDS.minDescriptionLength} 字符)` });
  } else if (descLength > QUALITY_THRESHOLDS.maxDescriptionLength) {
    result.warnings.push({ field: 'description', message: `描述过长 (${descLength}/${QUALITY_THRESHOLDS.maxDescriptionLength} 字符)` });
  }

  // 检查 cover
  if (!frontMatter.cover) {
    result.warnings.push({ field: 'cover', message: '缺少 cover 字段，文章列表页将无封面图' });
  }

  // 检查 author
  if (!frontMatter.author) {
    result.warnings.push({ field: 'author', message: '缺少 author 字段' });
  }

  // 检查 tags
  const tags = frontMatter.tags;
  if (!tags || (Array.isArray(tags) && tags.length === 0)) {
    result.warnings.push({ field: 'tags', message: '建议添加 tags' });
  } else if (Array.isArray(tags) && tags.length > 8) {
    result.warnings.push({ field: 'tags', message: 'tags 不宜过多（建议不超过 8 个）' });
  }

  // 计算分数
  const warningCount = result.warnings.length;
  if (warningCount === 0) {
    result.score = SCORE_WEIGHTS.meta;
  } else if (warningCount <= 2) {
    result.score = Math.round(SCORE_WEIGHTS.meta * 0.7);
  } else {
    result.score = Math.round(SCORE_WEIGHTS.meta * 0.5);
  }

  return result;
}

/**
 * 检查文章结构
 */
function checkStructure(body, frontMatter) {
  const result = {
    score: 0,
    maxScore: SCORE_WEIGHTS.structure,
    issues: [],
    warnings: [],
    headingCount: 0,
    listCount: 0
  };

  if (!body) {
    result.issues.push({ field: 'content', message: '文章内容为空，无法检查结构' });
    return result;
  }

  // 统计标题
  const h2Matches = body.match(/^##\s+/gm);
  const h3Matches = body.match(/^###\s+/gm);
  result.headingCount = (h2Matches ? h2Matches.length : 0) + (h3Matches ? h3Matches.length : 0);

  // 统计列表
  const ulMatches = body.match(/^[-*]\s+/gm);
  const olMatches = body.match(/^\d+\.\s+/gm);
  result.listCount = (ulMatches ? ulMatches.length : 0) + (olMatches ? olMatches.length : 0);

  // 检查标题层级
  if (result.headingCount === 0) {
    result.warnings.push({ field: 'structure', message: '文章没有小标题，建议添加 ## 标题以改善可读性' });
  } else if (result.headingCount > 0) {
    // 检查是否有一级标题被使用
    const h1Matches = body.match(/^#\s+/gm);
    if (h1Matches && h1Matches.length > 0) {
      result.warnings.push({ field: 'structure', message: '文章不应使用 # 一级标题（保留给页面标题）' });
    }
  }

  // 检查段落数量（粗略估计）
  const paragraphs = body.split(/\n\n+/);
  if (paragraphs.length < 3 && body.length > 500) {
    result.warnings.push({ field: 'structure', message: '段落较少，建议使用空行分隔段落' });
  }

  // 计算分数
  if (result.warnings.length === 0 && result.headingCount >= 2) {
    result.score = SCORE_WEIGHTS.structure;
  } else if (result.warnings.length <= 1 && result.headingCount >= 1) {
    result.score = Math.round(SCORE_WEIGHTS.structure * 0.8);
  } else if (result.headingCount === 0) {
    result.score = Math.round(SCORE_WEIGHTS.structure * 0.4);
  } else {
    result.score = Math.round(SCORE_WEIGHTS.structure * 0.6);
  }

  return result;
}

/**
 * 综合评分
 */
function calculateOverallScore(frontmatterScore, titleScore, contentScore, metaScore, structureScore) {
  return frontmatterScore + titleScore + contentScore + metaScore + structureScore;
}

/**
 * 获取质量等级
 */
function getQualityLevel(score) {
  if (score >= 90) return { level: 'A+', label: '优秀', color: 'green' };
  if (score >= 80) return { level: 'A', label: '良好', color: 'green' };
  if (score >= 70) return { level: 'B+', label: '较好', color: 'cyan' };
  if (score >= 60) return { level: 'B', label: '合格', color: 'cyan' };
  if (score >= 50) return { level: 'C', label: '需改进', color: 'yellow' };
  if (score >= 40) return { level: 'D', label: '较差', color: 'red' };
  return { level: 'F', label: '不合格', color: 'red' };
}

// ============== 主函数 ==============

/**
 * 审核单篇文章
 */
function reviewArticle(filePath, verbose = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const { frontMatter, body, error } = parseFrontMatter(content);

  const reviewResult = {
    fileName,
    filePath,
    error: null,
    scores: {},
    totalScore: 0,
    qualityLevel: null,
    issues: [],
    warnings: [],
    stats: {}
  };

  if (error) {
    reviewResult.error = error;
    reviewResult.issues.push({ field: 'frontmatter', message: error });
    return reviewResult;
  }

  // 执行各项检查
  reviewResult.scores.frontmatter = checkFrontmatter(frontMatter);
  reviewResult.scores.title = checkTitle(frontMatter?.title, frontMatter);
  reviewResult.scores.content = checkContent(body, frontMatter);
  reviewResult.scores.meta = checkMeta(frontMatter, body);
  reviewResult.scores.structure = checkStructure(body, frontMatter);

  // 汇总分数
  reviewResult.totalScore = calculateOverallScore(
    reviewResult.scores.frontmatter.score,
    reviewResult.scores.title.score,
    reviewResult.scores.content.score,
    reviewResult.scores.meta.score,
    reviewResult.scores.structure.score
  );

  // 获取质量等级
  reviewResult.qualityLevel = getQualityLevel(reviewResult.totalScore);

  // 收集所有 issues 和 warnings
  for (const [key, scoreResult] of Object.entries(reviewResult.scores)) {
    reviewResult.issues.push(...scoreResult.issues.map(i => ({ ...i, category: key })));
    reviewResult.warnings.push(...scoreResult.warnings.map(w => ({ ...w, category: key })));
  }

  // 统计信息
  reviewResult.stats = {
    wordCount: reviewResult.scores.content.wordCount,
    chineseCharCount: reviewResult.scores.content.chineseCharCount,
    headingCount: reviewResult.scores.structure.headingCount,
    listCount: reviewResult.scores.structure.listCount
  };

  // 详细输出
  if (verbose) {
    console.log(`\n📄 ${fileName}`);
    console.log(`   质量等级: ${reviewResult.qualityLevel.label} (${reviewResult.totalScore}分)`);
    console.log(`   字数: ${reviewResult.stats.wordCount} (中 ${reviewResult.stats.chineseCharCount})`);

    if (reviewResult.issues.length > 0) {
      console.log('   问题:');
      for (const issue of reviewResult.issues) {
        console.log(`     - ${issue.message}`);
      }
    }

    if (reviewResult.warnings.length > 0) {
      console.log('   警告:');
      for (const warning of reviewResult.warnings) {
        console.log(`     - ${warning.message}`);
      }
    }
  }

  return reviewResult;
}

/**
 * 生成报告
 */
function generateReport(results, format = 'summary') {
  if (format === 'json') {
    return JSON.stringify({
      generatedAt: moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
      totalArticles: results.length,
      averageScore: Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length),
      results
    }, null, 2);
  }

  // 汇总统计
  const totalArticles = results.length;
  const passedArticles = results.filter(r => r.totalScore >= 60).length;
  const failedArticles = totalArticles - passedArticles;
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / totalArticles);

  const levelCounts = {
    'A+': results.filter(r => r.qualityLevel?.level === 'A+').length,
    'A': results.filter(r => r.qualityLevel?.level === 'A').length,
    'B+': results.filter(r => r.qualityLevel?.level === 'B+').length,
    'B': results.filter(r => r.qualityLevel?.level === 'B').length,
    'C': results.filter(r => r.qualityLevel?.level === 'C').length,
    'D': results.filter(r => r.qualityLevel?.level === 'D').length,
    'F': results.filter(r => r.qualityLevel?.level === 'F').length
  };

  let report = '';
  report += '\n===========================================\n';
  report += '文章审核报告\n';
  report += '===========================================\n';
  report += `生成时间: ${moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')}\n`;
  report += `检查目录: ${POSTS_DIR}\n`;
  report += '\n--- 总体统计 ---\n';
  report += `文章总数: ${totalArticles}\n`;
  report += `合格文章: ${passedArticles}\n`;
  report += `不合格: ${failedArticles}\n`;
  report += `平均分: ${averageScore}\n`;

  report += '\n--- 质量分布 ---\n';
  for (const [level, count] of Object.entries(levelCounts)) {
    if (count > 0) {
      report += `  ${level}: ${count} 篇\n`;
    }
  }

  // 列出不合格文章
  const failedResults = results.filter(r => r.totalScore < 60);
  if (failedResults.length > 0) {
    report += '\n--- 需要修改的文章 ---\n';
    for (const result of failedResults) {
      report += `\n${result.fileName} (${result.totalScore}分)\n`;
      for (const issue of result.issues) {
        report += `  - ${issue.message}\n`;
      }
    }
  }

  // 列出有警告的文章
  const warnedResults = results.filter(r => r.warnings.length > 0 && r.totalScore >= 60);
  if (warnedResults.length > 0) {
    report += '\n--- 建议优化的文章 ---\n';
    for (const result of warnedResults.slice(0, 10)) {
      report += `\n${result.fileName} (${result.totalScore}分)\n`;
      for (const warning of result.warnings.slice(0, 3)) {
        report += `  - ${warning.message}\n`;
      }
      if (result.warnings.length > 3) {
        report += `  ... 还有 ${result.warnings.length - 3} 条警告\n`;
      }
    }
  }

  if (failedArticles === 0 && warnedResults.length === 0) {
    report += '\n✅ 所有文章审核通过！\n';
  }

  return report;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const showOutput = args.includes('--output');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : null;

  const formatIndex = args.indexOf('--format');
  const format = formatIndex !== -1 && args[formatIndex + 1] ? args[formatIndex + 1] : 'summary';

  const thresholdIndex = args.indexOf('--threshold');
  const threshold = thresholdIndex !== -1 && args[thresholdIndex + 1] ? parseInt(args[thresholdIndex + 1], 10) : 60;

  console.log('===========================================');
  console.log('文章自动化审核');
  console.log('===========================================');
  console.log(`检查目录: ${POSTS_DIR}`);
  console.log(`质量阈值: ${threshold}`);
  console.log(`报告格式: ${format}`);
  console.log('===========================================\n');

  // 获取所有文章
  const postFiles = fs.existsSync(POSTS_DIR)
    ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).map(f => path.join(POSTS_DIR, f))
    : [];

  const draftFiles = fs.existsSync(DRAFTS_DIR)
    ? fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md')).map(f => path.join(DRAFTS_DIR, f))
    : [];

  const allFiles = [...postFiles, ...draftFiles];

  if (allFiles.length === 0) {
    console.log('未找到任何文章文件\n');
    return { passed: true, results: [] };
  }

  console.log(`找到 ${postFiles.length} 篇已发布文章, ${draftFiles.length} 篇草稿\n`);

  // 审核每篇文章
  const results = [];
  for (const file of allFiles) {
    const result = reviewArticle(file, verbose);
    results.push(result);
  }

  // 生成报告
  const report = generateReport(results, format);

  if (outputFile) {
    fs.writeFileSync(outputFile, report, 'utf8');
    console.log(`\n报告已保存到: ${outputFile}`);
  } else {
    console.log(report);
  }

  // 汇总
  const failedCount = results.filter(r => r.totalScore < threshold).length;

  console.log('\n===========================================');
  console.log(`审核完成: ${results.length} 篇, 不合格: ${failedCount} 篇`);
  console.log('===========================================\n');

  return {
    passed: failedCount === 0,
    results,
    report
  };
}

// 运行
if (require.main === module) {
  main()
    .then(result => {
      const failedCount = result.results.filter(r => r.totalScore < 60).length;
      process.exit(result.passed ? 0 : 1);
    })
    .catch(err => {
      console.error('审核失败:', err);
      process.exit(1);
    });
}

module.exports = {
  reviewArticle,
  checkFrontmatter,
  checkTitle,
  checkContent,
  checkMeta,
  checkStructure,
  parseFrontMatter,
  calculateOverallScore,
  getQualityLevel,
  generateReport
};
