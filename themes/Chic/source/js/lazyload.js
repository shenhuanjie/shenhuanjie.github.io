(function() {
    'use strict';

    // 图片懒加载实现
    function initLazyLoad() {
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(function(img) {
                observer.observe(img);
            });
        }
    }

    // 为文章内图片添加 data-src 属性
    function setupPostImages() {
        document.querySelectorAll('.post-content img').forEach(function(img) {
            if (!img.hasAttribute('data-src') && img.src) {
                img.setAttribute('data-src', img.src);
                img.src = ''; // 暂时清空，触发懒加载
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        setupPostImages();
        initLazyLoad();
    });
})();