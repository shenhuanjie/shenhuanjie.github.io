/**
 * 收藏/历史页面功能 v1.5 done
 */

(function() {
    'use strict';

    // ==============================
    // 配置
    // ==============================
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ==============================
    // 收藏列表
    // ==============================
    var Favorites = {
        getAll: function() {
            return getLocalStorage(STORAGE_KEY_FAVORITES);
        },

        remove: function(url) {
            var favorites = this.getAll();
            favorites = favorites.filter(function(item) {
                return item.url !== url;
            });
            setLocalStorage(STORAGE_KEY_FAVORITES, favorites);
        },

        render: function() {
            var list = document.getElementById('favorites-list');
            var empty = document.getElementById('favorites-empty');
            var count = document.getElementById('favorites-count');
            var favorites = this.getAll();

            if (!list) return;

            if (count) {
                count.textContent = favorites.length;
            }

            if (favorites.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = 'block';
                return;
            }

            if (empty) empty.style.display = 'none';

            var self = this;
            list.innerHTML = favorites.map(function(item) {
                return '<li class="favorites-item">' +
                    '<a href="' + encodeURI(item.url) + '" class="favorites-title">' + escapeHtml(item.title) + '</a>' +
                    '<span class="favorites-date">' + formatDate(item.date) + '</span>' +
                    '<button class="favorites-remove" data-url="' + encodeURI(item.url) + '" title="取消收藏">×</button>' +
                    '</li>';
            }).join('');

            // 绑定删除事件
            list.querySelectorAll('.favorites-remove').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var url = decodeURI(this.getAttribute('data-url'));
                    self.remove(url);
                    self.render();
                });
            });
        }
    };

    // ==============================
    // 阅读历史
    // ==============================
    var History = {
        getAll: function() {
            return getLocalStorage(STORAGE_KEY_HISTORY);
        },

        render: function() {
            var list = document.getElementById('history-list');
            var empty = document.getElementById('history-empty');
            var count = document.getElementById('history-count');
            var history = this.getAll();

            if (!list) return;

            if (count) {
                count.textContent = history.length;
            }

            if (history.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = 'block';
                return;
            }

            if (empty) empty.style.display = 'none';

            list.innerHTML = history.map(function(item) {
                return '<li class="history-item">' +
                    '<a href="' + encodeURI(item.url) + '" class="history-title">' + escapeHtml(item.title) + '</a>' +
                    '<span class="history-date">' + formatDate(item.date) + '</span>' +
                    '</li>';
            }).join('');
        }
    };

    // ==============================
    // 初始化
    // ==============================
    document.addEventListener('DOMContentLoaded', function() {
        Favorites.render();
        History.render();
    });
})();