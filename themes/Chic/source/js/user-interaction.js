/**
 * 用户互动功能 v1.5 done
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
    var READING_TIME_THRESHOLD = 30; // 阅读事件阈值（秒）

    // ==============================
    // GA4 事件追踪
    // ==============================
    function trackEvent(eventName, eventParams) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', eventName, eventParams);
    }

    function trackReading() {
        var pageInfo = getPageInfo();
        trackEvent('read_article', {
            event_category: 'engagement',
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackFavorite(action) {
        var pageInfo = getPageInfo();
        trackEvent('favorite_article', {
            event_category: 'engagement',
            action: action,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackShare(platform) {
        var pageInfo = getPageInfo();
        trackEvent('share_article', {
            event_category: 'engagement',
            method: platform,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackWechatShare() {
        var pageInfo = getPageInfo();
        trackEvent('wechat_share', {
            event_category: 'engagement',
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackDonateClick(method) {
        var pageInfo = getPageInfo();
        trackEvent('donate_click', {
            event_category: 'conversion',
            method: method,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackCommunityClick(location) {
        var pageInfo = getPageInfo();
        trackEvent('community_click', {
            event_category: 'engagement',
            location: location,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    function trackComment(action) {
        var pageInfo = getPageInfo();
        trackEvent('comment_submit', {
            event_category: 'engagement',
            action: action,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    // 勋章解锁事件追踪 (v2.7 Phase 15)
    function trackAchievementUnlock(achievementId, achievementName) {
        var pageInfo = getPageInfo();
        trackEvent('achievement_unlock', {
            event_category: 'engagement',
            achievement_id: achievementId,
            achievement_name: achievementName,
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    // 相关文章点击事件追踪 (v2.7 Phase 15)
    function trackRelatedClick(relatedTitle, relatedUrl) {
        var pageInfo = getPageInfo();
        trackEvent('related_click', {
            event_category: 'engagement',
            related_title: relatedTitle,
            related_url: relatedUrl.substring(0, 100),
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    // 目录跳转事件追踪 (v2.7 Phase 15)
    function trackTocClick(headingId, headingText) {
        var pageInfo = getPageInfo();
        trackEvent('toc_click', {
            event_category: 'navigation',
            heading_id: headingId,
            heading_text: headingText ? headingText.substring(0, 50) : '',
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    // 站内搜索事件追踪 (v2.7 Phase 15)
    function trackSearch(searchTerm, resultCount) {
        trackEvent('search', {
            event_category: 'engagement',
            search_term: searchTerm,
            result_count: resultCount
        });
    }

    // 阅读计时器
    var readingTimer = null;
    function startReadingTimer() {
        if (readingTimer) return;
        readingTimer = setTimeout(function() {
            trackReading();
            readingTimer = null;
        }, READING_TIME_THRESHOLD * 1000);
    }

    // 停止阅读计时器（用户离开时）
    function stopReadingTimer() {
        if (readingTimer) {
            clearTimeout(readingTimer);
            readingTimer = null;
        }
    }

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
                trackFavorite('remove');
            } else {
                this.add(pageInfo);
                bookmarkBtn.classList.add('active');
                bookmarkBtn.setAttribute('title', '已收藏');
                bookmarkIcon.textContent = '♥';
                trackFavorite('add');
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

        // 启动阅读计时器（文章页面）
        if (document.querySelector('.post-content')) {
            startReadingTimer();

            // 用户离开或滚动时停止计时
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    stopReadingTimer();
                } else {
                    startReadingTimer();
                }
            });
        }

        // 分享按钮事件追踪
        var shareButtons = document.querySelectorAll('.share-btn');
        shareButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var platform = btn.classList.contains('twitter') ? 'twitter' :
                               btn.classList.contains('facebook') ? 'facebook' :
                               btn.classList.contains('linkedin') ? 'linkedin' :
                               btn.classList.contains('email') ? 'email' :
                               btn.classList.contains('wechat') ? 'wechat' : 'other';
                trackShare(platform);
            });
        });

        // 微信分享点击追踪（复制链接等场景）
        var wechatShareBtn = document.querySelector('.share-btn.wechat');
        if (wechatShareBtn) {
            wechatShareBtn.addEventListener('click', function() {
                trackWechatShare();
            });
        }

        // 公众号引导模块点击追踪
        var wechatGuideBtn = document.querySelector('.wechat-guide-btn');
        if (wechatGuideBtn) {
            wechatGuideBtn.addEventListener('click', function() {
                trackEvent('wechat_guide_click', {
                    event_category: 'engagement',
                    page_title: getPageInfo().title,
                    page_url: getPageInfo().url
                });
            });
        }

        // 打赏按钮点击追踪
        var sponsorsDetails = document.querySelector('.sponsors-details');
        if (sponsorsDetails) {
            sponsorsDetails.addEventListener('toggle', function() {
                if (sponsorsDetails.hasAttribute('open')) {
                    trackDonateClick('open');
                }
            });
            // 追踪具体的打赏二维码点击
            var sponsorItems = document.querySelectorAll('.sponsor-item');
            sponsorItems.forEach(function(item) {
                item.addEventListener('click', function(e) {
                    var method = item.querySelector('h4');
                    if (method) {
                        trackDonateClick(method.textContent.toLowerCase().includes('wechat') ? 'wechat' : 'alipay');
                    }
                });
            });
        }

        // 底部打赏链接点击追踪
        var footerSponsorsLink = document.querySelector('.footer-link-item[href*="sponsors"]');
        if (footerSponsorsLink) {
            footerSponsorsLink.addEventListener('click', function() {
                trackDonateClick('footer_link');
            });
        }

        // 社群入口点击追踪
        var communityLinks = document.querySelectorAll('.footer-link-item[href*="社群"], .community-link, .zsxq-link');
        communityLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                var location = link.textContent.trim() || 'community';
                trackCommunityClick(location);
            });
        });

        // 知识星球入口点击追踪
        var zsxqLink = document.querySelector('a[href*="zsxq"], a[href*="知识星球"]');
        if (zsxqLink) {
            zsxqLink.addEventListener('click', function() {
                trackCommunityClick('zsxq');
            });
        }

        // 评论事件追踪（监听 utterances iframe）
        var utterancesObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    var utterances = document.querySelector('.utterances');
                    if (utterances && !utterances.hasAttribute('data-comments-tracked')) {
                        utterances.setAttribute('data-comments-tracked', 'true');
                        // 监听评论提交
                        var commentButton = document.querySelector('.utterances-button');
                        if (commentButton) {
                            commentButton.addEventListener('click', function() {
                                trackComment('click');
                            });
                        }
                    }
                }
            });
        });

        var commentsSection = document.querySelector('.post-comments') || document.querySelector('.comments');
        if (commentsSection) {
            utterancesObserver.observe(commentsSection, { childList: true, subtree: true });
        }

        // 相关文章点击事件追踪 (v2.7 Phase 15)
        var relatedLinks = document.querySelectorAll('.related-item a, .related-posts a');
        relatedLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                var title = link.querySelector('.related-post-title') || link;
                trackRelatedClick(
                    title.textContent.trim(),
                    link.getAttribute('href')
                );
            });
        });

        // 目录跳转事件追踪 (v2.7 Phase 15)
        var tocLinks = document.querySelectorAll('.tocbot-list a, .post-toc a');
        tocLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                var headingId = link.getAttribute('href');
                var headingText = link.textContent;
                // 过滤掉功能链接
                if (headingId && headingId.startsWith('#') && headingId.length > 1) {
                    trackTocClick(headingId.substring(1), headingText);
                }
            });
        });

        // 页面导航链接点击追踪
        var navLinks = document.querySelectorAll('.post-nav a');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                trackEvent('post_nav_click', {
                    event_category: 'navigation',
                    nav_type: link.classList.contains('prev') ? 'prev' : 'next',
                    page_title: getPageInfo().title,
                    page_url: getPageInfo().url
                });
            });
        });
    });
})();