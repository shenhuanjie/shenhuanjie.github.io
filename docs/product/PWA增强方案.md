# PWA 能力增强方案

**任务编号：** T46.5
**优先级：** P2
**创建日期：** 2026-05-11
**状态：** ✅ 已完成

---

## 一、PWA 能力概述

### 1.1 PWA 核心特性

| 特性 | 说明 | 用户价值 |
|-----|-----|---------|
| 可安装 | 可添加到主屏幕 | 随时访问 |
| 离线可用 | Service Worker 缓存 | 无网也能看 |
| 推送通知 | Web Push 消息 | 实时触达 |
| 后台同步 | 离线操作同步 | 体验流畅 |
| 性能优化 | 资源缓存 | 秒开页面 |

### 1.2 当前状态

博客目前未实现 PWA 能力，本方案规划：
- 离线缓存支持
- 主屏幕图标
- 推送通知 (可选)
- 安装提示

---

## 二、离线缓存方案

### 2.1 Service Worker 注册

```javascript
// sw-register.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW registered:', registration.scope);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本可用
            showUpdatePrompt();
          }
        });
      });
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}
```

### 2.2 Service Worker 实现

```javascript
// sw.js - Service Worker 文件
const CACHE_NAME = 'blog-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/script.js',
  '/fonts/iconfont.woff2',
  '/images/logo.png',
  '/offline.html'
];

const IMAGE_CACHE_NAME = 'blog-images-v1';
const API_CACHE_NAME = 'blog-api-v1';

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME &&
                          name !== IMAGE_CACHE_NAME &&
                          name !== API_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 实现缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求 - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // 图片请求 - Cache First with Network Update
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithUpdate(request, IMAGE_CACHE_NAME));
    return;
  }

  // 静态资源 - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 页面导航 - Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 默认 - Network Only
  event.respondWith(fetch(request));
});

// 缓存策略函数
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

function isStaticAsset(pathname) {
  return /\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/.test(pathname);
}
```

### 2.3 离线页面

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>离线 - 程序猿视界</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .offline-content {
      max-width: 400px;
    }
    .offline-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #333;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
    .retry-btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: #2d96bd;
      color: white;
      border-radius: 8px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="offline-content">
    <div class="offline-icon">📡</div>
    <h1>当前处于离线状态</h1>
    <p>请检查您的网络连接<br>点击下方按钮重试</p>
    <a href="/" class="retry-btn">重新加载</a>
  </div>
</body>
</html>
```

---

## 三、主屏幕图标方案

### 3.1 Manifest 文件

```json
// public/manifest.json
{
  "name": "程序猿视界",
  "short_name": "程序猿视界",
  "description": "记录在前端、后端、DevOps 与 AI 工具链上的学习、踩坑和实践",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2d96bd",
  "lang": "zh-CN",
  "categories": ["technology", "education"],
  "icons": [
    {
      "src": "/images/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/images/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "搜索文章",
      "short_name": "搜索",
      "url": "/search",
      "icons": [{ "src": "/images/icons/search-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "AI 文章",
      "short_name": "AI",
      "url": "/category/ai",
      "icons": [{ "src": "/images/icons/ai-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

### 3.2 图标生成建议

| 尺寸 | 用途 | 格式 |
|-----|-----|-----|
| 72x72 | iPad mini | PNG |
| 96x96 | Chrome Web Store | PNG |
| 128x128 | Chrome Web Store | PNG |
| 144x144 | Windows Phone | PNG |
| 152x152 | iPad | PNG |
| 192x192 | Android | PNG |
| 384x384 | Android @2x | PNG |
| 512x512 | Play Store | PNG |

图标设计要求：
- 背景色: #2d96bd (主题色)
- 前景色: 白色
- 圆角: 自适应各平台
- 安全区域: 四周保留 20% 边距

### 3.3 Head 标签配置

```html
<!-- PWA 配置 -->
<link rel="manifest" href="/manifest.json">

<!-- 主题色 -->
<meta name="theme-color" content="#2d96bd">

<!-- 苹果图标 -->
<link rel="apple-touch-icon" href="/images/icons/icon-192x192.png">

<!-- 启动画面 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="程序猿视界">

<!-- Windows 磁贴 -->
<meta name="msapplication-TileImage" content="/images/icons/icon-144x144.png">
<meta name="msapplication-TileColor" content="#2d96bd">
```

---

## 四、安装提示组件

### 4.1 安装提示 UI

```html
<!-- PWA 安装提示 -->
<div class="pwa-install-prompt" id="pwa-install-prompt" hidden>
  <div class="prompt-content">
    <div class="prompt-icon">
      <img src="/images/icons/icon-72x72.png" alt="图标" width="48" height="48">
    </div>
    <div class="prompt-info">
      <h3>添加到主屏幕</h3>
      <p>快速访问程序猿视界</p>
    </div>
    <div class="prompt-actions">
      <button class="btn-install" id="btn-install">安装</button>
      <button class="btn-dismiss" id="btn-dismiss">稍后</button>
    </div>
  </div>
</div>
```

### 4.2 安装提示逻辑

```javascript
// pwa-install.js
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // 检查是否已经安装过
  if (!localStorage.getItem('pwa-installed')) {
    showInstallPrompt();
  }
});

function showInstallPrompt() {
  const prompt = document.getElementById('pwa-install-prompt');
  if (prompt) {
    prompt.hidden = false;
    prompt.classList.add('show');
  }
}

function hideInstallPrompt() {
  const prompt = document.getElementById('pwa-install-prompt');
  if (prompt) {
    prompt.classList.remove('show');
    setTimeout(() => prompt.hidden = true, 300);
  }
}

async function installPWA() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    localStorage.setItem('pwa-installed', 'true');
  }

  deferredPrompt = null;
  hideInstallPrompt();
}

// 事件绑定
document.getElementById('btn-install')?.addEventListener('click', installPWA);
document.getElementById('btn-dismiss')?.addEventListener('click', () => {
  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  hideInstallPrompt();
});

// 应用已安装
window.addEventListener('appinstalled', () => {
  localStorage.setItem('pwa-installed', 'true');
  deferredPrompt = null;
  hideInstallPrompt();
});
```

### 4.3 安装提示样式

```stylus
.pwa-install-prompt
  position: fixed
  bottom: 70px
  left: 16px
  right: 16px
  background: $light-background-color
  border-radius: 12px
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15)
  padding: 16px
  z-index: 1000
  transform: translateY(100px)
  opacity: 0
  transition: transform 0.3s, opacity 0.3s

  &.show
    transform: translateY(0)
    opacity: 1

  .dark-theme &
    background: $dark-background-color
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3)

.prompt-content
  display: flex
  align-items: center
  gap: 12px

.prompt-icon img
  border-radius: 10px

.prompt-info
  flex: 1

  h3
    margin: 0
    font-size: 16px
    font-weight: 600

  p
    margin: 4px 0 0
    font-size: 13px
    color: $light-font-secondary-color

.prompt-actions
  display: flex
  gap: 8px

  button
    padding: 8px 16px
    border-radius: 6px
    border: none
    font-size: 14px
    cursor: pointer

  .btn-install
    background: #2d96bd
    color: white

  .btn-dismiss
    background: #f0f0f0
    color: #666

    .dark-theme &
      background: #2a2a2a
      color: #aaa
```

---

## 五、推送通知方案 (可选)

### 5.1 推送通知配置

```javascript
// push-notification.js

// 检查通知权限
function checkNotificationPermission() {
  return Notification.permission;
}

// 请求通知权限
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// 订阅推送
async function subscribeToPush() {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // 发送订阅信息到服务器
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

// 处理推送消息
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: '查看' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

function urlBase64ToUint8Array(base64String) {
  // VAPID 公钥转换
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

---

## 六、Hexo 集成

### 6.1 安装 hexo-offline 插件

```bash
npm install hexo-offline --save
```

### 6.2 Hexo 配置

```yaml
# _config.yml

# Service Worker 配置
offline:
  enable: true
  cacheName: blog-v1
  staticPasses:
    - /
    - /archives
    - /category
  # 忽略的路由
  routes:
    - /api/
    - /search/
  # 预缓存文件
  precache:
    - css/style.css
    - js/script.js
    - js/lazyload.js
    - js/tocbot.min.js
    - fonts/iconfont.woff2
    - images/logo.png
    - offline.html
```

### 6.3 主题集成

```ejs
<!-- layout.ejs -->
<!-- 在 </body> 前添加 -->
<% if (theme.pwa && theme.pwa.enable) { %>
  <link rel="manifest" href="<%= theme.pwa.manifest_url || '/manifest.json' %>">
  <meta name="theme-color" content="<%= theme.pwa.theme_color || '#2d96bd' %>">
  <link rel="apple-touch-icon" href="<%= theme.pwa.icon_path || '/images/icons/icon-192x192.png' %>">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(function(registration) {
            console.log('SW registered:', registration.scope);
          })
          .catch(function(error) {
            console.log('SW registration failed:', error);
          });
      });
    }
  </script>
<% } %>
```

---

## 七、部署检查清单

### 基础功能
- [ ] Service Worker 已注册
- [ ] 离线缓存策略已实现
- [ ] 离线页面已创建
- [ ] Manifest 文件已配置
- [ ] 主屏幕图标已生成

### 安装体验
- [ ] 安装提示组件已实现
- [ ] 安装按钮功能正常
- [ ] 已安装检测已实现

### 可选功能
- [ ] 推送通知已配置
- [ ] 订阅功能已实现
- [ ] 通知点击处理已实现

### 测试
- [ ] 离线模式测试通过
- [ ] 安装提示测试通过
- [ ] 图标显示测试通过
- [ ] Lighthouse PWA 分数 > 80

---

## 八、预期效果

| 指标 | 当前值 | 目标值 |
|-----|-------|-------|
| PWA 评分 | 0 | > 80 |
| 离线可用性 | 无 | 完全支持 |
| 安装提示 | 无 | 自动弹出 |
| 启动画面 | 无 | 品牌化 |
| Lighthouse | N/A | > 90 |

---

**执行记录：**
- 2026-05-11: 创建 PWA 增强方案文档