/**
 * 发布通知脚本
 * 支持飞书、钉钉 Webhook 通知
 *
 * 用法:
 *   node scripts/notify.js --platform feishu --type publish --article "文章标题"
 *   node scripts/notify.js --platform dingtalk --type deploy
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  feishu: {
    webhook: process.env.FEISHU_WEBHOOK_URL,
    secret: process.env.FEISHU_SECRET // 可选，加签密钥
  },
  dingtalk: {
    webhook: process.env.DINGTALK_WEBHOOK_URL
  }
};

/**
 * 发送 HTTP 请求
 */
function sendRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 发送飞书通知
 */
async function sendFeishuNotification(type, data) {
  if (!CONFIG.feishu.webhook) {
    console.log('⚠️ 飞书 Webhook 未配置，跳过通知');
    return { success: false, reason: 'webhook not configured' };
  }

  let message;

  switch (type) {
    case 'publish':
      message = {
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
                content: `**${data.title}**\n\n${data.description || '暂无描述'}`
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
                content: `🔗 链接: ${data.url}`
              }
            },
            {
              tag: 'action',
              elements: [
                {
                  tag: 'a',
                  text: { tag: 'plain_text', content: '查看文章' },
                  href: data.url
                }
              ]
            }
          ]
        }
      };
      break;

    case 'deploy':
      message = {
        msg_type: 'text',
        content: {
          text: `🚀 网站已部署完成\n📅 时间: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    case 'scraper':
      message = {
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: '📥 采集任务完成' },
            template: 'blue'
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `✅ 采集文章数: ${data.count || 0}\n⏱️ 执行时间: ${data.duration || 'N/A'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📅 完成时间: ${new Date().toLocaleString('zh-CN')}`
              }
            }
          ]
        }
      };
      break;

    case 'comment':
      // 新评论通知
      message = {
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: '💬 新评论待审核' },
            template: 'purple'
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📝 **评论内容**\n${data.comment || '暂无内容'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `👤 **评论者**: ${data.author || '匿名用户'}\n📧 **邮箱**: ${data.email || '未填写'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📄 **文章**: ${data.articleTitle || '未知文章'}\n🔗 **链接**: ${data.articleUrl || '无'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `⏰ **时间**: ${new Date().toLocaleString('zh-CN')}`
              }
            },
            {
              tag: 'action',
              elements: [
                {
                  tag: 'a',
                  text: { tag: 'plain_text', content: '查看评论' },
                  href: data.articleUrl || '#'
                }
              ]
            }
          ]
        }
      };
      break;

    case 'comment_reply':
      // 评论回复通知
      message = {
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: '💬 您的评论收到回复' },
            template: 'blue'
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `💬 **回复内容**\n${data.replyContent || '暂无内容'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `👤 **回复者**: ${data.replyAuthor || '匿名用户'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📄 **文章**: ${data.articleTitle || '未知文章'}\n🔗 **链接**: ${data.commentUrl || '无'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `⏰ **时间**: ${new Date().toLocaleString('zh-CN')}`
              }
            },
            {
              tag: 'action',
              elements: [
                {
                  tag: 'a',
                  text: { tag: 'plain_text', content: '查看回复' },
                  href: data.commentUrl || '#'
                }
              ]
            }
          ]
        }
      };
      break;

    case 'comment_flagged':
      // 评论被标记通知（包含敏感词）
      message = {
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: '⚠️ 评论包含敏感词' },
            template: 'red'
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📝 **评论内容**\n${data.comment || '暂无内容'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `👤 **评论者**: ${data.author || '匿名用户'}\n📧 **邮箱**: ${data.email || '未填写'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `⚠️ **敏感词**: ${data.flaggedWords ? data.flaggedWords.join(', ') : '未知'}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `📄 **文章**: ${data.articleTitle || '未知文章'}`
              }
            },
            {
              tag: 'action',
              elements: [
                {
                  tag: 'a',
                  text: { tag: 'plain_text', content: '审核评论' },
                  href: data.articleUrl || '#'
                }
              ]
            }
          ]
        }
      };
      break;

    default:
      message = {
        msg_type: 'text',
        content: { text: `通知: ${type}` }
      };
  }

  try {
    const result = await sendRequest(CONFIG.feishu.webhook, message);
    if (result.code === 0 || result.StatusCode === 0) {
      console.log('✅ 飞书通知发送成功');
      return { success: true };
    } else {
      console.log('❌ 飞书通知发送失败:', result.msg || result.errmsg);
      return { success: false, reason: result.msg || result.errmsg };
    }
  } catch (err) {
    console.log('❌ 飞书通知发送失败:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * 发送钉钉通知
 */
async function sendDingtalkNotification(type, data) {
  if (!CONFIG.dingtalk.webhook) {
    console.log('⚠️ 钉钉 Webhook 未配置，跳过通知');
    return { success: false, reason: 'webhook not configured' };
  }

  let message;

  switch (type) {
    case 'publish':
      message = {
        msgtype: 'markdown',
        markdown: {
          title: '📝 新文章发布',
          text: `## 📝 新文章发布\n\n**${data.title}**\n\n${data.description || '暂无描述'}\n\n📅 时间: ${new Date().toLocaleString('zh-CN')}\n\n🔗 链接: ${data.url}`
        }
      };
      break;

    case 'deploy':
      message = {
        msgtype: 'text',
        text: {
          content: `🚀 网站已部署完成\n📅 时间: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    case 'scraper':
      message = {
        msgtype: 'markdown',
        markdown: {
          title: '📥 采集任务完成',
          text: `## 📥 采集任务完成\n\n✅ 采集文章数: ${data.count || 0}\n⏱️ 执行时间: ${data.duration || 'N/A'}\n📅 完成时间: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    case 'comment':
      // 新评论通知
      message = {
        msgtype: 'markdown',
        markdown: {
          title: '💬 新评论待审核',
          text: `## 💬 新评论待审核\n\n**评论内容**\n${data.comment || '暂无内容'}\n\n**评论者**: ${data.author || '匿名用户'}\n**邮箱**: ${data.email || '未填写'}\n\n**文章**: ${data.articleTitle || '未知文章'}\n**链接**: ${data.articleUrl || '无'}\n\n⏰ **时间**: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    case 'comment_reply':
      // 评论回复通知
      message = {
        msgtype: 'markdown',
        markdown: {
          title: '💬 您的评论收到回复',
          text: `## 💬 您的评论收到回复\n\n**回复内容**\n${data.replyContent || '暂无内容'}\n\n**回复者**: ${data.replyAuthor || '匿名用户'}\n\n**文章**: ${data.articleTitle || '未知文章'}\n**链接**: ${data.commentUrl || '无'}\n\n⏰ **时间**: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    case 'comment_flagged':
      // 评论被标记通知
      message = {
        msgtype: 'markdown',
        markdown: {
          title: '⚠️ 评论包含敏感词',
          text: `## ⚠️ 评论包含敏感词\n\n**评论内容**\n${data.comment || '暂无内容'}\n\n**评论者**: ${data.author || '匿名用户'}\n**邮箱**: ${data.email || '未填写'}\n\n**敏感词**: ${data.flaggedWords ? data.flaggedWords.join(', ') : '未知'}\n\n**文章**: ${data.articleTitle || '未知文章'}\n\n⏰ **时间**: ${new Date().toLocaleString('zh-CN')}`
        }
      };
      break;

    default:
      message = {
        msgtype: 'text',
        text: { content: `通知: ${type}` }
      };
  }

  try {
    const result = await sendRequest(CONFIG.dingtalk.webhook, message);
    if (result.errcode === 0 || result.errmsg === 'ok') {
      console.log('✅ 钉钉通知发送成功');
      return { success: true };
    } else {
      console.log('❌ 钉钉通知发送失败:', result.errmsg);
      return { success: false, reason: result.errmsg };
    }
  } catch (err) {
    console.log('❌ 钉钉通知发送失败:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * 发送新评论通知
 * @param {string} platform - 平台: feishu, dingtalk, all
 * @param {Object} commentData - 评论数据
 */
async function sendCommentNotification(platform, commentData) {
  if (platform === 'feishu' || platform === 'all') {
    await sendFeishuNotification('comment', commentData);
  }
  if (platform === 'dingtalk' || platform === 'all') {
    await sendDingtalkNotification('comment', commentData);
  }
}

/**
 * 发送评论回复通知
 * @param {string} platform - 平台: feishu, dingtalk, all
 * @param {Object} replyData - 回复数据
 */
async function sendCommentReplyNotification(platform, replyData) {
  if (platform === 'feishu' || platform === 'all') {
    await sendFeishuNotification('comment_reply', replyData);
  }
  if (platform === 'dingtalk' || platform === 'all') {
    await sendDingtalkNotification('comment_reply', replyData);
  }
}

/**
 * 发送评论敏感词标记通知
 * @param {string} platform - 平台: feishu, dingtalk, all
 * @param {Object} flaggedData - 被标记的评论数据
 */
async function sendCommentFlaggedNotification(platform, flaggedData) {
  if (platform === 'feishu' || platform === 'all') {
    await sendFeishuNotification('comment_flagged', flaggedData);
  }
  if (platform === 'dingtalk' || platform === 'all') {
    await sendDingtalkNotification('comment_flagged', flaggedData);
  }
}

/**
 * 发送质量检查失败通知
 */
async function sendQualityAlert(platform, errors) {
  const data = {
    type: 'quality_alert',
    errors: errors,
    timestamp: new Date().toISOString()
  };

  if (platform === 'feishu' || platform === 'all') {
    await sendFeishuNotification('quality_alert', data);
  }
  if (platform === 'dingtalk' || platform === 'all') {
    await sendDingtalkNotification('quality_alert', data);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  // 解析参数
  const params = {
    platform: 'feishu',
    type: 'deploy',
    title: '',
    description: '',
    url: '',
    count: 0,
    duration: ''
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--platform':
      case '-p':
        params.platform = args[++i];
        break;
      case '--type':
      case '-t':
        params.type = args[++i];
        break;
      case '--title':
        params.title = args[++i];
        break;
      case '--description':
      case '--desc':
        params.description = args[++i];
        break;
      case '--url':
        params.url = args[++i];
        break;
      case '--count':
        params.count = parseInt(args[++i], 10);
        break;
      case '--duration':
        params.duration = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
发布通知脚本

用法:
  node scripts/notify.js [选项]

选项:
  --platform, -p <平台>  通知平台: feishu, dingtalk, all (默认: feishu)
  --type, -t <类型>      通知类型: publish, deploy, scraper, quality_alert
  --title <标题>         文章标题 (publish 类型用)
  --description, --desc <描述>  文章描述 (publish 类型用)
  --url <链接>           文章链接 (publish 类型用)
  --count <数量>         采集数量 (scraper 类型用)
  --duration <时间>      执行时长 (scraper 类型用)
  --help, -h             显示帮助

示例:
  node scripts/notify.js --platform feishu --type publish --title "新文章" --url "https://example.com"
  node scripts/notify.js --platform all --type deploy
  node scripts/notify.js --type scraper --count 5 --duration "2m30s"
        `);
        process.exit(0);
    }
  }

  console.log('===========================================');
  console.log('发布通知');
  console.log('===========================================');
  console.log(`平台: ${params.platform}`);
  console.log(`类型: ${params.type}`);
  console.log('===========================================');

  let results = [];

  if (params.platform === 'feishu' || params.platform === 'all') {
    results.push(await sendFeishuNotification(params.type, params));
  }
  if (params.platform === 'dingtalk' || params.platform === 'all') {
    results.push(await sendDingtalkNotification(params.type, params));
  }

  const allSuccess = results.every(r => r.success);
  process.exit(allSuccess ? 0 : 1);
}

// 运行
if (require.main === module) {
  main().catch(err => {
    console.error('通知脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = {
  sendFeishuNotification,
  sendDingtalkNotification,
  sendQualityAlert,
  sendCommentNotification,
  sendCommentReplyNotification,
  sendCommentFlaggedNotification
};