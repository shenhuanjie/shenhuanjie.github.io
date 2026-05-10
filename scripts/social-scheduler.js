/**
 * 社交媒体排程脚本 (T43.2)
 * 支持多平台定时发布机制
 *
 * 用法:
 *   node scripts/social-scheduler.js --list                    # 列出待发布队列
 *   node scripts/social-scheduler.js --schedule <文章>          # 添加到发布队列
 *   node scripts/social-scheduler.js --generate <文章> <平台>  # 生成适配内容
 *   node scripts/social-scheduler.js --publish <id>            # 发布指定内容
 *
 * 平台支持: wechat (微信公众号), xiaohongshu (小红书), zhihu (知乎)
 *
 * 定时发布通过 GitHub Actions workflow 实现 (见 .github/workflows/social-scheduler.yml)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const CONFIG = {
  queueDir: path.join(__dirname, '..', 'reports', 'social-scheduler'),
  outputDir: path.join(__dirname, '..', 'reports', 'social-content')
};

// 平台配置
const PLATFORMS = {
  wechat: {
    name: '微信公众号',
    schedule: {
      bestTime: '20:00-22:00',
      days: ['Monday', 'Wednesday', 'Friday']
    },
    format: {
      titleLength: { min: 14, max: 20 },
      contentLength: { min: 300, max: 2000 },
      imageRatio: '2.35:1',
      imageSize: { width: 900, height: 383 }
    }
  },
  xiaohongshu: {
    name: '小红书',
    schedule: {
      bestTime: '12:00-13:00, 18:00-21:00',
      days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday']
    },
    format: {
      titleLength: { min: 10, max: 20 },
      contentLength: { min: 300, max: 500 },
      imageRatio: '3:4',
      imageSize: { width: 1080, height: 1440 }
    }
  },
  zhihu: {
    name: '知乎专栏',
    schedule: {
      bestTime: '14:00-16:00, 20:00-22:00',
      days: ['Wednesday', 'Saturday']
    },
    format: {
      titleLength: { min: 20, max: 40 },
      contentLength: { min: 2000, max: 5000 },
      codeSupport: true
    }
  }
};

/**
 * 解析文章文件
 */
function parseArticle(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 解析 frontmatter
  let frontMatter = {};
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (fmMatch) {
    const fmLines = fmMatch[1].split('\n');
    let currentKey = '';
    let currentValues = [];

    for (const line of fmLines) {
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        if (currentKey) {
          frontMatter[currentKey] = currentValues.length === 1 ? currentValues[0] : currentValues;
        }
        currentKey = keyMatch[1];
        currentValues = keyMatch[2] ? [keyMatch[2]] : [];
      } else if (line.match(/^\s+-\s+(.+)/)) {
        currentValues.push(line.match(/^\s+-\s+(.+)/)[1]);
      }
    }
    if (currentKey) {
      frontMatter[currentKey] = currentValues.length === 1 ? currentValues[0] : currentValues;
    }
  }

  // 提取正文内容
  let bodyContent = content;
  if (fmMatch) {
    bodyContent = content.substring(fmMatch[0].length).trim();
  }

  return {
    frontMatter,
    bodyContent,
    filePath
  };
}

/**
 * 生成微信公众号适配内容
 */
function generateWechatContent(article) {
  const { frontMatter, bodyContent } = article;

  // 生成标题 (14-20字)
  let title = frontMatter.title || '';
  if (title.length > 20) {
    title = title.substring(0, 17) + '...';
  }
  title = `【深度】${title}`;

  // 生成导语 (80-120字)
  const intro = `关于${frontMatter.title}，本文将为你详细解读。作为${frontMatter.categories?.[0] || '技术'}领域的重要内容，建议先收藏再看，避免下次找不到。`;

  // 简化正文 (移除代码块，转为说明)
  let content = bodyContent
    .replace(/```[\s\S]*?```/g, '[此处有代码示例，建议查看原文]')
    .replace(/`([^`]+)`/g, '`$1`')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[配图]')
    .substring(0, 2000);

  // 添加引流结尾
  const footer = `

---

**关注「程序猿视界」**

回复关键词获取更多内容：
- 回复 **AI** → 获取 AI 专题精选
- 回复 **效率** → 获取效率工具合集

[原文链接](https://shenhuanjie.github.io)

> 本文首发于程序猿视界，如需转载，请联系作者获取授权。`;

  return {
    title,
    intro,
    content: content + footer,
    cover: frontMatter.cover_image || frontMatter.cover || '',
    meta: {
      originalUrl: 'https://shenhuanjie.github.io',
      platform: 'wechat',
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 生成小红书适配内容
 */
function generateXiaohongshuContent(article) {
  const { frontMatter, bodyContent } = article;

  // 生成封面标题 (20字以内，制造悬念)
  let title = frontMatter.title || '';
  if (title.length > 16) {
    title = title.substring(0, 13) + '...';
  }

  // 生成正文 (精简为 300-500 字)
  let content = bodyContent
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '')
    .replace(/#{1,6}\s([^\n]+)/g, '📌 $1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]')
    .replace(/\n\n+/g, '\n')
    .trim()
    .substring(0, 500);

  // 生成话题标签
  const tags = [];
  tags.push('#程序猿视界');
  tags.push('#科技');
  if (frontMatter.tags) {
    const articleTags = Array.isArray(frontMatter.tags)
      ? frontMatter.tags
      : [frontMatter.tags];
    articleTags.slice(0, 3).forEach(t => tags.push(`#${t}`));
  }
  tags.push('#AI人工智能');
  tags.push('#干货分享');

  // 互动引导
  const interaction = `\n\n---\n你们觉得怎么样？评论区告诉我~\n喜欢的话点个赞再走吧~`;

  return {
    title,
    content: content + '\n\n' + tags.join(' ') + interaction,
    cover: frontMatter.cover_image || frontMatter.cover || '',
    tags,
    meta: {
      platform: 'xiaohongshu',
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 生成知乎专栏适配内容
 */
function generateZhihuContent(article) {
  const { frontMatter, bodyContent } = article;

  // 标题保持原样
  const title = frontMatter.title || '';

  // 知乎支持代码块，直接保留
  let content = bodyContent
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '![配图]($1)')
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    .replace(/\*([^*]+)\*/g, '*$1*');

  // 添加开头引导
  const intro = `> 本文首发于 [程序猿视界](https://shenhuanjie.github.io)，无授权禁止转载。\n\n---\n\n`;

  // 添加互动引导和版权
  const footer = `\n\n---

## 互动引导

看完觉得有收获？别忘了点个赞！

### 延伸阅读
- [程序猿视界](https://shenhuanjie.github.io) - 更多技术干货

### 关注作者
- 知乎：[程序猿视界](https://zhuanlan.zhihu.com)
- 微信公众号：程序猿视界
- 博客：[程序猿视界](https://shenhuanjie.github.io)

---

> 本文首发于 [程序猿视界](https://shenhuanjie.github.io)，无授权禁止转载。`;

  return {
    title,
    content: intro + content + footer,
    tags: frontMatter.tags || ['程序员', '编程', '科技'],
    isOriginal: true,
    meta: {
      platform: 'zhihu',
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 生成指定平台的内容
 */
function generateContent(filePath, platform) {
  const article = parseArticle(filePath);
  const fileName = path.basename(filePath, '.md');

  let result;
  let outputPath;

  switch (platform) {
    case 'wechat':
      result = generateWechatContent(article);
      outputPath = path.join(CONFIG.outputDir, `${fileName}-wechat.md`);
      break;
    case 'xiaohongshu':
      result = generateXiaohongshuContent(article);
      outputPath = path.join(CONFIG.outputDir, `${fileName}-xiaohongshu.md`);
      break;
    case 'zhihu':
      result = generateZhihuContent(article);
      outputPath = path.join(CONFIG.outputDir, `${fileName}-zhihu.md`);
      break;
    default:
      throw new Error(`未知平台: ${platform}`);
  }

  // 保存生成的内容
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // 转换为 Markdown 格式
  let mdContent = `# ${result.title}\n\n`;
  if (result.intro) mdContent += `${result.intro}\n\n`;
  mdContent += `---\n\n`;
  mdContent += result.content;
  if (result.tags) {
    mdContent += `\n\n标签: ${result.tags.join(', ')}`;
  }
  mdContent += `\n\n---\n*由 social-scheduler.js 生成于 ${new Date().toISOString()}*\n`;

  fs.writeFileSync(outputPath, mdContent);

  return {
    platform,
    platformName: PLATFORMS[platform].name,
    outputPath,
    content: result,
    schedule: PLATFORMS[platform].schedule
  };
}

/**
 * 添加到发布队列
 */
function addToQueue(filePath, platform, scheduleTime = null) {
  if (!fs.existsSync(CONFIG.queueDir)) {
    fs.mkdirSync(CONFIG.queueDir, { recursive: true });
  }

  const queueFile = path.join(CONFIG.queueDir, 'queue.json');
  let queue = [];

  if (fs.existsSync(queueFile)) {
    queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
  }

  const item = {
    id: `post-${Date.now()}`,
    filePath,
    platform,
    scheduleTime: scheduleTime || getNextBestTime(platform),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  queue.push(item);
  fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

  return item;
}

/**
 * 获取下一个最佳发布时间
 */
function getNextBestTime(platform) {
  const platformConfig = PLATFORMS[platform];
  if (!platformConfig) return null;

  const now = new Date();
  const days = platformConfig.schedule.days;
  const [startHour] = platformConfig.schedule.bestTime.split('-')[0].split(':');

  // 找到下一个合适的星期几
  const dayMap = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };

  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    const dayName = Object.keys(dayMap).find(k => dayMap[k] === checkDate.getDay());

    if (days.includes(dayName)) {
      checkDate.setHours(parseInt(startHour), 0, 0, 0);
      return checkDate.toISOString();
    }
  }

  return null;
}

/**
 * 列出队列
 */
function listQueue() {
  const queueFile = path.join(CONFIG.queueDir, 'queue.json');

  if (!fs.existsSync(queueFile)) {
    console.log('发布队列为空');
    return [];
  }

  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));

  console.log('\n===========================================');
  console.log('社交媒体发布队列');
  console.log('===========================================');

  if (queue.length === 0) {
    console.log('队列为空');
    return [];
  }

  for (const item of queue) {
    const platformName = PLATFORMS[item.platform]?.name || item.platform;
    console.log(`\n[${item.id}]`);
    console.log(`  平台: ${platformName}`);
    console.log(`  文件: ${path.basename(item.filePath)}`);
    console.log(`  计划时间: ${item.scheduleTime}`);
    console.log(`  状态: ${item.status}`);
  }

  console.log('\n===========================================');
  console.log(`共 ${queue.length} 项`);

  return queue;
}

/**
 * 从队列移除
 */
function removeFromQueue(id) {
  const queueFile = path.join(CONFIG.queueDir, 'queue.json');

  if (!fs.existsSync(queueFile)) {
    console.log('队列为空');
    return false;
  }

  let queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
  const initialLength = queue.length;
  queue = queue.filter(item => item.id !== id);

  if (queue.length < initialLength) {
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    console.log(`已从队列中移除: ${id}`);
    return true;
  }

  console.log(`未找到队列项: ${id}`);
  return false;
}

/**
 * 更新队列项状态
 */
function updateQueueStatus(id, status) {
  const queueFile = path.join(CONFIG.queueDir, 'queue.json');

  if (!fs.existsSync(queueFile)) {
    return false;
  }

  let queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
  const item = queue.find(item => item.id === id);

  if (item) {
    item.status = status;
    item.updatedAt = new Date().toISOString();
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    return true;
  }

  return false;
}

/**
 * 获取待发布的项目
 */
function getPendingItems() {
  const queueFile = path.join(CONFIG.queueDir, 'queue.json');

  if (!fs.existsSync(queueFile)) {
    return [];
  }

  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
  const now = new Date();

  return queue.filter(item => {
    if (item.status !== 'pending') return false;
    if (!item.scheduleTime) return true;
    return new Date(item.scheduleTime) <= now;
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
社交媒体排程脚本 (T43.2)

用法:
  node scripts/social-scheduler.js --list                    # 列出待发布队列
  node scripts/social-scheduler.js --schedule <文章> <平台> # 添加到发布队列
  node scripts/social-scheduler.js --generate <文章> <平台> # 生成适配内容
  node scripts/social-scheduler.js --remove <id>            # 从队列移除
  node scripts/social-scheduler.js --pending               # 获取待发布项

平台: wechat, xiaohongshu, zhihu

示例:
  node scripts/social-scheduler.js --generate source/_posts/article.md wechat
  node scripts/social-scheduler.js --schedule source/_posts/article.md xiaohongshu
  node scripts/social-scheduler.js --list
    `);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case '--list':
      listQueue();
      break;

    case '--generate':
    case '-g': {
      const filePath = args[1];
      const platform = args[2] || 'wechat';

      if (!filePath) {
        console.error('请指定文章文件');
        process.exit(1);
      }

      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        console.error(`文件不存在: ${fullPath}`);
        process.exit(1);
      }

      console.log('===========================================');
      console.log(`生成 ${PLATFORMS[platform]?.name || platform} 适配内容`);
      console.log('===========================================');

      const result = generateContent(fullPath, platform);
      console.log(`\n✅ 内容已生成: ${result.outputPath}`);
      console.log(`\n计划发布时间: ${result.schedule.bestTime}`);
      console.log(`建议发布日: ${result.schedule.days.join(', ')}`);
      break;
    }

    case '--schedule':
    case '-s': {
      const filePath = args[1];
      const platform = args[2] || 'wechat';

      if (!filePath) {
        console.error('请指定文章文件');
        process.exit(1);
      }

      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        console.error(`文件不存在: ${fullPath}`);
        process.exit(1);
      }

      // 先生成内容
      const result = generateContent(fullPath, platform);

      // 添加到队列
      const item = addToQueue(fullPath, platform);

      console.log('===========================================');
      console.log('已添加到发布队列');
      console.log('===========================================');
      console.log(`队列ID: ${item.id}`);
      console.log(`平台: ${result.platformName}`);
      console.log(`计划时间: ${item.scheduleTime}`);
      console.log(`\n内容文件: ${result.outputPath}`);
      break;
    }

    case '--remove':
    case '-r': {
      const id = args[1];
      if (!id) {
        console.error('请指定队列项ID');
        process.exit(1);
      }
      removeFromQueue(id);
      break;
    }

    case '--pending': {
      const pending = getPendingItems();
      console.log(`\n待发布项目: ${pending.length} 项`);
      for (const item of pending) {
        console.log(`- ${item.id}: ${path.basename(item.filePath)} (${item.platform})`);
      }
      break;
    }

    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
  });
}

// 导出
module.exports = {
  generateContent,
  generateWechatContent,
  generateXiaohongshuContent,
  generateZhihuContent,
  addToQueue,
  listQueue,
  removeFromQueue,
  getPendingItems,
  updateQueueStatus,
  PLATFORMS
};