/**
 * AI Helper - Claude API 集成脚本
 * 提供文章摘要、SEO描述、标签生成功能
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_TTL = 60 * 60 * 1000; // 1小时
const MAX_TOKENS_SUMMARY = 100;
const MAX_TOKENS_DESCRIPTION = 150;
const MAX_TOKENS_TAGS = 50;

// API 配置
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/**
 * 确保缓存目录存在
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 获取缓存 key
 */
function getCacheKey(type, content) {
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return path.join(CACHE_DIR, `${type}_${hash}.json`);
}

/**
 * 读取缓存
 */
function readCache(type, content) {
  const cacheKey = getCacheKey(type, content);
  if (!fs.existsSync(cacheKey)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheKey, 'utf8'));
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data.value;
    }
    // 缓存过期，删除
    fs.unlinkSync(cacheKey);
  } catch (e) {
    // 忽略错误
  }
  return null;
}

/**
 * 写入缓存
 */
function writeCache(type, content, value) {
  ensureCacheDir();
  const cacheKey = getCacheKey(type, content);
  fs.writeFileSync(cacheKey, JSON.stringify({
    value,
    timestamp: Date.now()
  }), 'utf8');
}

/**
 * 调用 Claude API
 */
async function callClaude(prompt, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 环境变量未设置');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * 生成文章摘要（中文，100字内）
 * @param {string} content - 文章内容
 * @param {string} lang - 语言（默认中文）
 * @returns {Promise<string>}
 */
async function generateSummary(content, lang = 'zh') {
  // 检查缓存
  const cached = readCache('summary', content);
  if (cached) {
    console.log('[AI Helper] 使用缓存摘要');
    return cached;
  }

  // 截取内容前2000字符（控制成本）
  const truncatedContent = content.slice(0, 2000);

  const prompt = `请为以下文章生成一个简洁的中文摘要，要求：
1. 字数控制在100字以内
2. 概括文章核心内容
3. 语言精炼专业
4. 只返回摘要内容，不要其他解释

文章内容：
${truncatedContent}`;

  try {
    const summary = await callClaude(prompt, MAX_TOKENS_SUMMARY);
    const cleanSummary = summary.trim();
    writeCache('summary', content, cleanSummary);
    return cleanSummary;
  } catch (error) {
    console.error('[AI Helper] 生成摘要失败:', error.message);
    throw error;
  }
}

/**
 * 生成 SEO 描述（150字内）
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {Promise<string>}
 */
async function generateDescription(title, content) {
  // 检查缓存
  const cacheKey = `desc_${title}`;
  const cached = readCache('description', cacheKey);
  if (cached) {
    console.log('[AI Helper] 使用缓存描述');
    return cached;
  }

  // 截取内容前2000字符（控制成本）
  const truncatedContent = content.slice(0, 2000);

  const prompt = `请为以下文章生成一个 SEO 友好的描述，要求：
1. 字数控制在150字以内
2. 包含关键词，适合搜索引擎收录
3. 语言简洁有吸引力
4. 只返回描述内容，不要其他解释

标题：${title}
内容：${truncatedContent}`;

  try {
    const description = await callClaude(prompt, MAX_TOKENS_DESCRIPTION);
    const cleanDescription = description.trim();
    writeCache('description', cacheKey, cleanDescription);
    return cleanDescription;
  } catch (error) {
    console.error('[AI Helper] 生成描述失败:', error.message);
    throw error;
  }
}

/**
 * 推荐标签（3-5个）
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {Promise<string[]>}
 */
async function generateTags(title, content) {
  // 检查缓存
  const cacheKey = `tags_${title}`;
  const cached = readCache('tags', cacheKey);
  if (cached) {
    console.log('[AI Helper] 使用缓存标签');
    return cached;
  }

  // 截取内容前2000字符（控制成本）
  const truncatedContent = content.slice(0, 2000);

  const prompt = `请为以下文章推荐3-5个标签，要求：
1. 标签要准确反映文章主题
2. 使用中文
3. 标签之间用逗号分隔
4. 只返回标签，不要其他解释

标题：${title}
内容：${truncatedContent}`;

  try {
    const tagsText = await callClaude(prompt, MAX_TOKENS_TAGS);
    const tags = tagsText.split(/[,，、]/).map(t => t.trim()).filter(t => t);
    const limitedTags = tags.slice(0, 5);
    writeCache('tags', cacheKey, limitedTags);
    return limitedTags;
  } catch (error) {
    console.error('[AI Helper] 生成标签失败:', error.message);
    throw error;
  }
}

/**
 * 清除所有缓存
 */
function clearCache() {
  if (fs.existsSync(CACHE_DIR)) {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    });
    console.log('[AI Helper] 缓存已清除');
  }
}

/**
 * 清除过期缓存
 */
function cleanExpiredCache() {
  if (!fs.existsSync(CACHE_DIR)) {
    return;
  }

  const files = fs.readdirSync(CACHE_DIR);
  let cleaned = 0;

  files.forEach(file => {
    const filePath = path.join(CACHE_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Date.now() - data.timestamp >= CACHE_TTL) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch (e) {
      // 忽略错误文件
    }
  });

  console.log(`[AI Helper] 已清除 ${cleaned} 个过期缓存`);
}

// 导出模块
module.exports = {
  generateSummary,
  generateDescription,
  generateTags,
  clearCache,
  cleanExpiredCache
};

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--clear')) {
    clearCache();
  } else if (args.includes('--clean')) {
    cleanExpiredCache();
  } else if (args.includes('--help')) {
    console.log(`
AI Helper CLI

用法:
  node scripts/ai-helper.js [选项]

选项:
  --clear    清除所有缓存
  --clean    清除过期缓存
  --help     显示帮助

示例:
  node scripts/ai-helper.js --clear
  node scripts/ai-helper.js --clean
`);
  }
}