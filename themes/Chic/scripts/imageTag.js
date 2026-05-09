/**
 * transfer tag to imagg-box block.
 * {% img [class names] /path/to/image [width] [height] '"alt text" "title text"' %}
 * This is used to display image title.
 *
 * v2.12 T31.1: 添加 WebP 支持，通过 data-webp-src 属性供客户端检测切换
 */
hexo.extend.tag.register('img', ([src, alt = '', title = '', imgClass = '']) => {
    // 生成 WebP 版本路径（如果原图是 jpg/jpeg/png/gif）
    var webpSrc = src;
    if (/\.(jpe?g|png|gif)(\?.*)?$/i.test(src)) {
        webpSrc = src.replace(/\.(jpe?g|png|gif)(\?.*)?$/i, '.webp$1');
    }
    return `<div class="image-box">
                <img src="${src}" alt="${alt}" title="${title}" class="${imgClass}" data-webp-src="${webpSrc}">
                <p class="image-box-title">${title || alt}</p>
            </div>`;
});