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

    // T40.4 赞同/反对快速反应事件追踪
    function trackReaction(reactionType) {
        var pageInfo = getPageInfo();
        trackEvent('article_reaction', {
            event_category: 'engagement',
            reaction_type: reactionType, // like, dislike
            page_title: pageInfo.title,
            page_url: pageInfo.url
        });
    }

    // ==============================
    // 敏感词检查功能 (v2.10)
    // ==============================
    var sensitiveWords = [
        'spam', 'advertisement', 'advertising', 'buy now', 'click here',
        'free money', 'casino', 'viagra', 'lottery', 'xxx', 'porn',
        '成人内容', '赌博', '诈骗'
    ];

    function checkSensitiveContent(text) {
        if (!text) return { passed: true, foundWords: [] };
        var lower = text.toLowerCase();
        var foundWords = [];
        for (var i = 0; i < sensitiveWords.length; i++) {
            if (lower.indexOf(sensitiveWords[i].toLowerCase()) !== -1) {
                foundWords.push(sensitiveWords[i]);
            }
        }
        return {
            passed: foundWords.length === 0,
            foundWords: foundWords
        };
    }

    function showSensitiveWarning(foundWords) {
        var notice = document.querySelector('.comments-moderation-notice');
        if (notice) {
            notice.classList.add('warning');
            notice.innerHTML = '<svg class="icon-warning" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>提示：评论内容可能包含敏感词 (' + foundWords.join(', ') + ')，提交后需经审核</span>';
        }
    }

    function resetModerationNotice() {
        var notice = document.querySelector('.comments-moderation-notice');
        if (notice) {
            notice.classList.remove('warning');
            notice.innerHTML = '<svg class="icon-info" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg><span>所有评论需经审核后公开，请勿提交敏感信息</span>';
        }
    }

    function initSensitiveWordCheck() {
        // Utterances 使用 iframe，直接监听 textarea 比较困难
        // 这里提供一个全局检查接口，供控制台调用
        window.checkCommentSensitive = function(text) {
            var result = checkSensitiveContent(text);
            if (!result.passed) {
                console.warn('评论可能包含敏感词:', result.foundWords);
                showSensitiveWarning(result.foundWords);
            } else {
                resetModerationNotice();
            }
            return result;
        };
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

    // ==============================
    // 滚动深度追踪 (T24.1 Phase 24)
    // ==============================
    var ScrollTracker = {
        scrollMilestones: [50, 75, 100], // 滚动里程碑
        trackedMilestones: {}, // 已追踪的里程碑
        maxScrollDepth: 0, // 最大滚动深度

        init: function() {
            var pageInfo = getPageInfo();
            var pageKey = pageInfo.url;
            // 每次访问重置里程碑追踪状态
            this.trackedMilestones = {};
            this.maxScrollDepth = 0;

            // 监听滚动事件
            window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        },

        handleScroll: function() {
            var scrollPercent = this.calculateScrollPercent();
            if (scrollPercent > this.maxScrollDepth) {
                this.maxScrollDepth = scrollPercent;
            }

            var self = this;
            this.scrollMilestones.forEach(function(milestone) {
                if (scrollPercent >= milestone && !self.trackedMilestones[milestone]) {
                    self.trackedMilestones[milestone] = true;
                    self.trackScrollDepth(milestone);
                }
            });
        },

        calculateScrollPercent: function() {
            var windowHeight = window.innerHeight;
            var documentHeight = document.documentElement.scrollHeight - windowHeight;
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (documentHeight <= 0) return 0;
            return Math.round((scrollTop / documentHeight) * 100);
        },

        trackScrollDepth: function(depthPercent) {
            var pageInfo = getPageInfo();
            trackEvent('scroll_depth', {
                event_category: 'engagement',
                depth_percent: depthPercent,
                page_title: pageInfo.title,
                page_url: pageInfo.url
            });
        },

        // 获取最终滚动深度（用于页面离开时）
        getMaxScrollDepth: function() {
            return this.maxScrollDepth;
        }
    };

    // ==============================
    // 阅读时长追踪 (T24.2 Phase 24)
    // ==============================
    var ReadingTimeTracker = {
        startTime: null,
        totalTime: 0,
        isVisible: true,
        timer: null,

        init: function() {
            this.startTime = Date.now();

            // 监听页面可见性变化
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

            // 监听页面离开
            window.addEventListener('beforeunload', this.handlePageLeave.bind(this));

            // 定期检查阅读状态（每30秒）
            this.timer = setInterval(this.checkReadingStatus.bind(this), 30000);
        },

        handleVisibilityChange: function() {
            if (document.hidden) {
                this.isVisible = false;
                this.pauseTracking();
            } else {
                this.isVisible = true;
                this.resumeTracking();
            }
        },

        handlePageLeave: function() {
            this.trackReadingTime(true);
        },

        pauseTracking: function() {
            if (this.startTime) {
                this.totalTime += Date.now() - this.startTime;
                this.startTime = null;
            }
        },

        resumeTracking: function() {
            if (!this.startTime) {
                this.startTime = Date.now();
            }
        },

        checkReadingStatus: function() {
            if (this.isVisible && ScrollTracker.getMaxScrollDepth() >= 50) {
                this.trackReadingTime(false);
            }
        },

        getReadingTime: function() {
            var currentTime = this.startTime ? Date.now() - this.startTime : 0;
            return Math.round((this.totalTime + currentTime) / 1000); // 返回秒数
        },

        trackReadingTime: function(isPageLeave) {
            var readingTimeSeconds = this.getReadingTime();
            if (readingTimeSeconds < 5) return; // 少于5秒不追踪

            var pageInfo = getPageInfo();
            trackEvent('reading_time', {
                event_category: 'engagement',
                reading_seconds: readingTimeSeconds,
                max_scroll_depth: ScrollTracker.getMaxScrollDepth(),
                is_page_leave: isPageLeave,
                page_title: pageInfo.title,
                page_url: pageInfo.url
            });
        }
    };

    // ==============================
    // 回访用户标记 (T24.2 Phase 24)
    // ==============================
    var ReturnVisitorTracker = {
        STORAGE_KEY: 'blog_visitor_info',
        VISIT_TIMEOUT: 30 * 60 * 1000, // 30分钟内的访问视为同一会话

        init: function() {
            this.trackVisit();
        },

        getVisitorInfo: function() {
            try {
                var data = localStorage.getItem(this.STORAGE_KEY);
                return data ? JSON.parse(data) : { firstVisit: null, lastVisit: null, visitCount: 0 };
            } catch (e) {
                return { firstVisit: null, lastVisit: null, visitCount: 0 };
            }
        },

        saveVisitorInfo: function(info) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(info));
            } catch (e) {
                console.warn('LocalStorage write error:', e);
            }
        },

        trackVisit: function() {
            var now = Date.now();
            var info = this.getVisitorInfo();
            var isReturnVisitor = false;
            var daysSinceLastVisit = null;

            if (info.lastVisit) {
                var timeDiff = now - info.lastVisit;
                // 如果距离上次访问超过30分钟，视为回访
                if (timeDiff > this.VISIT_TIMEOUT) {
                    isReturnVisitor = true;
                    daysSinceLastVisit = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
                }
            }

            // 更新访问信息
            if (!info.firstVisit) {
                info.firstVisit = now;
            }
            info.lastVisit = now;
            info.visitCount = (info.visitCount || 0) + 1;

            this.saveVisitorInfo(info);

            // 发送回访事件
            if (isReturnVisitor) {
                this.trackReturnVisit(daysSinceLastVisit);
            }

            // 追踪新访客
            if (info.visitCount === 1) {
                this.trackNewVisitor();
            }
        },

        trackNewVisitor: function() {
            trackEvent('new_visitor', {
                event_category: 'session',
                visit_count: 1
            });
        },

        trackReturnVisit: function(daysSinceLastVisit) {
            var pageInfo = getPageInfo();
            trackEvent('return_visitor', {
                event_category: 'session',
                days_since_last_visit: daysSinceLastVisit,
                page_title: pageInfo.title,
                page_url: pageInfo.url
            });
        }
    };

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

        // 文章页面：启用滚动深度追踪、阅读时长追踪、回访标记 (Phase 24 T24.1/T24.2)
        if (document.querySelector('.post-content')) {
            // 滚动深度追踪
            ScrollTracker.init();

            // 阅读时长追踪
            ReadingTimeTracker.init();

            // 回访用户追踪
            ReturnVisitorTracker.init();

            // 启动阅读计时器
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

        // T40.1 赞同/反对快速反应按钮事件
        var reactionButtons = document.querySelectorAll('.reaction-btn');
        reactionButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var reactionType = btn.getAttribute('data-reaction');
                trackReaction(reactionType);

                // 更新本地状态（使用 localStorage 存储反应数据）
                var pageInfo = getPageInfo();
                var storageKey = 'blog_reactions_' + pageInfo.url;
                try {
                    var reactions = JSON.parse(localStorage.getItem(storageKey) || '{}');
                    // 如果之前点过这个按钮，取消它
                    if (reactions[reactionType]) {
                        reactions[reactionType] = false;
                        btn.classList.remove('active');
                    } else {
                        // 取消另一种反应
                        var otherType = reactionType === 'like' ? 'dislike' : 'like';
                        reactions[otherType] = false;
                        reactions[reactionType] = true;
                        btn.classList.add('active');
                        // 移除另一个按钮的 active 状态
                        var otherBtn = document.querySelector('.reaction-' + otherType);
                        if (otherBtn) otherBtn.classList.remove('active');
                    }
                    localStorage.setItem(storageKey, JSON.stringify(reactions));
                } catch (e) {
                    console.warn('LocalStorage reaction error:', e);
                }
            });

            // 初始化按钮状态
            var pageInfo = getPageInfo();
            var storageKey = 'blog_reactions_' + pageInfo.url;
            try {
                var reactions = JSON.parse(localStorage.getItem(storageKey) || '{}');
                var reactionType = btn.getAttribute('data-reaction');
                if (reactions[reactionType]) {
                    btn.classList.add('active');
                }
            } catch (e) {}
        });

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
                        // 初始化敏感词检查（针对 Utterances 的 textarea）
                        initSensitiveWordCheck();
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