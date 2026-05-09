/**
 * 搜索建议数据源 (Phase 26: T26.1)
 * 从现有文章中提取关键词，提供搜索建议功能
 */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 获取所有文章路径
function getPostFiles() {
  const sourceDir = path.join(__dirname, '../source/_posts');
  return glob.sync('**/*.md', { cwd: sourceDir });
}

// 从 frontmatter 解析 YAML
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {
    title: '',
    tags: [],
    categories: []
  };

  // 解析 title
  const titleMatch = yaml.match(/^title:\s*(.+)$/m);
  if (titleMatch) result.title = titleMatch[1].trim().replace(/^["']|["']$/g, '');

  // 解析 tags (支持多行格式)
  const tagsMatch = yaml.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
  if (tagsMatch) {
    result.tags = tagsMatch[1].split('\n').map(line => {
      const tag = line.match(/^\s*-\s*(.+)$/);
      return tag ? tag[1].trim() : null;
    }).filter(Boolean);
  }

  // 解析 categories (支持多行格式)
  const categoriesMatch = yaml.match(/^categories:\s*\n((?:\s*-\s*.+\n?)*)/m);
  if (categoriesMatch) {
    result.categories = categoriesMatch[1].split('\n').map(line => {
      const cat = line.match(/^\s*-\s*(.+)$/);
      return cat ? cat[1].trim() : null;
    }).filter(Boolean);
  }

  return result;
}

// 停用词列表
const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '我', '有', '个', '人', '这',
  '不', '也', '就', '到', '说', '去', '你', '会', '着', '没',
  '看', '好', '自己', '还', '后', '能', '对', '事', '却', '话',
  '就', '那', '他', '她', '它', '们', '这个', '那个', '什么',
  '如何', '怎么', '怎样', '为什么', '可以', '应该', '需要',
  '使用', '使用', '实现', '完成', '进行', '处理', '设置',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'about'
]);

// 中文分词（简单实现，基于词典）
function tokenizeChinese(text) {
  const tokens = [];
  // 简单的基于规则的中文分词
  const patterns = [
    /[一-龥]{2,}/g,  // 连续中文字符
    /[a-zA-Z0-9]+/g          // 英文和数字
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      tokens.push(match[0].toLowerCase());
    }
  }

  return tokens;
}

// 提取关键词
function extractKeywords(title, tags, categories) {
  const keywords = new Set();

  // 添加标题中的关键词
  const titleTokens = tokenizeChinese(title);
  titleTokens.forEach(token => {
    if (token.length >= 2 && !STOP_WORDS.has(token)) {
      keywords.add(token);
    }
  });

  // 添加标签
  tags.forEach(tag => {
    const cleanTag = tag.trim();
    if (cleanTag && !STOP_WORDS.has(cleanTag.toLowerCase())) {
      keywords.add(cleanTag);
      // 如果标签是英文，也添加分词结果
      const tokens = tokenizeChinese(cleanTag);
      tokens.forEach(t => {
        if (t.length >= 2) keywords.add(t);
      });
    }
  });

  // 添加分类
  categories.forEach(cat => {
    const cleanCat = cat.trim();
    if (cleanCat && !STOP_WORDS.has(cleanCat.toLowerCase())) {
      keywords.add(cleanCat);
    }
  });

  return Array.from(keywords);
}

// 构建搜索建议数据
function buildSuggestionsData() {
  const postFiles = getPostFiles();
  const suggestionsMap = new Map(); // keyword -> { count, type }

  postFiles.forEach(file => {
    const filePath = path.join(__dirname, '../source/_posts', file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter.title) return;

      const keywords = extractKeywords(
        frontmatter.title,
        frontmatter.tags || [],
        frontmatter.categories || []
      );

      keywords.forEach(keyword => {
        if (suggestionsMap.has(keyword)) {
          const item = suggestionsMap.get(keyword);
          item.count++;
        } else {
          // 判断类型
          let type = 'title';
          if (frontmatter.tags && frontmatter.tags.includes(keyword)) {
            type = 'tag';
          } else if (frontmatter.categories && frontmatter.categories.includes(keyword)) {
            type = 'category';
          }
          suggestionsMap.set(keyword, { count: 1, type });
        }
      });
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  });

  // 转换为数组并排序
  const suggestions = Array.from(suggestionsMap.entries())
    .map(([keyword, data]) => ({ keyword, ...data }))
    .sort((a, b) => {
      // 按类型优先级排序：tag > category > title
      const typeOrder = { tag: 0, category: 1, title: 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;
      // 然后按出现次数排序
      return b.count - a.count;
    });

  return suggestions;
}

// 模糊匹配函数
function fuzzyMatch(keyword, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const k = keyword.toLowerCase();

  // 完全包含
  if (k.includes(q)) return true;

  // 简拼匹配（取首字母）
  if (q.length >= 1) {
    const kPY = getPinyinInitials(k);
    const qPY = getPinyinInitials(q);
    if (kPY && qPY && kPY.includes(qPY)) return true;
  }

  return false;
}

// 获取拼音首字母（简单实现）
function getPinyinInitials(str) {
  // 只处理纯英文字符串
  if (/^[a-zA-Z]+$/.test(str)) {
    return str.substring(0, Math.min(2, str.length));
  }
  return null;
}

/**
 * 获取搜索建议
 * @param {string} query - 搜索查询
 * @param {number} limit - 返回结果数量限制
 * @returns {Array} 匹配的建议列表
 */
function getSuggestions(query, limit = 10) {
  if (!query || query.length < 1) {
    return [];
  }

  const suggestionsData = buildSuggestionsData();
  const q = query.toLowerCase().trim();

  // 过滤匹配的建议
  const matched = suggestionsData
    .filter(item => {
      const k = item.keyword.toLowerCase();
      return k.includes(q) || fuzzyMatch(item.keyword, q);
    })
    .slice(0, limit);

  return matched;
}

/**
 * 获取热门搜索建议（用于展示在无搜索词时）
 * @param {number} limit - 返回数量
 * @returns {Array} 热门建议
 */
function getPopularSuggestions(limit = 8) {
  const suggestionsData = buildSuggestionsData();
  return suggestionsData.slice(0, limit);
}

// 导出函数
module.exports = {
  getSuggestions,
  getPopularSuggestions,
  buildSuggestionsData
};