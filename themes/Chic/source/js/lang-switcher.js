/**
 * Language Switcher for Internationalization (i18n)
 * Handles switching between Chinese (zh) and English (en) content
 */

(function() {
  'use strict';

  // Get current path and language
  var currentPath = window.location.pathname;
  var currentLang = document.documentElement.lang || 'zh';

  // Language switcher elements
  var langSwitch = document.getElementById('lang-switch');

  // Determine the other language and target URL
  function getLanguageSwitchTarget() {
    var isEnglish = currentPath.indexOf('/en/') === 0 || currentPath.endsWith('/en') || currentPath === '/en';

    if (isEnglish) {
      // Switch to Chinese: remove /en prefix
      var zhPath = currentPath.replace(/^\/en/, '');
      zhPath = zhPath === '' ? '/' : zhPath;
      return {
        lang: 'zh',
        label: '中文',
        url: zhPath || '/'
      };
    } else {
      // Switch to English: add /en prefix
      var enPath = '/en' + (currentPath === '/' ? '' : currentPath);
      return {
        lang: 'en',
        label: 'EN',
        url: enPath
      };
    }
  }

  // Update language switcher button
  function updateLanguageSwitcher() {
    if (!langSwitch) return;

    var target = getLanguageSwitchTarget();

    if (currentLang === 'en') {
      langSwitch.textContent = '中文';
      langSwitch.title = 'Switch to Chinese';
    } else {
      langSwitch.textContent = 'EN';
      langSwitch.title = 'Switch to English';
    }
  }

  // Handle language switch click
  function handleLanguageSwitch(e) {
    e.preventDefault();
    var target = getLanguageSwitchTarget();
    window.location.href = target.url;
  }

  // Initialize
  function init() {
    updateLanguageSwitcher();

    if (langSwitch) {
      langSwitch.addEventListener('click', handleLanguageSwitch);
    }

    // Also handle mobile menu language switch
    var mobileLangSwitch = document.querySelector('.navbar-mobile .lang-switch');
    if (mobileLangSwitch) {
      mobileLangSwitch.addEventListener('click', handleLanguageSwitch);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
