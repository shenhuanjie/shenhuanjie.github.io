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
})();