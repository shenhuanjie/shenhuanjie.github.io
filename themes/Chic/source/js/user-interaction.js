/**
 * 用户互动功能
 * - 收藏文章（LocalStorage）
 * - 阅读历史记录（LocalStorage）
 */

(function() {
    'use strict';

    // ==============================
    // 配置
    // ==============================
    var MAX_HISTORY_ITEMS = 20;
    var STORAGE_KEY_FAVORITES = 'blog_favorites';
    var STORAGE_KEY_HISTORY = 'blog_reading_history';

    // ==============================
    // 工具函数
    // ==============================
    function getLocalStorage(key) {
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('LocalStorage read error:', e);
            return [];
        }
    }

    function setLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage write error:', e);
        }
    }

    function getPageInfo() {
        var title = document.querySelector('.post-title');
        var url = window.location.href;
        var date = new Date().toISOString();
        return {
            title: title ? title.textContent.trim() : document.title,
            url: url,
            date: date
        };
    }

    // ==============================
    // 收藏文章功能
    // ==============================
    var Favorites = {
        init: function() {
            var bookmarkBtn = document.querySelector('.post-bookmark');
            if (!bookmarkBtn) return;

            this.updateButtonState(bookmarkBtn);
            this.bindEvents(bookmarkBtn);
        },

        getAll: function() {
            return getLocalStorage(STORAGE_KEY_FAVORITES);
        },

        save: function(favorites) {
            setLocalStorage(STORAGE_KEY_FAVORITES, favorites);
        },

        isFavorited: function(url) {
            var favorites = this.getAll();
            return favorites.some(function(item) {
                return item.url === url;
            });
        },

        add: function(pageInfo) {
            var favorites = this.getAll();
            // 检查是否已存在
            if (this.isFavorited(pageInfo.url)) return;

            favorites.unshift(pageInfo);
            this.save(favorites);
        },

        remove: function(url) {
            var favorites = this.getAll();
            favorites = favorites.filter(function(item) {
                return item.url !== url;
            });
            this.save(favorites);
        },

        toggle: function() {
            var pageInfo = getPageInfo();
            var bookmarkBtn = document.querySelector('.post-bookmark');
            var bookmarkIcon = bookmarkBtn.querySelector('.bookmark-icon');

            if (this.isFavorited(pageInfo.url)) {
                this.remove(pageInfo.url);
                bookmarkBtn.classList.remove('active');
                bookmarkBtn.setAttribute('title', '收藏文章');
                bookmarkIcon.textContent = '♡';
            } else {
                this.add(pageInfo);
                bookmarkBtn.classList.add('active');
                bookmarkBtn.setAttribute('title', '已收藏');
                bookmarkIcon.textContent = '♥';
            }
        },

        updateButtonState: function(btn) {
            var pageInfo = getPageInfo();
            var bookmarkIcon = btn.querySelector('.bookmark-icon');
            if (this.isFavorited(pageInfo.url)) {
                btn.classList.add('active');
                btn.setAttribute('title', '已收藏');
                bookmarkIcon.textContent = '♥';
            } else {
                btn.classList.remove('active');
                btn.setAttribute('title', '收藏文章');
                bookmarkIcon.textContent = '♡';
            }
        },

        bindEvents: function(btn) {
            var self = this;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                self.toggle();
            });
        }
    };

    // ==============================
    // 阅读历史功能
    // ==============================
    var ReadingHistory = {
        init: function() {
            var historyPanel = document.querySelector('.reading-history .history-panel');
            if (!historyPanel) return;

            this.recordVisit();
            this.bindEvents();
            this.render();
        },

        getAll: function() {
            return getLocalStorage(STORAGE_KEY_HISTORY);
        },

        save: function(history) {
            setLocalStorage(STORAGE_KEY_HISTORY, history);
        },

        recordVisit: function() {
            var pageInfo = getPageInfo();
            var history = this.getAll();

            // 移除已存在的相同URL记录
            history = history.filter(function(item) {
                return item.url !== pageInfo.url;
            });

            // 添加到开头
            history.unshift(pageInfo);

            // 限制最大数量
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }

            this.save(history);
        },

        bindEvents: function() {
            var toggle = document.querySelector('.reading-history .history-toggle');
            var panel = document.querySelector('.reading-history .history-panel');
            var closeBtn = document.querySelector('.reading-history .history-close');

            if (toggle && panel) {
                toggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    panel.classList.toggle('active');
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    panel.classList.remove('active');
                });
            }

            // 点击外部关闭
            document.addEventListener('click', function(e) {
                if (panel && panel.classList.contains('active')) {
                    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                        panel.classList.remove('active');
                    }
                }
            });
        },

        render: function() {
            var list = document.querySelector('.reading-history .history-list');
            var empty = document.querySelector('.reading-history .history-empty');
            var count = document.querySelector('.reading-history .history-count');
            var history = this.getAll();

            if (!list) return;

            // 更新数量
            if (count) {
                count.textContent = history.length;
            }

            // 渲染列表
            if (history.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = 'block';
                return;
            }

            if (empty) empty.style.display = 'none';

            list.innerHTML = history.map(function(item) {
                var date = new Date(item.date);
                var dateStr = date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                return '<li class="history-item">' +
                    '<a href="' + encodeURI(item.url) + '">' + escapeHtml(item.title) + '</a>' +
                    '<span class="history-date">' + dateStr + '</span>' +
                    '</li>';
            }).join('');
        }
    };

    // HTML转义
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ==============================
    // 初始化
    // ==============================
    document.addEventListener('DOMContentLoaded', function() {
        Favorites.init();
        ReadingHistory.init();
    });
})();