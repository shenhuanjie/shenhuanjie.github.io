/**
 * 搜索统计分析 (Phase 26: T26.3)
 * 记录搜索词到 localStorage，提供热门搜索和无结果搜索统计
 */

'use strict';

const fs = require('fs');
const path = require('path');

const STORAGE_KEY = 'blog_search_analytics';
const MAX_HISTORY = 500; // 最大保存历史条数

/**
 * 获取分析数据结构
 */
function getAnalyticsData() {
  if (typeof window === 'undefined') {
    // Node.js 环境
    return null;
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
      searches: [],      // 搜索历史
      noResults: [],    // 无结果搜索
      clickData: []      // 点击数据
    };
  } catch (e) {
    console.error('获取搜索分析数据失败:', e);
    return { searches: [], noResults: [], clickData: [] };
  }
}

/**
 * 保存分析数据
 */
function saveAnalyticsData(data) {
  if (typeof window === 'undefined') return;

  try {
    // 限制数据大小
    if (data.searches.length > MAX_HISTORY) {
      data.searches = data.searches.slice(-MAX_HISTORY);
    }
    if (data.noResults.length > MAX_HISTORY) {
      data.noResults = data.noResults.slice(-MAX_HISTORY);
    }
    if (data.clickData.length > MAX_HISTORY) {
      data.clickData = data.clickData.slice(-MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存搜索分析数据失败:', e);
  }
}

/**
 * 记录一次搜索
 * @param {string} keyword - 搜索关键词
 * @param {number} resultCount - 搜索结果数量
 */
function recordSearch(keyword, resultCount) {
  if (!keyword || typeof window === 'undefined') return;

  const data = getAnalyticsData();
  if (!data) return;

  const timestamp = Date.now();
  const searchEntry = {
    keyword: keyword.trim().toLowerCase(),
    resultCount,
    timestamp
  };

  // 添加到搜索历史
  data.searches.push(searchEntry);

  // 如果没有结果，记录到无结果搜索
  if (resultCount === 0) {
    data.noResults.push({
      keyword: keyword.trim().toLowerCase(),
      timestamp
    });
  }

  saveAnalyticsData(data);

  // 同时发送 GA4 事件
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'search', {
      search_term: keyword,
      results_count: resultCount
    });
  }
}

/**
 * 记录搜索结果点击
 * @param {string} keyword - 搜索关键词
 * @param {string} articleUrl - 点击的文章URL
 * @param {number} position - 点击位置
 */
function recordClick(keyword, articleUrl, position) {
  if (!keyword || !articleUrl || typeof window === 'undefined') return;

  const data = getAnalyticsData();
  if (!data) return;

  data.clickData.push({
    keyword: keyword.trim().toLowerCase(),
    articleUrl,
    position,
    timestamp: Date.now()
  });

  saveAnalyticsData(data);
}

/**
 * 获取热门搜索
 * @param {number} limit - 返回数量
 * @returns {Array} 热门搜索列表 [{ keyword, count }]
 */
function getPopularSearches(limit = 20) {
  const data = getAnalyticsData();
  if (!data || !data.searches.length) return [];

  // 统计搜索词频率
  const counts = {};
  data.searches.forEach(entry => {
    const keyword = entry.keyword;
    counts[keyword] = (counts[keyword] || 0) + 1;
  });

  // 排序并返回
  return Object.entries(counts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 获取无结果搜索
 * @param {number} limit - 返回数量
 * @returns {Array} 无结果搜索列表 [{ keyword, timestamp }]
 */
function getNoResultSearches(limit = 20) {
  const data = getAnalyticsData();
  if (!data || !data.noResults.length) return [];

  // 去重并保留最新时间戳
  const unique = {};
  data.noResults.forEach(entry => {
    unique[entry.keyword] = entry;
  });

  return Object.values(unique)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * 获取搜索历史
 * @param {number} limit - 返回数量
 * @returns {Array} 搜索历史
 */
function getSearchHistory(limit = 10) {
  const data = getAnalyticsData();
  if (!data || !data.searches.length) return [];

  // 去重并保留最新时间戳
  const unique = {};
  data.searches.forEach(entry => {
    unique[entry.keyword] = entry;
  });

  return Object.values(unique)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * 清除所有搜索数据
 */
function clearAnalytics() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 获取搜索统计摘要
 * @returns {Object} 统计摘要
 */
function getSearchSummary() {
  const data = getAnalyticsData();
  if (!data) {
    return {
      totalSearches: 0,
      uniqueKeywords: 0,
      noResultCount: 0,
      clickCount: 0
    };
  }

  // 唯一关键词数
  const uniqueKeywords = new Set(data.searches.map(s => s.keyword)).size;

  return {
    totalSearches: data.searches.length,
    uniqueKeywords,
    noResultCount: data.noResults.length,
    clickCount: data.clickData.length
  };
}

/**
 * 导出搜索数据（用于生成报告）
 * @returns {Object} 完整的搜索分析数据
 */
function exportSearchData() {
  const data = getAnalyticsData();
  const summary = getSearchSummary();
  const popular = getPopularSearches(30);
  const noResults = getNoResultSearches(20);

  return {
    summary,
    popularSearches: popular,
    noResultSearches: noResults,
    recentSearches: getSearchHistory(20),
    exportedAt: new Date().toISOString()
  };
}

/**
 * 搜索分析初始化（在前端调用）
 * 在 DOMContentLoaded 后执行初始化
 */
function initSearchAnalytics() {
  if (typeof window === 'undefined') return;

  // 将函数挂载到全局
  window.searchAnalytics = {
    recordSearch,
    recordClick,
    getPopularSearches,
    getNoResultSearches,
    getSearchHistory,
    getSearchSummary,
    exportSearchData,
    clearAnalytics
  };
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    recordSearch: () => {},
    recordClick: () => {},
    getPopularSearches: () => [],
    getNoResultSearches: () => [],
    getSearchHistory: () => [],
    getSearchSummary: () => ({}),
    exportSearchData: () => ({}),
    clearAnalytics: () => {},
    initSearchAnalytics
  };
} else {
  // 浏览器环境
  initSearchAnalytics();
}