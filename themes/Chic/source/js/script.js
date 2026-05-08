// declaraction of document.ready() function.
(function () {
    var ie = !!(window.attachEvent && !window.opera);
    var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
    var fn = [];
    var run = function () {
        for (var i = 0; i < fn.length; i++) fn[i]();
    };
    var d = document;
    d.ready = function (f) {
        if (!ie && !wk && d.addEventListener)
            return d.addEventListener('DOMContentLoaded', f, false);
        if (fn.push(f) > 1) return;
        if (ie)
            (function () {
                try {
                    d.documentElement.doScroll('left');
                    run();
                } catch (err) {
                    setTimeout(arguments.callee, 0);
                }
            })();
        else if (wk)
            var t = setInterval(function () {
                if (/^(loaded|complete)$/.test(d.readyState))
                    clearInterval(t), run();
            }, 0);
    };
})();


document.ready(
    // toggleTheme function.
    // this script shouldn't be changed.
    () => {
        var _Blog = window._Blog || {};
        const currentTheme = window.localStorage && window.localStorage.getItem('theme');
        const isDark = currentTheme === 'dark';
        const pagebody = document.getElementsByTagName('body')[0]
        if (isDark) {
            document.getElementById("switch_default").checked = true;
            // mobile
            document.getElementById("mobile-toggle-theme").innerText = "· Dark"
        } else {
            document.getElementById("switch_default").checked = false;
            // mobile
            document.getElementById("mobile-toggle-theme").innerText = "· Light"
        }
        _Blog.toggleTheme = function () {
            if (isDark) {
                pagebody.classList.add('dark-theme');
                // mobile
                document.getElementById("mobile-toggle-theme").innerText = "· Dark"
            } else {
                pagebody.classList.remove('dark-theme');
                // mobile
                document.getElementById("mobile-toggle-theme").innerText = "· Light"
            }
            document.getElementsByClassName('toggleBtn')[0].addEventListener('click', () => {
                if (pagebody.classList.contains('dark-theme')) {
                    pagebody.classList.remove('dark-theme');
                } else {
                    pagebody.classList.add('dark-theme');
                }
                window.localStorage &&
                    window.localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light',)
            })
            // moblie
            document.getElementById('mobile-toggle-theme').addEventListener('click', () => {
                if (pagebody.classList.contains('dark-theme')) {
                    pagebody.classList.remove('dark-theme');
                    // mobile
                    document.getElementById("mobile-toggle-theme").innerText = "· Light"

                } else {
                    pagebody.classList.add('dark-theme');
                    // mobile
                    document.getElementById("mobile-toggle-theme").innerText = "· Dark"
                }
                window.localStorage &&
                    window.localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light',)
            })
        };
        _Blog.toggleTheme();
        // ready function.
    }
);

// ==============================
// 代码块复制按钮
// ==============================
(function() {
    function initCodeCopyButtons() {
        var figures = document.querySelectorAll('figure.highlight');
        if (figures.length === 0) return;

        figures.forEach(function(figure) {
            // 检查是否已有复制按钮
            if (figure.querySelector('.copy-btn')) return;

            // 创建复制按钮
            var copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.setAttribute('title', '复制代码');

            // 获取代码内容
            var pre = figure.querySelector('pre');
            if (!pre) return;

            // 添加点击事件
            copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var code = figure.querySelector('code');
                if (!code) code = pre;

                var textToCopy = code.textContent || code.innerText;

                // 复制到剪贴板
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(function() {
                        showCopiedFeedback(copyBtn, true);
                    }).catch(function() {
                        fallbackCopy(textToCopy, copyBtn);
                    });
                } else {
                    fallbackCopy(textToCopy, copyBtn);
                }
            });

            figure.appendChild(copyBtn);
        });
    }

    function fallbackCopy(text, btn) {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCopiedFeedback(btn, true);
        } catch (err) {
            showCopiedFeedback(btn, false);
        }
        document.body.removeChild(textArea);
    }

    function showCopiedFeedback(btn, success) {
        var originalText = btn.textContent;
        btn.textContent = success ? 'Copied!' : 'Failed';
        btn.classList.add(success ? 'copied' : 'copy-failed');

        setTimeout(function() {
            btn.textContent = originalText;
            btn.classList.remove('copied', 'copy-failed');
        }, 1500);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCodeCopyButtons);
    } else {
        initCodeCopyButtons();
    }
})();

// ==============================
// 悬浮式回到顶部按钮
// ==============================
(function() {
    function createBackToTopButton() {
        // 检查是否已存在
        if (document.getElementById('back-to-top')) return;

        var btn = document.createElement('button');
        btn.id = 'back-to-top';
        btn.className = 'back-to-top';
        btn.innerHTML = '&#8679;';
        btn.setAttribute('title', '回到顶部');
        document.body.appendChild(btn);

        // 滚动事件
        function toggleVisibility() {
            if (window.pageYOffset > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', toggleVisibility, { passive: true });

        // 点击事件
        btn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBackToTopButton);
    } else {
        createBackToTopButton();
    }
})();

// ==============================
// Reading Progress Bar
// ==============================
(function() {
    var progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    function updateProgressBar() {
        var windowHeight = window.innerHeight;
        var documentHeight = document.documentElement.scrollHeight - windowHeight;
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var progress = (scrollTop / documentHeight) * 100;
        progressBar.style.width = Math.min(progress, 100) + '%';
    }

    // Update on scroll
    window.addEventListener('scroll', updateProgressBar, { passive: true });

    // Update on load
    updateProgressBar();
})();

// ==============================
// 图片懒加载 - 性能优化
// ==============================
(function() {
    // 获取所有文章内容中的图片
    function getLazyImages() {
        // 选择文章内容区域和正文中的图片
        var selectors = [
            '.post-content img',
            '.article-content img',
            '.entry-content img',
            'article img',
            '.post-detail img',
            '.markdown-body img'
        ];
        var images = [];
        selectors.forEach(function(sel) {
            var els = document.querySelectorAll(sel);
            els.forEach(function(el) {
                // 避免重复处理
                if (!el.dataset.lazyProcessed) {
                    images.push(el);
                }
            });
        });
        return images;
    }

    // 使用 Intersection Observer 实现懒加载
    function initImageLazyLoad() {
        var images = getLazyImages();
        if (images.length === 0) return;

        // 图片占位样式 - 防止布局抖动
        var styleEl = document.createElement('style');
        styleEl.textContent = [
            'img[loading="lazy"] {',
            '  opacity: 0;',
            '  transition: opacity 0.3s ease-in;',
            '}',
            'img[loading="lazy"].loaded,',
            'img.lazy-loaded {',
            '  opacity: 1;',
            '}',
            'img.lazy-placeholder {',
            '  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);',
            '  background-size: 200% 100%;',
            '  animation: lazy-loading 1.5s infinite;',
            '}',
            '@keyframes lazy-loading {',
            '  0% { background-position: 200% 0; }',
            '  100% { background-position: -200% 0; }',
            '}'
        ].join('\n');
        document.head.appendChild(styleEl);

        // 检查浏览器是否原生支持 loading="lazy"
        var supportsNativeLazy = 'loading' in HTMLImageElement.prototype;

        // 为图片添加占位背景
        images.forEach(function(img) {
            // 保存原始宽高比以防止布局抖动
            if (!img.style.aspectRatio && !img.getAttribute('width')) {
                var aspectRatio = img.naturalWidth && img.naturalHeight
                    ? img.naturalHeight / img.naturalWidth
                    : 0.5625; // 默认 16:9
                img.style.aspectRatio = aspectRatio;
                img.style.maxWidth = '100%';
            }

            // 添加占位类
            img.classList.add('lazy-placeholder');
        });

        // 使用 Intersection Observer 监听图片
        var observer = new IntersectionObserver(function(entries, obs) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;

                    if (supportsNativeLazy) {
                        // 浏览器原生支持，直接设置 loading="lazy"
                        img.setAttribute('loading', 'lazy');
                    }

                    // 添加加载完成事件监听
                    if (img.complete) {
                        img.classList.remove('lazy-placeholder');
                        img.classList.add('loaded');
                    } else {
                        img.addEventListener('load', function() {
                            img.classList.remove('lazy-placeholder');
                            img.classList.add('loaded');
                        }, { once: true });
                    }

                    img.dataset.lazyProcessed = 'true';
                    obs.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // 提前 50px 开始加载
            threshold: 0.01
        });

        images.forEach(function(img) {
            observer.observe(img);
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageLazyLoad);
    } else {
        initImageLazyLoad();
    }
})();
