/**
 * GA4 数据汇总脚本
 * 自动生成周报/月报数据
 *
 * 用法:
 *   node scripts/ga4-report.js                    # 日报
 *   node scripts/ga4-report.js --period weekly    # 周报
 *   node scripts/ga4-report.js --period monthly  # 月报
 *   node scripts/ga4-report.js --output json     # 输出 JSON
 *
 * 环境变量:
 *   GA4_PROPERTY_ID       GA4 属性 ID
 *   GA4_SERVICE_ACCOUNT   Google 服务账户 JSON 路径
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const CONFIG = {
  propertyId: process.env.GA4_PROPERTY_ID,
  serviceAccount: process.env.GA4_SERVICE_ACCOUNT,
  outputDir: path.join(__dirname, '..', 'reports', 'analytics')
};

/**
 * 获取日期范围
 */
function getDateRange(period) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'daily':
      start.setDate(end.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(end.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(end.getMonth() - 1);
      break;
    default:
      start.setDate(end.getDate() - 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

/**
 * 生成模拟数据（实际使用时替换为 GA4 API 调用）
 * 注意：这是占位数据，实际生产环境需要配置 Google Analytics Data API
 */
function generateMockData(dateRange) {
  // 模拟数据生成 - 实际项目中应调用 GA4 API
  const days = Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24));

  return {
    summary: {
      period: dateRange,
      generatedAt: new Date().toISOString(),
      pageviews: Math.floor(1000 + Math.random() * 500) * days,
      uniqueVisitors: Math.floor(300 + Math.random() * 200) * days,
      avgSessionDuration: Math.floor(120 + Math.random() * 60),
      bounceRate: (40 + Math.random() * 20).toFixed(1),
      newUsers: Math.floor(200 + Math.random() * 100) * days
    },
    topPages: [
      { path: '/', title: '首页', pageviews: Math.floor(500 + Math.random() * 200), uniquePageviews: Math.floor(300 + Math.random() * 100) },
      { path: '/ai-news/', title: 'AI 资讯', pageviews: Math.floor(200 + Math.random() * 100), uniquePageviews: Math.floor(150 + Math.random() * 50) },
      { path: '/tech-insights/', title: '技术解读', pageviews: Math.floor(150 + Math.random() * 80), uniquePageviews: Math.floor(100 + Math.random() * 40) }
    ],
    trafficSources: [
      { source: 'google', medium: 'organic', sessions: Math.floor(400 + Math.random() * 200) },
      { source: 'direct', medium: '(none)', sessions: Math.floor(200 + Math.random() * 100) },
      { source: 'twitter.com', medium: 'social', sessions: Math.floor(100 + Math.random() * 50) }
    ],
    userMetrics: {
      daily: Array.from({ length: days }, (_, i) => {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          users: Math.floor(80 + Math.random() * 40),
          pageviews: Math.floor(200 + Math.random() * 100),
          newUsers: Math.floor(30 + Math.random() * 20)
        };
      })
    },
    deviceCategories: [
      { category: 'desktop', sessions: Math.floor(600 + Math.random() * 200) },
      { category: 'mobile', sessions: Math.floor(200 + Math.random() * 100) },
      { category: 'tablet', sessions: Math.floor(50 + Math.random() * 30) }
    ],
    geography: [
      { country: '中国', sessions: Math.floor(500 + Math.random() * 200) },
      { country: '美国', sessions: Math.floor(150 + Math.random() * 80) },
      { country: '其他', sessions: Math.floor(100 + Math.random() * 50) }
    ]
  };
}

/**
 * 生成 Markdown 格式报告
 */
function generateMarkdownReport(data, period) {
  const periodLabel = { daily: '日报', weekly: '周报', monthly: '月报' }[period] || '报告';

  let md = `# GA4 数据${periodLabel}\n\n`;
  md += `**报告时间**: ${data.summary.period.start} 至 ${data.summary.period.end}\n`;
  md += `**生成时间**: ${new Date(data.summary.generatedAt).toLocaleString('zh-CN')}\n\n`;

  md += '---\n\n';

  // 核心指标
  md += '## 核心指标\n\n';
  md += '| 指标 | 数值 |\n';
  md += '|------|------|\n';
  md += `| 页面浏览量 | ${data.summary.pageviews.toLocaleString()} |\n`;
  md += `| 独立访客 | ${data.summary.uniqueVisitors.toLocaleString()} |\n`;
  md += `| 新用户 | ${data.summary.newUsers.toLocaleString()} |\n`;
  md += `| 平均会话时长 | ${Math.floor(data.summary.avgSessionDuration / 60)}分${data.summary.avgSessionDuration % 60}秒 |\n`;
  md += `| 跳出率 | ${data.summary.bounceRate}% |\n`;
  md += '\n';

  // 热门页面
  md += '## 热门页面\n\n';
  md += '| 页面 | 标题 | 浏览量 | 独立浏览量 |\n';
  md += '|------|------|--------|----------|\n';
  for (const page of data.topPages) {
    md += `| ${page.path} | ${page.title} | ${page.pageviews.toLocaleString()} | ${page.uniquePageviews.toLocaleString()} |\n`;
  }
  md += '\n';

  // 流量来源
  md += '## 流量来源\n\n';
  md += '| 来源 | 媒介 | 会话数 |\n';
  md += '|------|------|--------|\n';
  for (const source of data.trafficSources) {
    md += `| ${source.source} | ${source.medium} | ${source.sessions.toLocaleString()} |\n`;
  }
  md += '\n';

  // 用户设备
  md += '## 用户设备\n\n';
  md += '| 设备类型 | 会话数 |\n';
  md += '|----------|--------|\n';
  for (const device of data.deviceCategories) {
    md += `| ${device.category} | ${device.sessions.toLocaleString()} |\n`;
  }
  md += '\n';

  // 用户地区
  md += '## 用户地区\n\n';
  md += '| 国家/地区 | 会话数 |\n';
  md += '|-----------|--------|\n';
  for (const geo of data.geography) {
    md += `| ${geo.country} | ${geo.sessions.toLocaleString()} |\n`;
  }
  md += '\n';

  // 每日趋势
  md += '## 每日趋势\n\n';
  md += '| 日期 | 用户 | 浏览量 | 新用户 |\n';
  md += '|------|------|--------|--------|\n';
  for (const day of data.userMetrics.daily) {
    md += `| ${day.date} | ${day.users} | ${day.pageviews} | ${day.newUsers} |\n`;
  }
  md += '\n';

  // 趋势图表（文本版）
  md += '## 趋势概览\n\n';
  const maxUsers = Math.max(...data.userMetrics.daily.map(d => d.users));
  for (const day of data.userMetrics.daily) {
    const barLength = Math.round((day.users / maxUsers) * 20);
    const bar = '█'.repeat(barLength);
    md += `${day.date} | ${bar} ${day.users}\n`;
  }
  md += '\n';

  md += '---\n\n';
  md += `*此报告由自动化脚本生成于 ${new Date().toISOString()}*\n`;

  return md;
}

/**
 * 生成飞书消息格式
 */
function generateFeishuMessage(data, period) {
  const periodLabel = { daily: '日报', weekly: '周报', monthly: '月报' }[period] || '报告';

  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain_text', content: `📊 GA4 数据${periodLabel}` },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**报告时间**: ${data.summary.period.start} 至 ${data.summary.period.end}`
          }
        },
        { tag: 'hr' },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '## 核心指标'
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `• 页面浏览量: **${data.summary.pageviews.toLocaleString()}**\n• 独立访客: **${data.summary.uniqueVisitors.toLocaleString()}**\n• 新用户: **${data.summary.newUsers.toLocaleString()}**\n• 平均时长: **${Math.floor(data.summary.avgSessionDuration / 60)}分${data.summary.avgSessionDuration % 60}秒**\n• 跳出率: **${data.summary.bounceRate}%**`
          }
        },
        { tag: 'hr' },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '## 热门页面'
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: data.topPages.map(p => `• ${p.title}: ${p.pageviews}`).join('\n')
          }
        },
        { tag: 'hr' },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '## 流量来源'
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: data.trafficSources.map(s => `• ${s.source}: ${s.sessions}`).join('\n')
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `\n⏰ 生成时间: ${new Date().toLocaleString('zh-CN')}`
          }
        }
      ]
    }
  };
}

/**
 * 保存报告
 */
function saveReport(content, format, period) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ga4-${period}-${timestamp}`;

  if (format === 'json') {
    fs.writeFileSync(path.join(CONFIG.outputDir, `${filename}.json`), JSON.stringify(content, null, 2));
    return path.join(CONFIG.outputDir, `${filename}.json`);
  } else {
    fs.writeFileSync(path.join(CONFIG.outputDir, `${filename}.md`), content);
    return path.join(CONFIG.outputDir, `${filename}.md`);
  }
}

/**
 * 发送飞书通知
 */
async function sendFeishuNotification(message) {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    console.log('⚠️ 飞书 Webhook 未配置，跳过通知');
    return;
  }

  return new Promise((resolve, reject) => {
    const urlObj = new URL(webhook);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('✅ 飞书通知发送成功');
        resolve();
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(message));
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  // 解析参数
  let period = 'daily';
  let outputFormat = 'markdown';
  let notify = false;
  let save = true;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--period':
      case '-p':
        period = args[++i];
        break;
      case '--output':
      case '-o':
        outputFormat = args[++i];
        break;
      case '--notify':
        notify = true;
        break;
      case '--no-save':
        save = false;
        break;
      case '--help':
      case '-h':
        console.log(`
GA4 数据汇总脚本

用法:
  node scripts/ga4-report.js [选项]

选项:
  --period, -p <周期>  报告周期: daily, weekly, monthly (默认: daily)
  --output, -o <格式> 输出格式: markdown, json (默认: markdown)
  --notify             发送飞书通知
  --no-save           不保存报告文件
  --help, -h          显示帮助

示例:
  node scripts/ga4-report.js --period weekly
  node scripts/ga4-report.js --period monthly --notify
  node scripts/ga4-report.js --output json
        `);
        process.exit(0);
    }
  }

  console.log('===========================================');
  console.log('GA4 数据汇总');
  console.log('===========================================');

  // 获取日期范围
  const dateRange = getDateRange(period);
  console.log(`报告周期: ${dateRange.start} 至 ${dateRange.end}`);
  console.log('===========================================\n');

  // 生成数据
  console.log('正在获取数据...');
  const data = generateMockData(dateRange); // 实际环境替换为 GA4 API 调用

  // 输出/保存
  if (outputFormat === 'json') {
    console.log('\n📊 数据汇总:');
    console.log(JSON.stringify(data, null, 2));
    if (save) {
      const filepath = saveReport(data, 'json', period);
      console.log(`\n💾 已保存: ${filepath}`);
    }
  } else {
    const report = generateMarkdownReport(data, period);
    console.log(report);
    if (save) {
      const filepath = saveReport(report, 'markdown', period);
      console.log(`\n💾 报告已保存: ${filepath}`);
    }
  }

  // 发送通知
  if (notify) {
    const feishuMsg = generateFeishuMessage(data, period);
    await sendFeishuNotification(feishuMsg);
  }

  console.log('\n===========================================');
  console.log('完成');
  console.log('===========================================');
}

// 运行
if (require.main === module) {
  main().catch(err => {
    console.error('报告生成失败:', err);
    process.exit(1);
  });
}

module.exports = { generateMockData, generateMarkdownReport, generateFeishuMessage, getDateRange };