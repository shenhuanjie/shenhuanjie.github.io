#!/usr/bin/env node
/**
 * 修复 front matter 格式损坏的文章
 *
 * 核心问题: source_link 被截断，导致正文内容被混入 front matter
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

// 从文章底部提取正确的 URL
function extractCorrectUrl(content) {
  const match = content.match(/\[原文链接\]\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

// 修复单个文件
function fixFile({ file, filepath, content }) {
  const correctUrl = extractCorrectUrl(content);
  if (!correctUrl) {
    console.log(`  [跳过] 无法找到正确URL: ${file}`);
    return false;
  }

  console.log(`  [修复] ${file}`);
  console.log(`        URL: ${correctUrl}`);

  // 分析文件结构
  // 1. 提取有效的 front matter 字段
  const lines = content.split('\n');
  const coreFields = {};
  let reachedContent = false;

  for (const line of lines) {
    // 检测到这些内容说明已经超出 front matter 范围
    if (line.startsWith('> 来源:') || line.startsWith('## 资讯概要') || line.startsWith('## 详细内容')) {
      reachedContent = true;
      break;
    }

    if (line.startsWith('title:')) coreFields.title = line;
    else if (line.startsWith('date:')) coreFields.date = line;
    else if (line.startsWith('updated:')) coreFields.updated = line;
    else if (line.startsWith('cover:')) coreFields.cover = line;
    else if (line.startsWith('categories:')) coreFields.categories = line;
    else if (line.startsWith('tags:')) coreFields.tags = line;
    else if (line.startsWith('source:')) coreFields.source = line;
    // 注意：不要提取 source_link，因为它是损坏的
  }

  // 2. 提取正文内容
  // 底部引用信息
  const citationMatch = content.match(/(> 来源:[^\n]+\n> 采集时间:[^\n]+)/);
  const citation = citationMatch ? citationMatch[1] : '';

  // 资讯概要
  const summaryMatch = content.match(/## 资讯概要\s*\n+([\s\S]*?)(?=\n## 详细内容)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  // 详细内容
  const detailMatch = content.match(/## 详细内容\s*\n+([\s\S]*?)(?=\n## |\n---)/);
  const detail = detailMatch ? detailMatch[1].trim() : '';

  // 3. 构建正确的 front matter
  const newFrontMatter = [
    '---',
    coreFields.title || 'title: 无标题',
    coreFields.date || `date: ${new Date().toISOString().slice(0,10)} 00:00:00`,
    coreFields.updated || `updated: ${new Date().toISOString().slice(0,10)}`,
    coreFields.cover || 'cover:',
    coreFields.categories || 'categories:\n  - AI资讯',
    coreFields.tags || 'tags:\n  - IT之家',
    coreFields.source || 'source: IT之家',
    `source_link: ${correctUrl}`,
    'author: IT之家',
    'comments: true',
    'toc: true',
    'ai_generated: false',
    '---'
  ].join('\n');

  // 4. 构建新内容
  let newContent = newFrontMatter + '\n\n';
  newContent += citation + '\n\n';
  newContent += '## 资讯概要\n\n' + summary + '\n\n';
  newContent += '## 详细内容\n\n' + detail + '\n';

  // 清理多余的空行
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(filepath, newContent, 'utf8');
  return true;
}

// 查找所有可能有问题的文件
function findProblematicFiles() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const problematic = [];

  for (const file of files) {
    const filepath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');

    // 检查 source_link 是否被截断（以 https: 结尾而不是完整的 URL）
    // 完整 URL 应该有 .htm 或其他后缀
    const sourceLinkMatch = content.match(/source_link:\s*(https?:\/\/[^\n]+)/);
    if (sourceLinkMatch) {
      const url = sourceLinkMatch[1].trim();
      // 如果 URL 不是以 .htm, .html, .shtml 等常见后缀结尾，可能是被截断了
      if (!url.match(/\.(htm|html|shtml|php|aspx?)$/i) && url.includes('ithome.com')) {
        // 进一步检查：如果 source_link 后面紧跟的是 ## 详细内容，说明确实被截断了
        const afterSourceLink = content.substring(content.indexOf('source_link:') + 15);
        if (afterSourceLink.match(/^\s*## 详细内容/)) {
          problematic.push({ file, filepath, content });
          continue;
        }
      }
    }

    // 另外检查 front matter 中是否直接包含 ## 详细内容
    const firstDash = content.indexOf('---');
    const lastDash = content.lastIndexOf('---');
    const frontMatterRange = content.substring(firstDash, lastDash);
    if (frontMatterRange.includes('## 详细内容')) {
      problematic.push({ file, filepath, content });
    }
  }

  return problematic;
}

// 主函数
function main() {
  console.log('===========================================');
  console.log('修复 front matter 格式损坏的文章');
  console.log('===========================================\n');

  const problematicFiles = findProblematicFiles();
  console.log(`找到 ${problematicFiles.length} 个损坏的文件\n`);

  let fixed = 0;
  for (const item of problematicFiles) {
    if (fixFile(item)) {
      fixed++;
    }
  }

  console.log('\n===========================================');
  console.log(`完成！修复: ${fixed}/${problematicFiles.length}`);
  console.log('===========================================');
}

main();