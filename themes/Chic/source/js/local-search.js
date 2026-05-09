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


(function () {
  function getText(value) {
    if (Array.isArray(value)) {
      return value.map(getText).join(' ');
    }

    if (value && typeof value === 'object') {
      return Object.keys(value).map(function (key) {
        return getText(value[key]);
      }).join(' ');
    }

    return value == null ? '' : String(value);
  }

  function stripHtml(value) {
    return getText(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function normalize(value) {
    return stripHtml(value).toLowerCase();
  }

  function normalizeUrl(value) {
    var url = getText(value) || '#';

    if (url.indexOf('//post/') === 0) {
      return url.slice(1);
    }

    return url;
  }

  function getExcerpt(content, keyword) {
    var plain = stripHtml(content);
    var lower = plain.toLowerCase();
    var index = keyword ? lower.indexOf(keyword) : -1;
    var start = index > 40 ? index - 40 : 0;
    var excerpt = plain.slice(start, start + 160);

    if (start > 0) {
      excerpt = '...' + excerpt;
    }

    if (plain.length > start + 160) {
      excerpt += '...';
    }

    return excerpt;
  }

  function highlightKeyword(text, keyword) {
    if (!keyword || !text) return text;
    var regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function renderResults(results, keyword) {
    var container = document.getElementById('local-search-results');
    var status = document.getElementById('local-search-status');

    if (!keyword) {
      status.textContent = '输入关键词开始搜索。';
      container.innerHTML = '';
      return;
    }

    // 搜索事件追踪 (v2.7 Phase 15)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'search', {
        search_term: keyword,
        result_count: results.length
      });
    }

    // 记录搜索到统计分析
    if (window.searchAnalytics) {
      window.searchAnalytics.recordSearch(keyword, results.length);
    }

    if (!results.length) {
      status.textContent = '没有找到匹配的文章。';
      container.innerHTML = '';
      return;
    }

    status.textContent = '找到 ' + results.length + ' 篇相关文章。';
    container.innerHTML = results.map(function (post) {
      var title = escapeHtml(post.title || 'Untitled');
      var url = normalizeUrl(post.url);
      var excerpt = escapeHtml(getExcerpt(post.content || post.title || '', keyword));

      // Highlight keyword in title and excerpt
      title = highlightKeyword(title, keyword);
      excerpt = highlightKeyword(excerpt, keyword);

      return [
        '<article class="local-search-item">',
        '<h3><a href="' + escapeHtml(url) + '">' + title + '</a></h3>',
        excerpt ? '<p>' + excerpt + '</p>' : '',
        '</article>'
      ].join('');
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('local-search-input');
    var status = document.getElementById('local-search-status');

    if (!input || !status) {
      return;
    }

    status.textContent = '正在加载搜索索引...';

    // Keyboard shortcut: press "/" to focus search
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });

    fetch('/search.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Search index request failed.');
        }

        return response.json();
      })
      .then(function (posts) {
        var data = Array.isArray(posts) ? posts : [];

        status.textContent = '输入关键词开始搜索。';
        input.addEventListener('input', function () {
          var keyword = input.value.trim().toLowerCase();

          if (!keyword) {
            renderResults([], '');
            return;
          }

          var results = data.filter(function (post) {
            var haystack = [
              normalize(post.title),
              normalize(post.content),
              normalize(post.tags),
              normalize(post.categories)
            ].join(' ');

            return haystack.indexOf(keyword) !== -1;
          }).slice(0, 30);

          renderResults(results, keyword);
        });
      })
      .catch(function () {
        status.textContent = '搜索索引加载失败，请稍后重试。';
      });
  });

  // ==============================
  // 搜索建议功能 (Phase 26: T26.1)
  // ==============================

  // 搜索建议数据结构
  var suggestionsCache = null;
  var activeSuggestionIndex = -1;

  /**
   * 加载搜索建议数据
   */
  function loadSuggestionsData() {
    if (suggestionsCache) return Promise.resolve(suggestionsCache);

    return fetch('/search.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load suggestions data');
        return response.json();
      })
      .then(function(posts) {
        // 从文章中提取建议词
        var suggestionsMap = {};

        posts.forEach(function(post) {
          // 从标题提取
          if (post.title) {
            var words = extractChineseWords(post.title);
            words.forEach(function(word) {
              if (word.length >= 2) {
                if (!suggestionsMap[word] || suggestionsMap[word].type !== 'tag') {
                  suggestionsMap[word] = { type: 'title', count: 1 };
                } else {
                  suggestionsMap[word].count++;
                }
              }
            });
          }

          // 从标签提取
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(function(tag) {
              if (tag && typeof tag === 'string') {
                var cleanTag = tag.trim();
                if (cleanTag) {
                  suggestionsMap[cleanTag] = { type: 'tag', count: suggestionsMap[cleanTag] ? suggestionsMap[cleanTag].count + 1 : 1 };
                }
              }
            });
          }

          // 从分类提取
          if (post.categories && Array.isArray(post.categories)) {
            post.categories.forEach(function(cat) {
              if (cat && typeof cat === 'string') {
                var cleanCat = cat.trim();
                if (cleanCat) {
                  suggestionsMap[cleanCat] = { type: 'category', count: suggestionsMap[cleanCat] ? suggestionsMap[cleanCat].count + 1 : 1 };
                }
              }
            });
          }
        });

        // 转换为数组并排序
        suggestionsCache = Object.entries(suggestionsMap)
          .map(function(entry) {
            return { keyword: entry[0], type: entry[1].type, count: entry[1].count };
          })
          .sort(function(a, b) {
            var typeOrder = { tag: 0, category: 1, title: 2 };
            var typeDiff = typeOrder[a.type] - typeOrder[b.type];
            if (typeDiff !== 0) return typeDiff;
            return b.count - a.count;
          });

        return suggestionsCache;
      })
      .catch(function() {
        suggestionsCache = [];
        return suggestionsCache;
      });
  }

  /**
   * 提取中文字符和英文单词
   */
  function extractChineseWords(text) {
    var words = [];
    // 连续中文字符
    var chinesePattern = /[一-龥]{2,}/g;
    var match;
    while ((match = chinesePattern.exec(text)) !== null) {
      words.push(match[0]);
    }
    // 英文和数字
    var englishPattern = /[a-zA-Z0-9]+/g;
    while ((match = englishPattern.exec(text)) !== null) {
      if (match[0].length >= 2) {
        words.push(match[0]);
      }
    }
    return words;
  }

  /**
   * 过滤匹配的建议
   */
  function filterSuggestions(query, maxResults) {
    if (!suggestionsCache || !query) return [];

    var q = query.toLowerCase();
    return suggestionsCache
      .filter(function(item) {
        return item.keyword.toLowerCase().includes(q);
      })
      .slice(0, maxResults);
  }

  /**
   * 创建建议下拉框
   */
  function createSuggestionsUI(container) {
    var ui = document.createElement('div');
    ui.className = 'search-suggestions';
    ui.style.display = 'none';
    ui.innerHTML = '<div class="search-suggestions-empty">加载中...</div>';
    return ui;
  }

  /**
   * 渲染建议列表
   */
  function renderSuggestions(items, input) {
    var container = document.getElementById('search-suggestions-container');
    if (!container) return;

    var ui = container.querySelector('.search-suggestions');
    if (!ui) return;

    activeSuggestionIndex = -1;

    if (items.length === 0) {
      ui.innerHTML = '<div class="search-suggestions-empty">没有找到建议</div>';
      ui.style.display = 'block';
      return;
    }

    ui.innerHTML = items.map(function(item, index) {
      return '<div class="search-suggestions-item" data-index="' + index + '" data-keyword="' + item.keyword + '">' +
        '<span class="search-suggestions-item-type ' + item.type + '">' + getTypeLabel(item.type) + '</span>' +
        '<span class="search-suggestions-item-keyword">' + escapeHtml(item.keyword) + '</span>' +
        '<span class="search-suggestions-item-count">' + item.count + '篇</span>' +
        '</div>';
    }).join('') +

    '<div class="search-suggestions-footer">' +
    '<kbd>↑</kbd><kbd>↓</kbd> 选择 &nbsp; <kbd>Enter</kbd> 搜索 &nbsp; <kbd>Esc</kbd> 关闭' +
    '</div>';

    ui.style.display = 'block';

    // 绑定点击事件
    ui.querySelectorAll('.search-suggestions-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var keyword = this.dataset.keyword;
        input.value = keyword;
        ui.style.display = 'none';
        input.focus();
        // 触发搜索
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  /**
   * 获取类型标签
   */
  function getTypeLabel(type) {
    var labels = { tag: '标签', category: '分类', title: '标题' };
    return labels[type] || type;
  }

  /**
   * 转义 HTML
   */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 键盘导航处理
   */
  function handleSuggestionNavigation(e, input, items) {
    var container = document.getElementById('search-suggestions-container');
    if (!container) return;

    var ui = container.querySelector('.search-suggestions');
    if (!ui || ui.style.display === 'none') return;

    var itemEls = ui.querySelectorAll('.search-suggestions-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
      updateActiveSuggestion(itemEls, activeSuggestionIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
      updateActiveSuggestion(itemEls, activeSuggestionIndex);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
        e.preventDefault();
        input.value = items[activeSuggestionIndex].keyword;
        ui.style.display = 'none';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (e.key === 'Escape') {
      ui.style.display = 'none';
      activeSuggestionIndex = -1;
    }
  }

  /**
   * 更新选中状态
   */
  function updateActiveSuggestion(itemEls, activeIndex) {
    itemEls.forEach(function(el, i) {
      if (i === activeIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  // 防抖函数
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ==============================
  // 初始化搜索建议
  // ==============================
  document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('local-search-input');
    var status = document.getElementById('local-search-status');

    if (!input || !status) {
      return;
    }

    // 创建建议容器
    var suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'search-suggestions-container';
    input.parentNode.appendChild(suggestionsContainer);
    suggestionsContainer.appendChild(createSuggestionsUI(suggestionsContainer));

    // 预加载建议数据
    loadSuggestionsData();

    // 键盘导航
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        loadSuggestionsData().then(function() {
          var items = filterSuggestions(input.value.trim(), 8);
          handleSuggestionNavigation(e, input, items);
        });
      }
    });

    // 输入时显示建议
    var showSuggestions = debounce(function() {
      var query = input.value.trim();
      if (query.length < 1) {
        var container = document.getElementById('search-suggestions-container');
        if (container) {
          var ui = container.querySelector('.search-suggestions');
          if (ui) ui.style.display = 'none';
        }
        return;
      }

      loadSuggestionsData().then(function() {
        var items = filterSuggestions(query, 8);
        renderSuggestions(items, input);
      });
    }, 150);

    input.addEventListener('input', showSuggestions);

    // 点击其他地方关闭建议
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        var ui = suggestionsContainer.querySelector('.search-suggestions');
        if (ui) ui.style.display = 'none';
      }
    });
  });
})();