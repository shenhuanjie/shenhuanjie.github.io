/**
 * 定时发布脚本
 * 将草稿目录中的文章按计划发布到 _posts 目录
 *
 * 用法:
 *   node scripts/scheduled-publish.js              # 检查并发布待发布的草稿
 *   node scripts/scheduled-publish.js --list       # 列出所有待发布的草稿
 *   node scripts/scheduled-publish.js --publish FILE # 发布指定文件
 *   node scripts/scheduled-publish.js --now FILE    # 立即发布（忽略 schedule）
 *   node scripts/scheduled-publish.js --dry-run     # 预览模式
 *
 * 环境变量:
 *   PUBLISH_DRAFTS_DIR     草稿目录（默认 source/_drafts）
 *   PUBLISH_POSTS_DIR      文章目录（默认 source/_posts）
 *   PUBLISH_MAX_PER_DAY    每天最多发布篇数（默认 5）
 *   PUBLISH_TIME_ZONE      时区（默认 Asia/Shanghai）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const yaml = require('js-yaml');

// ============== 配置 ==============

const CONFIG = {
  draftsDir: process.env.PUBLISH_DRAFTS_DIR || path.join(__dirname, '..', 'source', '_drafts'),
  postsDir: process.env.PUBLISH_POSTS_DIR || path.join(__dirname, '..', 'source', '_posts'),
  maxPerDay: parseInt(process.env.PUBLISH_MAX_PER_DAY || '5', 10),
  timeZone: process.env.PUBLISH_TIME_ZONE || 'Asia/Shanghai',
  // 发布时间规则
  scheduleRules: {
    // 每周哪天发布（0=周日，1-6=周一到周六）
    days: [1, 3, 5], // 周一、周三、周五发布
    // 每天发布时间（小时）
    hours: [9, 14, 20], // 9:00、14:00、20:00
    // 是否启用严格模式（严格按照时间表）
    strict: false
  },
  // 分类别名（用于分类过滤）
  categoryAliases: {
    'AI编程': 'AI应用',
    '大模型': 'AI大模型',
    'AI日更': 'AI日更',
    'AI周报': 'AI周报'
  }
};

// ============== 工具函数 ==============

/**
 * 获取所有草稿文件
 */
function getDrafts(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
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
 * 更新 front-matter
 */
function updateFrontMatter(content, updates) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return content;
  }

  try {
    const frontMatter = yaml.load(match[1]);
    Object.assign(frontMatter, updates);

    const newFrontMatter = yaml.dump(frontMatter, { indent: 2, lineWidth: -1 });
    const body = content.slice(match[0].length);

    return `---\n${newFrontMatter}---\n${body}`;
  } catch (e) {
    return content;
  }
}

/**
 * 生成文件名 slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * 解析日期（支持相对日期）
 */
function parseDate(dateStr, timeZone) {
  const now = moment().tz(timeZone);

  // 尝试直接解析
  const directDate = moment(dateStr, ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss']);
  if (directDate.isValid()) {
    return directDate.tz(timeZone);
  }

  // 解析相对日期
  if (dateStr.startsWith('+')) {
    const match = dateStr.match(/\+(\d+)([dhms])/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      return now.add(value, unit === 'd' ? 'days' : unit === 'h' ? 'hours' : unit === 'm' ? 'minutes' : 'seconds');
    }
  }

  return now;
}

/**
 * 检查是否应该发布
 */
function shouldPublish(draft, config) {
  const now = moment().tz(config.timeZone);
  const schedule = config.scheduleRules;

  // 检查 schedule 字段
  if (draft.frontMatter.schedule) {
    const scheduleDate = parseDate(draft.frontMatter.schedule, config.timeZone);

    if (now.isBefore(scheduleDate)) {
      return { canPublish: false, reason: `计划发布时间: ${scheduleDate.format('YYYY-MM-DD HH:mm')}` };
    }
  }

  // 如果有 publish_date，使用该日期
  if (draft.frontMatter.publish_date) {
    const publishDate = parseDate(draft.frontMatter.publish_date, config.timeZone);

    if (now.isBefore(publishDate)) {
      return { canPublish: false, reason: `发布窗口: ${publishDate.format('YYYY-MM-DD HH:mm')}` };
    }
  }

  // 检查每日限制
  const todayStart = now.clone().startOf('day');
  const todayEnd = now.clone().endOf('day');

  if (draft.alreadyPublishedToday) {
    return { canPublish: false, reason: `今日已发布 ${config.maxPerDay} 篇` };
  }

  // 检查是否在允许的时间段内
  if (schedule.strict) {
    const currentHour = now.hour();
    const currentDay = now.day();

    const dayAllowed = schedule.days.includes(currentDay);
    const hourAllowed = schedule.hours.some(h => Math.abs(currentHour - h) <= 1);

    if (!dayAllowed || !hourAllowed) {
      return {
        canPublish: false,
        reason: `发布时间: ${dayAllowed ? `小时内 (${schedule.hours.join(', ')})` : `周${['日', '一', '二', '三', '四', '五', '六'][currentDay]}`}`
      };
    }
  }

  return { canPublish: true };
}

/**
 * 获取今天的发布数量
 */
function getTodayPublishedCount(postsDir, timeZone) {
  const todayStart = moment().tz(timeZone).startOf('day').format('YYYY-MM-DD');
  const todayEnd = moment().tz(timeZone).endOf('day').format('YYYY-MM-DD');

  if (!fs.existsSync(postsDir)) {
    return 0;
  }

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  let count = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { frontMatter } = parseFrontMatter(content);

    if (frontMatter.date) {
      const postDate = moment(frontMatter.date).tz(timeZone).format('YYYY-MM-DD');
      if (postDate >= todayStart && postDate <= todayEnd) {
        count++;
      }
    }
  }

  return count;
}

// ============== 发布函数 ==============

/**
 * 发布单个草稿
 */
function publishDraft(draftPath, config, options = {}) {
  const { dryRun = false, force = false } = options;

  if (!fs.existsSync(draftPath)) {
    return { success: false, message: '文件不存在' };
  }

  const content = fs.readFileSync(draftPath, 'utf8');
  const { frontMatter, error } = parseFrontMatter(content);

  if (error) {
    return { success: false, message: error };
  }

  if (!frontMatter.title) {
    return { success: false, message: '缺少标题' };
  }

  // 生成目标文件名
  const slug = slugify(frontMatter.title);
  const targetFilename = `${slug}.md`;
  const targetPath = path.join(config.postsDir, targetFilename);

  // 检查目标文件是否已存在
  if (!force && fs.existsSync(targetPath)) {
    return { success: false, message: `目标文件已存在: ${targetFilename}` };
  }

  // 准备更新的 front-matter
  const now = moment().tz(config.timeZone);
  const updates = {
    date: frontMatter.date || now.format('YYYY-MM-DD'),
    updated: now.format('YYYY-MM-DD')
  };

  // 生成新的文件名（如果原标题被修改）
  const newSlug = slugify(frontMatter.title);
  const newFilename = `${newSlug}.md`;
  const newTargetPath = path.join(config.postsDir, newFilename);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `将发布: ${frontMatter.title}`,
      from: draftPath,
      to: newTargetPath
    };
  }

  // 更新 front-matter
  const newContent = updateFrontMatter(content, updates);

  // 确保目录存在
  if (!fs.existsSync(config.postsDir)) {
    fs.mkdirSync(config.postsDir, { recursive: true });
  }

  // 写入目标文件
  fs.writeFileSync(newTargetPath, newContent, 'utf8');

  // 删除原草稿
  fs.unlinkSync(draftPath);

  return {
    success: true,
    message: `已发布: ${frontMatter.title}`,
    from: draftPath,
    to: newTargetPath
  };
}

/**
 * 批量检查并发布草稿
 */
function processDrafts(config, options = {}) {
  const { dryRun = false, force = false } = options;

  const drafts = getDrafts(config.draftsDir);
  const results = {
    published: [],
    skipped: [],
    failed: []
  };

  // 获取今日已发布数量
  let todayCount = getTodayPublishedCount(config.postsDir, config.timeZone);

  console.log(`\n找到 ${drafts.length} 篇草稿`);
  console.log(`今日已发布: ${todayCount} 篇`);
  console.log(`每日限制: ${config.maxPerDay} 篇`);
  console.log('');

  for (const draftPath of drafts) {
    const content = fs.readFileSync(draftPath, 'utf8');
    const { frontMatter } = parseFrontMatter(content);

    const draft = {
      path: draftPath,
      frontMatter,
      alreadyPublishedToday: todayCount >= config.maxPerDay
    };

    // 检查是否应该发布
    const { canPublish, reason } = shouldPublish(draft, config);

    if (!canPublish) {
      console.log(`[跳过] ${frontMatter.title || path.basename(draftPath)}`);
      console.log(`       原因: ${reason}`);
      results.skipped.push({ path: draftPath, reason });
      continue;
    }

    // 发布
    const result = publishDraft(draftPath, config, { dryRun, force });

    if (result.success) {
      if (dryRun) {
        console.log(`[预览] ${frontMatter.title}`);
        console.log(`       从: ${result.from}`);
        console.log(`       到: ${result.to}`);
      } else {
        console.log(`[发布] ${frontMatter.title}`);
        todayCount++;
      }
      results.published.push(result);
    } else {
      console.log(`[失败] ${frontMatter.title}: ${result.message}`);
      results.failed.push({ path: draftPath, reason: result.message });
    }
  }

  return results;
}

// ============== 命令行界面 ==============

function showHelp() {
  console.log(`
定时发布脚本

用法:
  node scripts/scheduled-publish.js [选项]

选项:
  --list           列出所有待发布的草稿
  --publish FILE   发布指定文件（忽略 schedule）
  --now FILE       立即发布指定文件
  --dry-run        预览模式（不实际发布）
  --force          强制覆盖已存在的文件
  --config         显示当前配置
  --help           显示帮助

环境变量:
  PUBLISH_DRAFTS_DIR    草稿目录
  PUBLISH_POSTS_DIR     文章目录
  PUBLISH_MAX_PER_DAY   每日发布上限（默认 5）
  PUBLISH_TIME_ZONE     时区（默认 Asia/Shanghai）

示例:
  node scripts/scheduled-publish.js --dry-run
  node scripts/scheduled-publish.js --list
  node scripts/scheduled-publish.js --now source/_drafts/my-draft.md
`);
}

function showConfig() {
  console.log('\n当前配置:');
  console.log(`  草稿目录: ${CONFIG.draftsDir}`);
  console.log(`  文章目录: ${CONFIG.postsDir}`);
  console.log(`  每日上限: ${CONFIG.maxPerDay} 篇`);
  console.log(`  时区: ${CONFIG.timeZone}`);
  console.log(`  发布日: ${CONFIG.scheduleRules.days.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join(', ')}`);
  console.log(`  发布时: ${CONFIG.scheduleRules.hours.join(':00, ')}:00`);
}

function showDrafts() {
  const drafts = getDrafts(CONFIG.draftsDir);

  console.log(`\n待发布草稿 (${drafts.length} 篇):\n`);

  if (drafts.length === 0) {
    console.log('  没有待发布的草稿');
    return;
  }

  for (const draftPath of drafts) {
    const content = fs.readFileSync(draftPath, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    const title = frontMatter.title || path.basename(draftPath, '.md');
    const date = frontMatter.date || '无日期';
    const schedule = frontMatter.schedule || frontMatter.publish_date || '立即';

    console.log(`  - ${title}`);
    console.log(`    日期: ${date} | 计划: ${schedule}`);
    console.log(`    文件: ${path.relative(CONFIG.draftsDir, draftPath)}`);
    console.log('');
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    showHelp();
    return;
  }

  if (args.includes('--config')) {
    showConfig();
    return;
  }

  console.log('===========================================');
  console.log('定时发布脚本');
  console.log('===========================================');

  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (dryRun) {
    console.log('模式: 预览（不实际发布）');
  }

  // --list 选项
  if (args.includes('--list')) {
    showDrafts();
    return;
  }

  // --publish 或 --now 选项
  const publishIndex = args.indexOf('--publish');
  const nowIndex = args.indexOf('--now');

  if (publishIndex !== -1 || nowIndex !== -1) {
    const index = publishIndex !== -1 ? publishIndex : nowIndex;
    const file = args[index + 1];

    if (!file) {
      console.error('错误: 请指定文件路径');
      return;
    }

    const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);

    console.log(`\n发布文件: ${filePath}\n`);

    const result = publishDraft(filePath, CONFIG, { dryRun, force: force || nowIndex !== -1 });

    if (result.success) {
      console.log(`\n成功: ${result.message}`);
      if (dryRun) {
        console.log(`从: ${result.from}`);
        console.log(`到: ${result.to}`);
      }
    } else {
      console.error(`\n失败: ${result.message}`);
      process.exit(1);
    }
    return;
  }

  // 默认：检查并发布待发布的草稿
  const results = processDrafts(CONFIG, { dryRun, force });

  console.log('\n===========================================');
  console.log('处理摘要');
  console.log('===========================================');
  console.log(`已发布: ${results.published.length} 篇`);
  console.log(`已跳过: ${results.skipped.length} 篇`);
  console.log(`失败: ${results.failed.length} 篇`);

  if (dryRun) {
    console.log('\n提示: 移除 --dry-run 参数实际发布');
  } else if (results.published.length > 0) {
    console.log('\n提示: 运行 "npm run server" 预览发布效果');
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = {
  publishDraft,
  processDrafts,
  getDrafts,
  shouldPublish,
  CONFIG
};