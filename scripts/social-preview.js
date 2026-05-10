/**
 * 社交媒体预览脚本
 * 生成各平台分享预览
 *
 * 用法:
 *   node scripts/social-preview.js --title "文章标题" --url "https://..."
 *   node scripts/social-preview.js --file source/_posts/article.md
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Twitter 卡片预览
 */
function generateTwitterCard(data) {
  return {
    platform: 'Twitter/X',
    cardType: 'summary_large_image',
    title: data.title,
    description: data.description || '',
    image: data.cover || '',
    url: data.url,
    warnings: []
  };
}

/**
 * LinkedIn 分享预览
 */
function generateLinkedInPreview(data) {
  return {
    platform: 'LinkedIn',
    title: data.title,
    description: data.description || '',
    image: data.cover || '',
    url: data.url,
    warnings: []
  };
}

/**
 * Facebook 分享预览
 */
function generateFacebookPreview(data) {
  return {
    platform: 'Facebook',
    title: data.title,
    description: data.description || '',
    image: data.cover || '',
    url: data.url,
    appId: process.env.FB_APP_ID || '',
    warnings: []
  };
}

/**
 * 微信分享预览（生成二维码数据）
 */
function generateWechatPreview(data) {
  return {
    platform: '微信',
    title: data.title,
    description: data.description || '',
    image: data.cover || '',
    url: data.url,
    warnings: []
  };
}

/**
 * 验证社交分享元数据
 */
function validateSocialMeta(data) {
  const warnings = [];

  // Twitter 限制
  if (data.title && data.title.length > 70) {
    warnings.push(`标题超过 70 字符限制 (${data.title.length})`);
  }
  if (data.description && data.description.length > 200) {
    warnings.push(`描述超过 200 字符限制 (${data.description.length})`);
  }
  if (data.image && !data.image.match(/\.(jpg|jpeg|png|webp)$/i)) {
    warnings.push('图片建议使用 JPG/PNG/WebP 格式');
  }

  return warnings;
}

/**
 * 从文件解析文章数据
 */
function parseArticleFromFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return null;
  }

  try {
    const frontMatter = yaml.load(match[1]);
    return {
      title: frontMatter.title || '',
      description: frontMatter.description || '',
      cover: frontMatter.cover || '',
      date: frontMatter.date || '',
      tags: frontMatter.tags || [],
      categories: frontMatter.categories || []
    };
  } catch (e) {
    console.error('Frontmatter 解析失败:', e.message);
    return null;
  }
}

/**
 * 生成完整的社交预览报告
 */
function generateSocialPreview(articleData) {
  console.log('===========================================');
  console.log('社交媒体分享预览');
  console.log('===========================================\n');

  // 验证元数据
  const warnings = validateSocialMeta(articleData);

  if (warnings.length > 0) {
    console.log('⚠️  元数据警告:');
    for (const warn of warnings) {
      console.log(`   - ${warn}`);
    }
    console.log('');
  }

  // 生成各平台预览
  const previews = {
    twitter: generateTwitterCard(articleData),
    linkedin: generateLinkedInPreview(articleData),
    facebook: generateFacebookPreview(articleData),
    wechat: generateWechatPreview(articleData)
  };

  // 输出预览
  console.log('## Twitter/X 卡片\n');
  console.log(`类型: ${previews.twitter.cardType}`);
  console.log(`标题: ${previews.twitter.title}`);
  console.log(`描述: ${previews.twitter.description}`);
  console.log(`图片: ${previews.twitter.image || '(未设置)'}`);
  console.log(`链接: ${previews.twitter.url}\n`);

  console.log('## LinkedIn 分享\n');
  console.log(`标题: ${previews.linkedin.title}`);
  console.log(`描述: ${previews.linkedin.description}`);
  console.log(`图片: ${previews.linkedin.image || '(未设置)'}`);
  console.log(`链接: ${previews.linkedin.url}\n`);

  console.log('## Facebook 分享\n');
  console.log(`标题: ${previews.facebook.title}`);
  console.log(`描述: ${previews.facebook.description}`);
  console.log(`图片: ${previews.facebook.image || '(未设置)'}`);
  console.log(`链接: ${previews.facebook.url}\n`);

  console.log('## 微信分享\n');
  console.log(`标题: ${previews.wechat.title}`);
  console.log(`描述: ${previews.wechat.description}`);
  console.log(`链接: ${previews.wechat.url}\n`);

  // 生成 HTML 预览模板
  const htmlTemplate = generateHtmlPreview(articleData, previews);
  const previewPath = path.join(__dirname, '..', 'reports', 'social-preview.html');
  const reportsDir = path.dirname(previewPath);

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(previewPath, htmlTemplate);
  console.log(`📄 HTML 预览已生成: ${previewPath}`);
  console.log('   (在浏览器中打开可查看各平台卡片效果)\n');

  // 生成发布文本
  console.log('===========================================');
  console.log('建议发布文本');
  console.log('===========================================\n');

  console.log('### Twitter/X\n');
  console.log(`${articleData.title}\n`);
  console.log(`${articleData.description}\n`);
  console.log(`${articleData.url}\n`);

  console.log('### LinkedIn\n');
  console.log(`${articleData.title}\n`);
  console.log(`${articleData.description}\n`);
  console.log(`来源: ${articleData.url}\n`);

  console.log('===========================================');

  return { previews, warnings, htmlPath: previewPath };
}

/**
 * 生成 HTML 预览页面
 */
function generateHtmlPreview(article, previews) {
  const escapedTitle = article.title.replace(/"/g, '&quot;');
  const escapedDesc = (article.description || '').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>社交媒体预览 - ${escapedTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; color: #333; }
    .preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .preview-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .preview-header { padding: 15px; font-weight: bold; color: white; }
    .twitter .preview-header { background: #000; }
    .linkedin .preview-header { background: #0077b5; }
    .facebook .preview-header { background: #1877f2; }
    .wechat .preview-header { background: #07c160; }
    .preview-body { padding: 15px; }
    .preview-image { width: 100%; height: 200px; object-fit: cover; background: #eee; margin-bottom: 10px; border-radius: 8px; }
    .preview-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #333; }
    .preview-desc { font-size: 14px; color: #666; margin-bottom: 10px; line-height: 1.4; }
    .preview-url { font-size: 12px; color: #999; }
    .meta-info { background: white; padding: 20px; border-radius: 12px; margin-top: 20px; }
    .meta-info h2 { margin-bottom: 15px; color: #333; }
    .meta-item { display: flex; margin-bottom: 10px; }
    .meta-label { width: 100px; font-weight: bold; color: #666; }
    .meta-value { flex: 1; color: #333; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <h1>社交媒体分享预览</h1>

    <div class="preview-grid">
      <div class="preview-card twitter">
        <div class="preview-header">Twitter/X</div>
        <div class="preview-body">
          ${article.cover ? `<img src="${article.cover}" class="preview-image" alt="cover">` : '<div class="preview-image"></div>'}
          <div class="preview-title">${article.title}</div>
          <div class="preview-desc">${article.description || ''}</div>
          <div class="preview-url">${article.url}</div>
        </div>
      </div>

      <div class="preview-card linkedin">
        <div class="preview-header">LinkedIn</div>
        <div class="preview-body">
          ${article.cover ? `<img src="${article.cover}" class="preview-image" alt="cover">` : '<div class="preview-image"></div>'}
          <div class="preview-title">${article.title}</div>
          <div class="preview-desc">${article.description || ''}</div>
          <div class="preview-url">${article.url}</div>
        </div>
      </div>

      <div class="preview-card facebook">
        <div class="preview-header">Facebook</div>
        <div class="preview-body">
          ${article.cover ? `<img src="${article.cover}" class="preview-image" alt="cover">` : '<div class="preview-image"></div>'}
          <div class="preview-title">${article.title}</div>
          <div class="preview-desc">${article.description || ''}</div>
          <div class="preview-url">${article.url}</div>
        </div>
      </div>

      <div class="preview-card wechat">
        <div class="preview-header">微信</div>
        <div class="preview-body">
          ${article.cover ? `<img src="${article.cover}" class="preview-image" alt="cover">` : '<div class="preview-image"></div>'}
          <div class="preview-title">${article.title}</div>
          <div class="preview-desc">${article.description || ''}</div>
          <div class="preview-url">${article.url}</div>
        </div>
      </div>
    </div>

    <div class="meta-info">
      <h2>文章元数据</h2>
      <div class="meta-item"><span class="meta-label">标题:</span><span class="meta-value">${article.title}</span></div>
      <div class="meta-item"><span class="meta-label">描述:</span><span class="meta-value">${article.description || '(未设置)'}</span></div>
      <div class="meta-item"><span class="meta-label">封面图:</span><span class="meta-value">${article.cover || '(未设置)'}</span></div>
      <div class="meta-item"><span class="meta-label">链接:</span><span class="meta-value">${article.url}</span></div>
      <div class="meta-item"><span class="meta-label">标签:</span><span class="meta-value">${Array.isArray(article.tags) ? article.tags.join(', ') : article.tags}</span></div>
      <div class="meta-item"><span class="meta-label">分类:</span><span class="meta-value">${Array.isArray(article.categories) ? article.categories.join(', ') : article.categories}</span></div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  let articleData = {
    title: '',
    description: '',
    cover: '',
    url: ''
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--title':
        articleData.title = args[++i];
        break;
      case '--description':
      case '--desc':
        articleData.description = args[++i];
        break;
      case '--url':
        articleData.url = args[++i];
        break;
      case '--cover':
        articleData.cover = args[++i];
        break;
      case '--file':
      case '-f':
        const fileData = parseArticleFromFile(args[++i]);
        if (fileData) {
          articleData = { ...articleData, ...fileData };
        }
        break;
      case '--help':
      case '-h':
        console.log(`
社交媒体预览脚本

用法:
  node scripts/social-preview.js [选项]

选项:
  --title, -t <标题>     文章标题
  --description, --desc <描述>  文章描述
  --url <链接>          文章链接
  --cover <图片>        封面图 URL
  --file, -f <文件>     从文章文件解析元数据
  --help, -h            显示帮助

示例:
  node scripts/social-preview.js --title "AI 新趋势" --url "https://..."
  node scripts/social-preview.js --file source/_posts/article.md
        `);
        process.exit(0);
    }
  }

  if (!articleData.title || !articleData.url) {
    console.error('❌ 错误: 必须提供标题和链接');
    console.error('   使用 --help 查看帮助');
    process.exit(1);
  }

  generateSocialPreview(articleData);
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { generateTwitterCard, generateLinkedInPreview, generateFacebookPreview, parseArticleFromFile };