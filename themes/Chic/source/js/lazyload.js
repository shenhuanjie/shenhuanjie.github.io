(function() {
    'use strict';

    // 图片懒加载实现 - 使用原生 loading="lazy" 和 IntersectionObserver 增强
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

    document.addEventListener('DOMContentLoaded', function() {
        initLazyLoad();
    });
})();