#!/usr/bin/env node
/**
 * 修复空洞的"详细内容 请访问原文"问题
 * 策略：删除空洞的详细内容部分，保留有意义的摘要
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

// 需要删除的模式
const PATTERNS_TO_REMOVE = [
  // 空洞的详细内容部分
  /\n## 详细内容\s*\n+\s*请访问\s+\[原文链接\]\([^)]+\)\s*查看完整内容。?\s*\n*/gi,
  // 可能的变体
  /\n## 详细内容\s*\n+\s*请访问\s+\[原文链接\]\([^)]+\)[^\n]*\n*/gi,
];

// 检查是否是空洞文章的函数
function isEmptyArticle(content) {
  // 检查是否只有概要，没有实际详细内容
  return /## 资讯概要/.test(content) && !/## 详细内容[\s\n]+[^#]/.test(content);
}

// 统计
let fixed = 0;
let skipped = 0;
let errors = 0;

console.log('开始修复空洞文章...\n');

// 读取所有md文件
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filepath = path.join(POSTS_DIR, file);

  try {
    let content = fs.readFileSync(filepath, 'utf8');
    let originalContent = content;
    let modified = false;

    // 检查是否包含"请访问原文"
    if (!content.includes('请访问') || !content.includes('原文链接')) {
      skipped++;
      continue;
    }

    // 尝试修复
    for (const pattern of PATTERNS_TO_REMOVE) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '\n');
        modified = true;
      }
      pattern.lastIndex = 0; // 重置正则状态
    }

    if (modified) {
      // 清理多余的空行
      content = content.replace(/\n{3,}/g, '\n\n');

      // 写入
      fs.writeFileSync(filepath, content, 'utf8');
      fixed++;
      console.log(`✅ 修复: ${file}`);
    } else {
      skipped++;
    }
  } catch (e) {
    console.error(`❌ 错误: ${file} - ${e.message}`);
    errors++;
  }
}

console.log(`\n完成！修复: ${fixed}, 跳过: ${skipped}, 错误: ${errors}`);
