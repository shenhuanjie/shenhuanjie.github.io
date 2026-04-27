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

  function renderResults(results, keyword) {
    var container = document.getElementById('local-search-results');
    var status = document.getElementById('local-search-status');

    if (!keyword) {
      status.textContent = '输入关键词开始搜索。';
      container.innerHTML = '';
      return;
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
