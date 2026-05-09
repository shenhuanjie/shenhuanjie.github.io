(function() {
    'use strict';

    // ==============================
    // WebP 格式支持检测
    // ==============================
    var WebPUtils = {
        supportLevel: 0, // 0: 不支持, 1: 完全支持, 2: 动画支持
        checkSupport: function() {
            var canvas = document.createElement('canvas');
            if (canvas.getContext) {
                var ctx = canvas.getContext('2d');
                if (ctx) {
                    // 检测 WebP 支持
                    var webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=';
                    var img = new Image();
                    var promise = new Promise(function(resolve, reject) {
                        img.onload = function() {
                            if (img.width === 1 && img.height === 1) {
                                // 检测动画 WebP 支持
                                var animData = 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/QWNzYXN0AAAImQAAABsAABNpwAAgAFAABB5BDCCpAAD+/5DTpQAA';
                                var animImg = new Image();
                                animImg.onload = function() {
                                    resolve(animImg.width === 1 && animImg.height === 1 ? 2 : 1);
                                };
                                animImg.onerror = function() {
                                    resolve(1);
                                };
                                animImg.src = animData;
                            } else {
                                resolve(0);
                            }
                        };
                        img.onerror = function() {
                            resolve(0);
                        };
                        img.src = webpData;
                    });
                    return promise;
                }
            }
            return Promise.resolve(0);
        },
        init: function(callback) {
            var self = this;
            this.checkSupport().then(function(level) {
                self.supportLevel = level;
                // 将支持级别添加到 html 元素上供 CSS 使用
                document.documentElement.classList.add('webp-' + (level > 0 ? 'yes' : 'no'));
                if (level > 0) {
                    document.documentElement.classList.add('webp' + level);
                }
                if (callback) callback(level);
            });
        }
    };

    // 导出到全局
    window.WebPUtils = WebPUtils;

    // ==============================
    // WebP 图片自动切换
    // ==============================
    function initWebPImageSwap() {
        if (WebPUtils.supportLevel === 0) return;

        var images = document.querySelectorAll('img[src]');
        images.forEach(function(img) {
            // 优先使用 imageTag 设置的 data-webp-src 属性
            var webpSrc = img.dataset.webpSrc;
            if (!webpSrc) {
                var src = img.src;
                // 检查是否是支持 WebP 的图片格式 (jpg, jpeg, png, gif)
                if (/\.(jpe?g|png|gif)(\?.*)?$/i.test(src)) {
                    webpSrc = src.replace(/\.(jpe?g|png|gif)(\?.*)?$/i, '.webp$1');
                }
            }

            if (webpSrc && !img.dataset.webpSwapped) {
                img.dataset.webpSwapped = 'checking';
                // 预加载检测图片
                var testImg = new Image();
                testImg.onload = function() {
                    // 浏览器支持 WebP，替换图片源
                    if (WebPUtils.supportLevel > 0) {
                        img.src = webpSrc;
                        img.dataset.webpApplied = 'true';
                    }
                    img.dataset.webpSwapped = 'done';
                };
                testImg.onerror = function() {
                    // WebP 版本不存在，保持原图
                    img.dataset.webpApplied = 'false';
                    img.dataset.webpSwapped = 'done';
                };
                testImg.src = webpSrc;
            }
        });
    }

    // ==============================
    // 图片懒加载实现 - 使用原生 loading="lazy" 和 IntersectionObserver 增强
    // ==============================
    function initLazyLoad() {
        // 使用原生 loading="lazy"（如果支持）
        var supportsNativeLazy = 'loading' in HTMLImageElement.prototype;

        if (!supportsNativeLazy && 'IntersectionObserver' in window) {
            // 降级方案：使用 IntersectionObserver
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            img.classList.add('lazy-loaded');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px 0px'
            });

            document.querySelectorAll('img[data-src]').forEach(function(img) {
                observer.observe(img);
            });
        }
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 初始化 WebP 支持检测
        WebPUtils.init(function(level) {
            if (level > 0) {
                // WebP 支持，启用图片切换
                initWebPImageSwap();
            }
        });
        // 初始化懒加载
        initLazyLoad();
    });
})();