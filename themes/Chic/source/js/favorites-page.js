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
                    // 重新渲染统计
                    if (window.Stats) window.Stats.render();
                });
            });
        }
    };

    // ==============================
    // T40.3 收藏分析统计
    // ==============================
    var Stats = {
        getAllFavorites: function() {
            return getLocalStorage(STORAGE_KEY_FAVORITES);
        },
        getAllHistory: function() {
            return getLocalStorage(STORAGE_KEY_HISTORY);
        },
        getWeekNewItems: function(items) {
            var now = new Date();
            var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return items.filter(function(item) {
                return new Date(item.date) >= weekAgo;
            }).length;
        },
        getAvgReadingPerDay: function() {
            var history = this.getAllHistory();
            if (history.length === 0) return 0;
            // 按日期分组
            var dates = {};
            history.forEach(function(item) {
                var dateKey = item.date.substring(0, 10);
                dates[dateKey] = (dates[dateKey] || 0) + 1;
            });
            var dateCount = Object.keys(dates).length;
            return dateCount > 0 ? Math.round(history.length / dateCount * 10) / 10 : 0;
        },
        render: function() {
            var favorites = this.getAllFavorites();
            var history = this.getAllHistory();
            var weekNew = this.getWeekNewItems(favorites);
            var avgReading = this.getAvgReadingPerDay();

            var statsFavorites = document.getElementById('stats-favorites');
            var statsHistory = document.getElementById('stats-history');
            var statsWeek = document.getElementById('stats-week');
            var statsAvg = document.getElementById('stats-avg');

            if (statsFavorites) statsFavorites.textContent = favorites.length;
            if (statsHistory) statsHistory.textContent = history.length;
            if (statsWeek) statsWeek.textContent = weekNew;
            if (statsAvg) statsAvg.textContent = avgReading + '篇/天';
        }
    };

    // 将 Stats 暴露到全局
    window.Stats = Stats;

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
        // T40.3 渲染统计信息
        Stats.render();
    });
})();