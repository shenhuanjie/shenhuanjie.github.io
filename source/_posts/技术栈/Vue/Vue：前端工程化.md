---
title: Vue：前端工程化
date: 2024-01-22 18:09:00
category: 技术栈
tags: Vue
---

Vue.js 3 组件化，涉及到了 SCF 开发模式。默认情况下，不能直接使用单文件组件来编写组件，因为浏览器不认识 SFC（.vue）文件。因此，我们需要使用 webpack 或者 Vite 构建一个支持 SFC 开发的 Vue.js 3环境。目前，webpack 被广泛使用，但使用 Vite 的人也越来越多了。无论是使用 webpack 还是 Vite 构建，都属于前端工程化。

前端快速发展史

无论是专业的开发者，还是刚刚接触前端的初学者，都能深刻感受到 Web 前端发展之快。而对于专业的开发者来说，体会更加深刻。

- 从后端渲染的 JSP、PHP 到原生 JavaScript、JQuery，再到目前主流的 Vue.js 3、React、Angular 框架。
- 从原来 ES5 语法到 ES6、7、8、9、10，再到 TypeScript，以及从简单的 CSS 到预处理器 Less、Scss等。

简单概述一下前端发展的几个阶段。

- Web 早期：也就是互联网发展早期，前端开发人员只负责写静态页面，纯粹地展示功能，JavaScript 的作用只体现在一些表单的验证和增加特效上。当然，为了在页面中动态填充一些数据，相继出现了 JSP、ASP、PHP 等开发模式。