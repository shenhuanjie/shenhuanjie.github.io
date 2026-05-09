/**
 * 搜索结果高亮功能 (Phase 26: T26.2)
 * 在搜索结果中高亮显示匹配的关键词
 */

'use strict';

/**
 * 转义特殊字符
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高亮文本中的关键词
 * @param {string} text - 原始文本（已转义的HTML）
 * @param {string} keyword - 要高亮的关键词
 * @param {string} className - 高亮类名，默认 'search-highlight'
 * @returns {string} 高亮后的HTML
 */
function highlightText(text, keyword, className = 'search-highlight') {
  if (!text || !keyword) return text;

  // 对关键词进行转义，防止特殊字符问题
  const escapedKeyword = escapeRegExp(keyword);

  // 创建正则表达式，gi 表示全局匹配且不区分大小写
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');

  // 替换为高亮标签
  return text.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * 高亮多个关键词
 * @param {string} text - 原始文本
 * @param {Array<string>} keywords - 关键词数组
 * @param {string} className - 高亮类名
 * @returns {string} 高亮后的HTML
 */
function highlightMultiple(text, keywords, className = 'search-highlight') {
  if (!text || !keywords || !Array.isArray(keywords)) {
    return text;
  }

  let result = text;

  // 按长度降序排序，确保先匹配长词
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

  sortedKeywords.forEach(keyword => {
    if (keyword && keyword.trim()) {
      result = highlightText(result, keyword.trim(), className);
    }
  });

  return result;
}

/**
 * 提取搜索结果摘要（包含关键词上下文）
 * @param {string} content - 文章内容
 * @param {string} keyword - 搜索关键词
 * @param {number} contextLength - 上下文长度（前后各多少字符）
 * @returns {string} 包含关键词的摘要
 */
function extractHighlightExcerpt(content, keyword, contextLength = 80) {
  if (!content || !keyword) return content.substring(0, 160);

  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const lowerText = plainText.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    // 关键词不在内容中，返回开头部分
    return plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
  }

  // 计算截取范围
  let start = Math.max(0, index - contextLength);
  let end = Math.min(plainText.length, index + keyword.length + contextLength);

  let excerpt = plainText.substring(start, end);

  // 添加省略号
  if (start > 0) excerpt = '...' + excerpt;
  if (end < plainText.length) excerpt += '...';

  return excerpt;
}

/**
 * 创建搜索结果片段（用于显示在列表中）
 * @param {Object} result - 搜索结果对象 { title, content, url, ... }
 * @param {string} keyword - 搜索关键词
 * @param {number} maxLength - 最大长度
 * @returns {Object} 处理后的结果 { title, excerpt, url }
 */
function createSearchSnippet(result, keyword, maxLength = 160) {
  // 高亮标题
  const title = highlightText(result.title || 'Untitled', keyword);

  // 提取并高亮摘要
  let content = result.content || result.title || '';
  const excerpt = extractHighlightExcerpt(content, keyword, 60);
  const highlightedExcerpt = highlightText(excerpt, keyword);

  return {
    title,
    excerpt: highlightedExcerpt,
    url: result.url || '#'
  };
}

// 导出函数
module.exports = {
  highlightText,
  highlightMultiple,
  extractHighlightExcerpt,
  createSearchSnippet,
  escapeRegExp
};