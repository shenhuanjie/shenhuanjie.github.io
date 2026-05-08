/**
 * 相关文章生成插件
 * 基于标签和分类匹配生成相关文章推荐
 * 使用方式：在 Hexo 配置中启用后，文章页面会自动获得 related_posts 变量
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 缓存配置
const CACHE_FILE = path.join(__dirname, 'cache', 'related_posts.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

/**
 * 计算两篇文章的相似度
 * @param {Object} post1 - 文章1
 * @param {Object} post2 - 文章2
 * @returns {number} 相似度分数
 */
function calculateSimilarity(post1, post2) {
    let score = 0;

    // 标签匹配（高权重）
    if (post1.tags && post2.tags) {
        const tags1 = new Set(post1.tags.map(t => t.name || t));
        const tags2 = new Set(post2.tags.map(t => t.name || t));
        const intersection = [...tags1].filter(t => tags2.has(t));
        score += intersection.length * 3;
    }

    // 分类匹配（中等权重）
    if (post1.categories && post2.categories) {
        const cats1 = new Set(post1.categories.map(c => c.name || c));
        const cats2 = new Set(post2.categories.map(c => c.name || c));
        const intersection = [...cats1].filter(c => cats2.has(c));
        score += intersection.length * 2;
    }

    // 标题关键词匹配（低权重）
    if (post1.title && post2.title) {
        const words1 = new Set(post1.title.match(/[一-龥]+/g) || []);
        const words2 = new Set(post2.title.match(/[一-龥]+/g) || []);
        const intersection = [...words1].filter(w => words2.has(w) && w.length > 1);
        score += intersection.length * 0.5;
    }

    return score;
}

/**
 * 获取缓存的相关文章
 */
function getCachedRelated(cacheKey) {
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            return null;
        }
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        if (Date.now() - cache.timestamp > CACHE_TTL) {
            return null;
        }
        return cache.posts[cacheKey] || null;
    } catch (e) {
        return null;
    }
}

/**
 * 保存相关文章到缓存
 */
function saveCachedRelated(cacheKey, relatedPosts) {
    try {
        const cacheDir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        let cache = {};
        if (fs.existsSync(CACHE_FILE)) {
            try {
                cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            } catch (e) {
                cache = {};
            }
        }

        cache.posts = cache.posts || {};
        cache.posts[cacheKey] = relatedPosts;
        cache.timestamp = Date.now();

        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error('Failed to save related posts cache:', e);
    }
}

/**
 * 生成某篇文章的相关文章
 * @param {Object} targetPost - 目标文章
 * @param {Array} allPosts - 所有文章
 * @param {number} limit - 返回数量
 * @returns {Array} 相关文章列表
 */
function generateRelatedPosts(targetPost, allPosts, limit = 5) {
    const cacheKey = targetPost.path || targetPost.id;

    // 尝试从缓存获取
    const cached = getCachedRelated(cacheKey);
    if (cached) {
        return cached.slice(0, limit);
    }

    // 排除自身
    const candidates = allPosts.filter(p => {
        return p.path !== targetPost.path && p.id !== targetPost.id;
    });

    // 计算相似度并排序
    const scored = candidates.map(post => {
        return {
            post: post,
            score: calculateSimilarity(targetPost, post)
        };
    });

    scored.sort((a, b) => b.score - a.score);

    // 返回前 N 篇
    const relatedPosts = scored.slice(0, limit)
        .filter(item => item.score > 0)
        .map(item => item.post);

    // 保存到缓存
    if (relatedPosts.length > 0) {
        saveCachedRelated(cacheKey, relatedPosts);
    }

    return relatedPosts;
}

/**
 * Hexo 插件：注册 related_posts 过滤器
 */
function registerRelatedPostsFilter(hexo) {
    // 只在生成文章页面时处理
    hexo.extend.filter.register('template_locals', function(locals) {
        const config = hexo.config;
        const posts = locals.posts || [];

        if (posts.length === 0) {
            return;
        }

        // 为每篇文章生成相关文章
        posts.forEach(post => {
            if (!post.related_posts) {
                post.related_posts = generateRelatedPosts(
                    post,
                    posts.toArray(),
                    5
                );
            }
        });
    });
}

module.exports = registerRelatedPostsFilter;

/**
 * 命令行工具：预先生成相关文章缓存
 */
if (require.main === module) {
    const Hexo = require('hexo');
    const hexo = new Hexo(process.cwd(), {});

    hexo.init().then(() => {
        return hexo.loadPlugin(require.resolve('./related-posts.js'));
    }).then(() => {
        return hexo.posts.toArray();
    }).then(posts => {
        console.log(`Found ${posts.length} posts, generating related posts...`);

        let processed = 0;
        posts.forEach(post => {
            generateRelatedPosts(post, posts, 5);
            processed++;
            if (processed % 10 === 0) {
                console.log(`Processed ${processed}/${posts.length}...`);
            }
        });

        console.log('Related posts cache generated successfully!');
        process.exit(0);
    }).catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}