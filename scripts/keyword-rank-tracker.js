/**
 * 关键词排名监控脚本 (T43.4)
 * 追踪核心关键词排名变化
 *
 * 使用 Google Search Console API 获取关键词数据
 *
 * 用法:
 *   node scripts/keyword-rank-tracker.js --track            # 追踪关键词排名
 *   node scripts/keyword-rank-tracker.js --report          # 生成周报告
 *   node scripts/keyword-rank-tracker.js --add <关键词>    # 添加关键词
 *   node scripts/keyword-rank-tracker.js --list            # 列出追踪的关键词
 *   node scripts/keyword-rank-tracker.js --history <关键词> # 查看关键词历史
 *
 * 环境变量:
 *   GSC_SITE_URL      Google Search Console 网站 URL
 *   GSC_ACCESS_TOKEN  Google OAuth2 Access Token
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const CONFIG = {
  dataDir: path.join(__dirname, '..', 'reports', 'keyword-tracker'),
  keywordsFile: path.join(__dirname, '..', 'reports', 'keyword-tracker', 'keywords.json'),
  historyDir: path.join(__dirname, '..', 'reports', 'keyword-tracker', 'history')
};

// 默认追踪的关键词
const DEFAULT_KEYWORDS = [
  'AI大模型',
  'ChatGPT',
  'LLM',
  '人工智能',
  'AI Agent',
  'RAG',
  '程序猿视界'
];

/**
 * 获取环境变量配置
 */
function getConfig() {
  return {
    siteUrl: process.env.GSC_SITE_URL || 'https://shenhuanjie.github.io',
    accessToken: process.env.GSC_ACCESS_TOKEN
  };
}

/**
 * 发送 HTTP 请求
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
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
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * 加载关键词列表
 */
function loadKeywords() {
  if (!fs.existsSync(CONFIG.keywordsFile)) {
    // 创建默认关键词文件
    if (!fs.existsSync(CONFIG.dataDir)) {
      fs.mkdirSync(CONFIG.dataDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.keywordsFile, JSON.stringify({
      keywords: DEFAULT_KEYWORDS,
      updatedAt: new Date().toISOString()
    }, null, 2));
    return DEFAULT_KEYWORDS;
  }

  const data = JSON.parse(fs.readFileSync(CONFIG.keywordsFile, 'utf-8'));
  return data.keywords || DEFAULT_KEYWORDS;
}

/**
 * 保存关键词列表
 */
function saveKeywords(keywords) {
  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.keywordsFile, JSON.stringify({
    keywords,
    updatedAt: new Date().toISOString()
  }, null, 2));
}

/**
 * 获取日期范围
 */
function getDateRange(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

/**
 * 从 Google Search Console 获取关键词数据
 */
async function fetchGSCData(dateRange) {
  const config = getConfig();

  if (!config.accessToken) {
    console.log('⚠️ GSC_ACCESS_TOKEN 未配置，使用模拟数据');
    return generateMockKeywordData(dateRange);
  }

  try {
    // Google Search Console API
    const response = await makeRequest(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          dimensions: ['query'],
          rowLimit: 1000,
          aggregationType: 'byPage'
        }
      }
    );

    if (response.status === 200) {
      return processGSCResponse(response.data);
    } else {
      console.log(`⚠️ GSC API 返回错误: ${response.status}`);
      return generateMockKeywordData(dateRange);
    }
  } catch (err) {
    console.log(`⚠️ GSC API 请求失败: ${err.message}`);
    return generateMockKeywordData(dateRange);
  }
}

/**
 * 处理 GSC API 响应
 */
function processGSCResponse(data) {
  const rows = data.rows || [];

  return rows.map(row => {
    const [query] = row.keys;
    return {
      query,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    };
  }).sort((a, b) => b.clicks - a.clicks);
}

/**
 * 生成模拟关键词数据（用于测试）
 */
function generateMockKeywordData(dateRange) {
  const keywords = loadKeywords();

  return keywords.map(keyword => ({
    query: keyword,
    clicks: Math.floor(Math.random() * 500) + 50,
    impressions: Math.floor(Math.random() * 5000) + 500,
    ctr: (Math.random() * 0.1 + 0.01).toFixed(4),
    position: Math.floor(Math.random() * 50) + 1
  }));
}

/**
 * 加载历史数据
 */
function loadHistory(keyword = null) {
  if (!fs.existsSync(CONFIG.historyDir)) {
    return [];
  }

  const files = fs.readdirSync(CONFIG.historyDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  const history = [];

  for (const file of files.slice(0, 12)) { // 最多加载12周历史
    const data = JSON.parse(fs.readFileSync(path.join(CONFIG.historyDir, file), 'utf-8'));

    if (keyword) {
      const item = data.keywords?.find(k => k.query === keyword);
      if (item) {
        history.push({
          date: data.date,
          ...item
        });
      }
    } else {
      history.push({
        date: data.date,
        keywords: data.keywords
      });
    }
  }

  return history;
}

/**
 * 保存关键词数据到历史
 */
function saveKeywordData(data, dateRange) {
  if (!fs.existsSync(CONFIG.historyDir)) {
    fs.mkdirSync(CONFIG.historyDir, { recursive: true });
  }

  const filename = `keywords-${dateRange.end}.json`;
  const filepath = path.join(CONFIG.historyDir, filename);

  fs.writeFileSync(filepath, JSON.stringify({
    date: new Date().toISOString(),
    period: dateRange,
    keywords: data
  }, null, 2));

  console.log(`数据已保存: ${filepath}`);
}

/**
 * 计算排名变化
 */
function calculateRankChange(keyword, currentData, history) {
  const current = currentData.find(k => k.query === keyword);
  if (!current) return null;

  // 从历史数据中找到最新记录
  const latestHistory = history.find(h => h.keywords);
  if (!latestHistory) return null;

  const previous = latestHistory.keywords?.find(k => k.query === keyword);
  if (!previous) return { current: current.position, change: 0, direction: 'new' };

  const change = previous.position - current.position;

  return {
    current: current.position,
    previous: previous.position,
    change: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    clicksChange: current.clicks - previous.clicks,
    impressionsChange: current.impressions - previous.impressions
  };
}

/**
 * 追踪关键词排名
 */
async function trackKeywordRankings() {
  const dateRange = getDateRange(7);
  console.log('===========================================');
  console.log('关键词排名追踪 (T43.4)');
  console.log('===========================================');
  console.log(`追踪周期: ${dateRange.start} 至 ${dateRange.end}`);
  console.log('===========================================\n');

  // 获取关键词数据
  const data = await fetchGSCData(dateRange);

  // 加载历史数据
  const history = loadHistory();

  // 计算排名变化
  const keywords = loadKeywords();
  const results = [];

  for (const keyword of keywords) {
    const rankChange = calculateRankChange(keyword, data, history);
    const current = data.find(k => k.query === keyword);

    results.push({
      keyword,
      current: current || null,
      rankChange
    });
  }

  // 按点击数排序
  results.sort((a, b) => (b.current?.clicks || 0) - (a.current?.clicks || 0));

  // 显示结果
  console.log('关键词排名状态:\n');
  console.log('排名 | 关键词         | 点击   | 展示   | CTR    | 变化');
  console.log('-----|----------------|--------|--------|--------|------');

  for (const result of results) {
    const current = result.current;
    const change = result.rankChange;

    if (!current) {
      console.log(`  -  | ${result.keyword.padEnd(14)} |   -   |   -   |   -   | 未找到`);
      continue;
    }

    let changeStr = '-';
    if (change) {
      if (change.direction === 'up') changeStr = `↑${change.change}`;
      else if (change.direction === 'down') changeStr = `↓${change.change}`;
      else if (change.direction === 'new') changeStr = 'NEW';
    }

    console.log(
      `${String(current.position).padStart(4)} | ${result.keyword.padEnd(14)} | ` +
      `${String(current.clicks).padStart(6)} | ${String(current.impressions).padStart(6)} | ` +
      `${(current.ctr * 100).toFixed(2).padStart(5)}% | ${changeStr}`
    );
  }

  // 保存数据
  saveKeywordData(data, dateRange);

  console.log('\n===========================================');

  return results;
}

/**
 * 生成周报告
 */
async function generateWeeklyReport() {
  const dateRange = getDateRange(7);
  const history = loadHistory();

  console.log('===========================================');
  console.log('关键词排名周报告');
  console.log('===========================================');
  console.log(`报告周期: ${dateRange.start} 至 ${dateRange.end}`);
  console.log(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('===========================================\n');

  // 获取最新数据
  const data = await fetchGSCData(dateRange);
  const keywords = loadKeywords();

  // 生成报告
  const report = [];
  report.push('# 关键词排名周报告\n');
  report.push(`\n**报告周期**: ${dateRange.start} 至 ${dateRange.end}`);
  report.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
  report.push('\n---\n');
  report.push('\n## 核心关键词状态\n\n');

  // 表格头部
  report.push('| 关键词 | 排名 | 点击 | 展示 | CTR | 变化趋势 |\n');
  report.push('|--------|------|------|------|-----|----------|\n');

  let improvedCount = 0;
  let declinedCount = 0;
  let newCount = 0;

  for (const keyword of keywords) {
    const current = data.find(k => k.query === keyword);
    const change = calculateRankChange(keyword, data, history);

    if (!current) {
      report.push(`| ${keyword} | - | - | - | - | - |\n`);
      continue;
    }

    let trend = '-';
    if (change) {
      if (change.direction === 'up') {
        trend = `↑${change.change}`;
        improvedCount++;
      } else if (change.direction === 'down') {
        trend = `↓${change.change}`;
        declinedCount++;
      } else if (change.direction === 'new') {
        trend = 'NEW';
        newCount++;
      }
    }

    report.push(
      `| ${keyword} | ${current.position.toFixed(1)} | ` +
      `${current.clicks} | ${current.impressions} | ` +
      `${(current.ctr * 100).toFixed(2)}% | ${trend} |\n`
    );
  }

  report.push('\n## 趋势分析\n\n');
  report.push(`- 排名上升: ${improvedCount} 个\n`);
  report.push(`- 排名下降: ${declinedCount} 个\n`);
  report.push(`- 新上榜: ${newCount} 个\n`);

  // TOP 页面关键词
  report.push('\n## 高流量关键词 TOP 10\n\n');
  const topKeywords = [...data]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  report.push('| 关键词 | 点击 | 展示 | 排名 | CTR |\n');
  report.push('|--------|------|------|------|-----|\n');

  for (const kw of topKeywords) {
    report.push(
      `| ${kw.query} | ${kw.clicks} | ${kw.impressions} | ` +
      `${kw.position.toFixed(1)} | ${(kw.ctr * 100).toFixed(2)}% |\n`
    );
  }

  // 保存报告
  const reportDir = path.join(CONFIG.dataDir, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportContent = report.join('');
  const reportPath = path.join(reportDir, `weekly-report-${dateRange.end}.md`);
  fs.writeFileSync(reportPath, reportContent);

  console.log('报告已生成:', reportPath);
  console.log('\n趋势汇总:');
  console.log(`- 排名上升: ${improvedCount} 个`);
  console.log(`- 排名下降: ${declinedCount} 个`);
  console.log(`- 新上榜: ${newCount} 个`);

  return reportContent;
}

/**
 * 添加关键词
 */
function addKeyword(keyword) {
  if (!keyword) {
    console.error('请指定关键词');
    return false;
  }

  const keywords = loadKeywords();

  if (keywords.includes(keyword)) {
    console.log(`关键词已存在: ${keyword}`);
    return false;
  }

  keywords.push(keyword);
  saveKeywords(keywords);
  console.log(`已添加关键词: ${keyword}`);
  return true;
}

/**
 * 列出关键词
 */
function listKeywords() {
  const keywords = loadKeywords();

  console.log('\n===========================================');
  console.log('追踪的关键词列表');
  console.log('===========================================');
  console.log(`共 ${keywords.length} 个关键词\n`);

  for (let i = 0; i < keywords.length; i++) {
    console.log(`  ${i + 1}. ${keywords[i]}`);
  }

  console.log('\n===========================================');
}

/**
 * 查看关键词历史
 */
function showKeywordHistory(keyword) {
  if (!keyword) {
    console.error('请指定关键词');
    return;
  }

  const history = loadHistory(keyword);

  console.log('\n===========================================');
  console.log(`关键词 "${keyword}" 历史排名`);
  console.log('===========================================\n');

  if (history.length === 0) {
    console.log('暂无历史数据');
    return;
  }

  console.log('日期       | 排名  | 点击  | 展示  | 变化');
  console.log('-----------|-------|-------|-------|------');

  for (const record of history) {
    let changeStr = '-';
    if (record.rankChange) {
      if (record.rankChange.direction === 'up') changeStr = `↑${record.rankChange.change}`;
      else if (record.rankChange.direction === 'down') changeStr = `↓${record.rankChange.change}`;
      else if (record.rankChange.direction === 'new') changeStr = 'NEW';
    }

    console.log(
      `${record.date.split('T')[0]} | ` +
      `${record.current?.position?.toFixed(1) || '-'} | ` +
      `${record.current?.clicks || '-'} | ` +
      `${record.current?.impressions || '-'} | ${changeStr}`
    );
  }

  console.log('\n===========================================');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
关键词排名监控脚本 (T43.4)

用法:
  node scripts/keyword-rank-tracker.js --track            # 追踪关键词排名
  node scripts/keyword-rank-tracker.js --report         # 生成周报告
  node scripts/keyword-rank-tracker.js --add <关键词>   # 添加关键词
  node scripts/keyword-rank-tracker.js --list           # 列出追踪的关键词
  node scripts/keyword-rank-tracker.js --history <关键词> # 查看关键词历史

环境变量:
  GSC_SITE_URL       Google Search Console 网站 URL
  GSC_ACCESS_TOKEN   Google OAuth2 Access Token

示例:
  node scripts/keyword-rank-tracker.js --track
  node scripts/keyword-rank-tracker.js --report
  node scripts/keyword-rank-tracker.js --add "AI大模型"
  node scripts/keyword-rank-tracker.js --history "AI大模型"
    `);
    process.exit(0);
  }

  switch (command) {
    case '--track':
    case '-t':
      await trackKeywordRankings();
      break;

    case '--report':
    case '-r':
      await generateWeeklyReport();
      break;

    case '--add':
    case '-a':
      addKeyword(args[1]);
      break;

    case '--list':
    case '-l':
      listKeywords();
      break;

    case '--history':
    case '-h':
      showKeywordHistory(args[1]);
      break;

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
  trackKeywordRankings,
  generateWeeklyReport,
  addKeyword,
  listKeywords,
  showKeywordHistory,
  loadKeywords,
  loadHistory,
  fetchGSCData
};