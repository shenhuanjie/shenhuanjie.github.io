/**
 * 修复文章日期格式：将 YYYY-MM-DD 转换为 YYYY-MM-DD HH:00:00
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 匹配只有日期没有时间的 frontmatter date
  // 例如: date: 2026-05-08 -> date: 2026-05-08 00:00:00
  content = content.replace(/^date: (\d{4}-\d{2}-\d{2})$/m, (match, date) => {
    return `date: ${date} 00:00:00`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 检查是否是文章目录（有 index.md）
      const indexPath = path.join(fullPath, 'index.md');
      if (fs.existsSync(indexPath)) {
        results.push(indexPath);
      } else {
        // 递归检查子目录
        results.push(...walkDir(fullPath));
      }
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      results.push(fullPath);
    }
  }

  return results;
}

console.log('===========================================');
console.log('       修复文章日期格式');
console.log('===========================================\n');

const files = walkDir(POSTS_DIR);
console.log(`发现 ${files.length} 篇文章\n`);

let fixed = 0;
for (const file of files) {
  if (processFile(file)) {
    console.log(`✓ 修复: ${path.relative(POSTS_DIR, file)}`);
    fixed++;
  }
}

console.log(`\n完成: 修复了 ${fixed}/${files.length} 篇文章`);
console.log('===========================================\n');
