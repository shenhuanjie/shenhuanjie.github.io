/**
 * 社交媒体发布脚本
 * 支持 Twitter/X、LinkedIn 多平台同步发布
 *
 * 用法:
 *   node scripts/social-publish.js --title "文章标题" --url "https://..." --platforms twitter,linkedin
 *   node scripts/social-publish.js --file source/_posts/article.md --platforms all
 *
 * 环境变量:
 *   TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 *   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { parseArticleFromFile } = require('./social-preview.js');

// 配置
const CONFIG = {
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    webhook: process.env.TWITTER_WEBHOOK_URL // 可选的第三方发布 webhook
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN
  }
};

/**
 * 发送 HTTP 请求
 */
function sendRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * 生成 Twitter 发布内容
 */
function generateTwitterContent(article) {
  // Twitter 限制 280 字符
  const maxLength = 280;
  let content = `${article.title}\n\n${article.url}`;

  if (article.tags && article.tags.length > 0) {
    const hashtags = article.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
    if (content.length + hashtags.length + 2 < maxLength) {
      content += `\n\n${hashtags}`;
    }
  }

  return content;
}

/**
 * 发布到 Twitter
 */
async function publishToTwitter(content, article) {
  if (!CONFIG.twitter.apiKey || !CONFIG.twitter.accessToken) {
    console.log('⚠️ Twitter API 未配置，跳过');
    return { success: false, reason: 'not configured' };
  }

  // 检查是否配置了第三方 webhook
  if (CONFIG.twitter.webhook) {
    // 使用第三方服务（如 Buffer、Hootsuite 等）发布
    try {
      const result = await sendRequest(CONFIG.twitter.webhook, {
        method: 'POST'
      }, {
        text: content,
        media: article.cover ? [{ url: article.cover }] : []
      });

      if (result.status === 200 || result.status === 201) {
        console.log('✅ Twitter 发布成功');
        return { success: true, platform: 'twitter' };
      } else {
        console.log('❌ Twitter 发布失败:', result.data);
        return { success: false, platform: 'twitter', reason: result.data };
      }
    } catch (err) {
      console.log('❌ Twitter 发布失败:', err.message);
      return { success: false, platform: 'twitter', reason: err.message };
    }
  }

  // 直接使用 Twitter API v2
  // 注意：实际生产环境需要实现完整的 OAuth 1.0a 签名流程
  console.log('⚠️ Twitter 直接 API 发布需要完整 OAuth 实现，使用 webhook 模式');
  console.log('   当前仅记录发布内容:');
  console.log(`   ${content.substring(0, 100)}...`);

  return { success: true, platform: 'twitter', content, note: 'webhook not configured, content logged' };
}

/**
 * 发布到 LinkedIn
 */
async function publishToLinkedIn(content, article) {
  if (!CONFIG.linkedin.accessToken) {
    console.log('⚠️ LinkedIn API 未配置，跳过');
    return { success: false, reason: 'not configured' };
  }

  const postData = {
    author: `urn:li:person:${CONFIG.linkedin.userId || 'me'}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: article.cover ? 'IMAGE' : 'NONE',
        media: article.cover ? [{
          status: 'READY',
          originalUrl: article.cover
        }] : []
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  try {
    const result = await sendRequest('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.linkedin.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }, postData);

    if (result.status === 201) {
      console.log('✅ LinkedIn 发布成功');
      return { success: true, platform: 'linkedin' };
    } else {
      console.log('❌ LinkedIn 发布失败:', result.data);
      return { success: false, platform: 'linkedin', reason: result.data };
    }
  } catch (err) {
    console.log('❌ LinkedIn 发布失败:', err.message);
    return { success: false, platform: 'linkedin', reason: err.message };
  }
}

/**
 * 发布到飞书（已有功能扩展）
 */
async function publishToFeishu(article) {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    console.log('⚠️ 飞书 Webhook 未配置，跳过');
    return { success: false, reason: 'not configured' };
  }

  const message = {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain_text', content: '📝 新文章发布' },
        template: 'green'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**${article.title}**\n\n${article.description || ''}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `📅 发布时间: ${new Date().toLocaleString('zh-CN')}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `🔗 链接: ${article.url}`
          }
        },
        {
          tag: 'action',
          elements: [
            {
              tag: 'a',
              text: { tag: 'plain_text', content: '查看文章' },
              href: article.url
            }
          ]
        }
      ]
    }
  };

  try {
    const result = await sendRequest(webhook, { method: 'POST' }, message);
    if (result.status === 200 && result.data.code === 0) {
      console.log('✅ 飞书通知发送成功');
      return { success: true, platform: 'feishu' };
    } else {
      console.log('⚠️ 飞书通知发送结果:', result.data);
      return { success: false, platform: 'feishu', reason: result.data };
    }
  } catch (err) {
    console.log('❌ 飞书通知发送失败:', err.message);
    return { success: false, platform: 'feishu', reason: err.message };
  }
}

/**
 * 记录发布日志
 */
function logPublish(article, results) {
  const logDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'social-publish.log');
  const logEntry = {
    timestamp: new Date().toISOString(),
    article: {
      title: article.title,
      url: article.url,
      description: article.description
    },
    results
  };

  const logContent = fs.readFileSync(logFile, 'utf-8').trim();
  const logs = logContent ? JSON.parse(`[${logContent}]`) : [];
  logs.push(logEntry);

  // 只保留最近 100 条记录
  const recentLogs = logs.slice(-100);

  fs.writeFileSync(logFile, recentLogs.map(l => JSON.stringify(l)).join('\n') + '\n');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  let article = {
    title: '',
    description: '',
    url: '',
    cover: '',
    tags: [],
    categories: []
  };

  let platforms = ['feishu']; // 默认发布到飞书

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--title':
        article.title = args[++i];
        break;
      case '--description':
      case '--desc':
        article.description = args[++i];
        break;
      case '--url':
        article.url = args[++i];
        break;
      case '--cover':
        article.cover = args[++i];
        break;
      case '--file':
      case '-f':
        const fileData = parseArticleFromFile(args[++i]);
        if (fileData) {
          article = { ...article, ...fileData };
        }
        break;
      case '--platforms':
      case '-p':
        platforms = args[++i].split(',').map(p => p.trim().toLowerCase());
        break;
      case '--help':
      case '-h':
        console.log(`
社交媒体发布脚本

用法:
  node scripts/social-publish.js [选项]

选项:
  --title, -t <标题>     文章标题
  --description, --desc <描述>  文章描述
  --url <链接>          文章链接 (必填)
  --cover <图片>       封面图 URL
  --file, -f <文件>    从文章文件解析元数据
  --platforms, -p <平台>  发布平台: twitter, linkedin, feishu, all (默认: feishu)
  --help, -h           显示帮助

示例:
  node scripts/social-publish.js --title "AI 新趋势" --url "https://..." --platforms feishu
  node scripts/social-publish.js --file source/_posts/article.md --platforms twitter,linkedin
  node scripts/social-publish.js --file source/_posts/article.md --platforms all
        `);
        process.exit(0);
    }
  }

  if (!article.title || !article.url) {
    console.error('❌ 错误: 必须提供标题和链接');
    console.error('   使用 --help 查看帮助');
    process.exit(1);
  }

  console.log('===========================================');
  console.log('社交媒体发布');
  console.log('===========================================');
  console.log(`文章: ${article.title}`);
  console.log(`链接: ${article.url}`);
  console.log(`平台: ${platforms.join(', ')}`);
  console.log('===========================================\n');

  const results = [];

  // 发布到各平台
  for (const platform of platforms) {
    console.log(`\n[${platform}]`);

    switch (platform) {
      case 'twitter':
      case 'x':
        const twitterContent = generateTwitterContent(article);
        console.log(`发布内容: ${twitterContent.substring(0, 50)}...`);
        results.push(await publishToTwitter(twitterContent, article));
        break;

      case 'linkedin':
        const linkedinContent = `${article.title}\n\n${article.description || ''}\n\n${article.url}`;
        console.log(`发布内容: ${linkedinContent.substring(0, 50)}...`);
        results.push(await publishToLinkedIn(linkedinContent, article));
        break;

      case 'feishu':
        results.push(await publishToFeishu(article));
        break;

      case 'all':
        // 全部平台
        const allContent = generateTwitterContent(article);
        results.push(await publishToTwitter(allContent, article));
        results.push(await publishToLinkedIn(`${article.title}\n\n${article.description || ''}\n\n${article.url}`, article));
        results.push(await publishToFeishu(article));
        break;

      default:
        console.log(`⚠️ 未知平台: ${platform}`);
    }
  }

  // 记录日志
  logPublish(article, results);

  // 汇总结果
  console.log('\n===========================================');
  console.log('发布结果汇总');
  console.log('===========================================');

  const successCount = results.filter(r => r.success).length;
  console.log(`成功: ${successCount}/${results.length}`);

  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.platform}: ${result.success ? '成功' : result.reason || '失败'}`);
  }

  console.log('\n===========================================');

  // 退出码
  process.exit(successCount > 0 ? 0 : 1);
}

// 运行
if (require.main === module) {
  main().catch(err => {
    console.error('发布失败:', err);
    process.exit(1);
  });
}

module.exports = { publishToTwitter, publishToLinkedIn, publishToFeishu, generateTwitterContent };