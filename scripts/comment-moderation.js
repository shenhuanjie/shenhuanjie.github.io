/**
 * 评论审核脚本
 * 提供敏感词过滤和评论审核功能
 *
 * 功能:
 *   - 敏感词过滤
 *   - 审核通知发送
 *   - 评论数据统计
 *
 * 用法:
 *   const { filterComment } = require('./scripts/comment-moderation');
 *   const result = filterComment('评论内容');
 */

'use strict';

// ============================================
// 敏感词库 (基础版，可扩展)
// ============================================
// 敏感词分类：
// - 政治敏感词
// - 色情低俗词
// - 暴力恐怖词
// - 广告推广词
// - 谩骂攻击词

const SENSITIVE_WORDS = {
  // 政治敏感词 (示例，实际使用时请根据需求配置)
  political: [
    '敏感词1', '敏感词2', '敏感词3'
    // 添加更多政治敏感词
  ],

  // 色情低俗词
  pornographic: [
    '色情词1', '色情词2', '低俗词1'
    // 添加更多色情低俗词
  ],

  // 暴力恐怖词
  violent: [
    '暴力词1', '恐怖词1'
    // 添加更多暴力恐怖词
  ],

  // 广告推广词
  advertising: [
    '加微信', '微信号', 'QQ号', '点击链接', '领取红包',
    '扫码加群', '代理记账', '优惠券', '特价优惠',
    '联系我', '合作共赢', '推广返利'
    // 添加更多广告推广词
  ],

  // 谩骂攻击词
  abusive: [
    '傻瓜', '笨蛋', '智障', '脑残'
    // 添加更多谩骂攻击词
  ]
};

// 所有敏感词的合并集合（用于快速查找）
const ALL_SENSITIVE_WORDS = new Set([
  ...SENSITIVE_WORDS.political,
  ...SENSITIVE_WORDS.pornographic,
  ...SENSITIVE_WORDS.violent,
  ...SENSITIVE_WORDS.advertising,
  ...SENSITIVE_WORDS.abusive
]);

/**
 * 过滤评论中的敏感词
 *
 * @param {string} text - 待过滤的评论文本
 * @returns {Object} - { passed: boolean, flaggedWords: string[], categories: Object }
 */
function filterComment(text) {
  if (!text || typeof text !== 'string') {
    return {
      passed: true,
      flaggedWords: [],
      categories: {}
    };
  }

  const flaggedWords = [];
  const categories = {
    political: [],
    pornographic: [],
    violent: [],
    advertising: [],
    abusive: []
  };

  // 清理文本（转小写以便匹配）
  const normalizedText = text.toLowerCase();

  // 检查每个敏感词
  for (const [category, words] of Object.entries(SENSITIVE_WORDS)) {
    for (const word of words) {
      if (normalizedText.includes(word.toLowerCase())) {
        if (!flaggedWords.includes(word)) {
          flaggedWords.push(word);
          categories[category].push(word);
        }
      }
    }
  }

  return {
    passed: flaggedWords.length === 0,
    flaggedWords,
    categories
  };
}

/**
 * 检查评论是否包含链接
 *
 * @param {string} text - 评论文本
 * @returns {boolean} - 是否包含链接
 */
function containsLink(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // URL 正则表达式
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]/gi;
  return urlPattern.test(text);
}

/**
 * 检查评论是否包含联系方式
 *
 * @param {string} text - 评论文本
 * @returns {Object} - { hasContact: boolean, contactType: string[] }
 */
function containsContact(text) {
  if (!text || typeof text !== 'string') {
    return { hasContact: false, contactType: [] };
  }

  const contactPatterns = {
    phone: /1[3-9]\d{9}/g,  // 手机号
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    wechat: /微信|wechat|wx\d+/gi,
    qq: /QQ\s*\d+|\d{5,11}/g
  };

  const foundTypes = [];

  for (const [type, pattern] of Object.entries(contactPatterns)) {
    if (pattern.test(text)) {
      foundTypes.push(type);
    }
  }

  return {
    hasContact: foundTypes.length > 0,
    contactType: foundTypes
  };
}

/**
 * 综合审核评论
 *
 * @param {string} text - 评论文本
 * @returns {Object} - 审核结果
 */
function moderateComment(text) {
  // 1. 敏感词过滤
  const wordFilterResult = filterComment(text);

  // 2. 链接检测
  const hasLink = containsLink(text);

  // 3. 联系方式检测
  const contactResult = containsContact(text);

  // 综合判断
  const reasons = [];

  if (!wordFilterResult.passed) {
    reasons.push(`包含敏感词: ${wordFilterResult.flaggedWords.join(', ')}`);
  }

  if (hasLink) {
    reasons.push('包含外部链接');
  }

  if (contactResult.hasContact) {
    reasons.push(`包含联系方式: ${contactResult.contactType.join(', ')}`);
  }

  return {
    passed: wordFilterResult.passed && !hasLink && !contactResult.hasContact,
    wordFilter: wordFilterResult,
    hasLink,
    contact: contactResult,
    reasons,
    timestamp: new Date().toISOString()
  };
}

/**
 * 添加敏感词到词库
 *
 * @param {string} category - 分类
 * @param {string|string[]} words - 敏感词
 */
function addSensitiveWords(category, words) {
  if (!SENSITIVE_WORDS[category]) {
    SENSITIVE_WORDS[category] = [];
  }

  const wordArray = Array.isArray(words) ? words : [words];

  for (const word of wordArray) {
    if (!SENSITIVE_WORDS[category].includes(word)) {
      SENSITIVE_WORDS[category].push(word);
      ALL_SENSITIVE_WORDS.add(word);
    }
  }
}

/**
 * 从词库移除敏感词
 *
 * @param {string} category - 分类
 * @param {string|string[]} words - 敏感词
 */
function removeSensitiveWords(category, words) {
  if (!SENSITIVE_WORDS[category]) return;

  const wordArray = Array.isArray(words) ? words : [words];

  for (const word of wordArray) {
    const index = SENSITIVE_WORDS[category].indexOf(word);
    if (index > -1) {
      SENSITIVE_WORDS[category].splice(index, 1);
      ALL_SENSITIVE_WORDS.delete(word);
    }
  }
}

/**
 * 获取敏感词统计
 *
 * @returns {Object} - 敏感词统计信息
 */
function getStatistics() {
  const stats = {};
  let total = 0;

  for (const [category, words] of Object.entries(SENSITIVE_WORDS)) {
    stats[category] = words.length;
    total += words.length;
  }

  return {
    categories: stats,
    total,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * 导出评论审核数据（用于生成报告）
 *
 * @param {Object} moderationResult - 审核结果
 * @param {Object} commentInfo - 评论信息
 * @returns {Object} - 导出的数据
 */
function exportModerationData(moderationResult, commentInfo) {
  return {
    comment: {
      text: commentInfo.text,
      author: commentInfo.author,
      email: commentInfo.email,
      articleTitle: commentInfo.articleTitle,
      articleUrl: commentInfo.articleUrl
    },
    moderation: moderationResult,
    exportedAt: new Date().toISOString()
  };
}

// 主函数（命令行使用）
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
评论审核脚本

用法:
  node scripts/comment-moderation.js "评论内容"
  node scripts/comment-moderation.js --filter "评论内容"
  node scripts/comment-moderation.js --stats
  node scripts/comment-moderation.js --add <分类> <词语>
  node scripts/comment-moderation.js --remove <分类> <词语>

示例:
  node scripts/comment-moderation.js "这是一条测试评论"
  node scripts/comment-moderation.js --stats
  node scripts/comment-moderation.js --add advertising "新敏感词"
    `);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case '--filter':
    case '-f':
      const text = args.slice(1).join(' ');
      const result = filterComment(text);
      console.log('审核结果:', JSON.stringify(result, null, 2));
      break;

    case '--moderate':
    case '-m':
      const moderateText = args.slice(1).join(' ');
      const moderateResult = moderateComment(moderateText);
      console.log('综合审核结果:', JSON.stringify(moderateResult, null, 2));
      break;

    case '--stats':
    case '-s':
      const stats = getStatistics();
      console.log('敏感词库统计:', JSON.stringify(stats, null, 2));
      break;

    case '--add':
      const addCategory = args[1];
      const addWords = args.slice(2);
      if (addCategory && addWords.length > 0) {
        addSensitiveWords(addCategory, addWords);
        console.log(`已添加敏感词: ${addWords.join(', ')} 到分类 [${addCategory}]`);
      } else {
        console.log('用法: --add <分类> <词语>');
      }
      break;

    case '--remove':
      const removeCategory = args[1];
      const removeWords = args.slice(2);
      if (removeCategory && removeWords.length > 0) {
        removeSensitiveWords(removeCategory, removeWords);
        console.log(`已移除敏感词: ${removeWords.join(', ')} 从分类 [${removeCategory}]`);
      } else {
        console.log('用法: --remove <分类> <词语>');
      }
      break;

    default:
      // 直接作为评论内容处理
      const commentText = args.join(' ');
      const commentResult = moderateComment(commentText);
      console.log('审核结果:', JSON.stringify(commentResult, null, 2));
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = {
  filterComment,
  moderateComment,
  containsLink,
  containsContact,
  addSensitiveWords,
  removeSensitiveWords,
  getStatistics,
  exportModerationData,
  SENSITIVE_WORDS
};