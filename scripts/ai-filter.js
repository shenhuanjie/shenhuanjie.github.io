/**
 * AI Filter - Hexo 过滤器
 * 自动为新文章生成 AI 摘要和 SEO 描述
 */

'use strict';

const aiHelper = require('./ai-helper');

/**
 * 注册 Hexo 过滤器
 * @param {Hexo} hexo - Hexo 实例
 */
function register(hexo) {
  // new_post_filter - 新建文章时自动生成元数据
  hexo.extend.filter.register('new_post_path', async (data) => {
    // 检查是否启用 AI 自动生成
    const aiAutoGenerate = hexo.config.ai_auto_generate !== false;

    if (!aiAutoGenerate) {
      return;
    }

    // 检查 API Key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('[AI Filter] ANTHROPIC_API_KEY 未设置，跳过自动生成');
      return;
    }

    console.log('[AI Filter] 开始自动生成文章元数据...');
  });

  // processor_after_save - 文章保存后自动生成摘要
  hexo.extend.filter.register('after_save', async (post) => {
    // 检查是否启用 AI 自动生成
    const aiAutoGenerate = hexo.config.ai_auto_generate !== false;

    if (!aiAutoGenerate) {
      return;
    }

    // 检查 API Key
    if (!process.env.ANTHROPIC_API_KEY) {
      return;
    }

    // 只处理新创建的文章（标记为 ai_generated: false 或不存在）
    if (post.ai_generated === 'true') {
      return;
    }

    console.log(`[AI Filter] 为文章生成 AI 元数据: ${post.title}`);

    try {
      const title = post.title || '';
      const content = post.raw || '';

      // 生成摘要
      if (!post.ai_summary && content) {
        const summary = await aiHelper.generateSummary(content);
        post.ai_summary = summary;
        console.log(`[AI Filter] 摘要: ${summary}`);
      }

      // 生成描述
      if (!post.description && title && content) {
        const description = await aiHelper.generateDescription(title, content);
        post.description = description;
        console.log(`[AI Filter] 描述: ${description}`);
      }

      // 标记为已生成
      post.ai_generated = 'true';

      // 保存更新
      if (hexo.extend.filter.call('after_save', post)) {
        // 如果有更新，保存文件
        const filePath = post.full_source;
        if (filePath && fs.existsSync(filePath)) {
          const fs = require('fs');
          const lines = fs.readFileSync(filePath, 'utf8').split('\n');

          // 找到 front-matter 并更新
          let frontMatterEnd = -1;
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
              frontMatterEnd = i;
              break;
            }
          }

          if (frontMatterEnd > 1) {
            // 更新 front-matter 字段
            const frontMatter = {};
            for (let i = 1; i < frontMatterEnd; i++) {
              const line = lines[i];
              const match = line.match(/^(\w+):\s*(.*)$/);
              if (match) {
                frontMatter[match[1]] = match[2].trim();
              }
            }

            // 添加/更新字段
            if (post.ai_summary) frontMatter.ai_summary = post.ai_summary;
            if (post.description) frontMatter.description = post.description;
            frontMatter.ai_generated = 'true';

            // 重建 front-matter
            const newFrontMatter = Object.entries(frontMatter)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');

            const body = lines.slice(frontMatterEnd + 1).join('\n');
            const newContent = `---\n${newFrontMatter}\n---\n${body}`;

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[AI Filter] 已更新: ${filePath}`);
          }
        }
      }
    } catch (error) {
      console.error(`[AI Filter] 生成元数据失败: ${error.message}`);
    }
  });

  // before_post_render - 文章渲染前填充描述
  hexo.extend.filter.register('before_post_render', async (post) => {
    // 如果没有描述但有 AI 摘要，使用摘要作为描述
    if (!post.description && post.ai_summary) {
      post.description = post.ai_summary;
    }
    return post;
  });
}

module.exports = { register };