---
title: Vue 与前端工程化
date: 2024-01-22 18:09:00
category: Vue
tags: 
- Vue
- 前端工程化
- TypeScript
- Webpack
- Vite
- SFC
- CLI
- AJAX
---

Vue.js 3 组件化，涉及到了 SCF 开发模式。默认情况下，不能直接使用单文件组件来编写组件，因为浏览器不认识 SFC（.vue）文件。因此，我们需要使用 webpack 或者 Vite 构建一个支持 SFC 开发的 Vue.js 3环境。目前，webpack 被广泛使用，但使用 Vite 的人也越来越多了。无论是使用 webpack 还是 Vite 构建，都属于前端工程化。

## 前端快速发展史
无论是专业的开发者，还是刚刚接触前端的初学者，都能深刻感受到 Web 前端发展之快。而对于专业的开发者来说，体会更加深刻。

* 从后端渲染的 JSP、PHP 到原生 JavaScript、JQuery，再到目前主流的 Vue.js 3、React、Angular 框架。
* 从原来 ES5 语法到 ES6、7、8、9、10，再到 TypeScript，以及从简单的 CSS 到预处理器 Less、Scss等。

简单概述一下前端发展的几个阶段。

* Web 早期：也就是互联网发展早期，前端开发人员只负责写静态页面，纯粹地展示功能，JavaScript 的作用只体现在一些表单的验证和增加特效上。当然，为了在页面中动态填充一些数据，相继出现了 JSP、ASP、PHP 等开发模式。
* Web 近期：随着 AJAX 技术的诞生，前端不仅可以展示页面，也可以管理数据，以及和用户进行互动。随着与用户交互、数据交互的需求增多，jQuery 这样优秀的前端工具库开始大放异彩。
* 现代 Web：现代 Web 前端开发更加多样化和复杂化。比如，多样化的前端至此开发 PC Web 页面、小程序、公众号和 App。然而在开发模式上，也面临一系列复杂性的问题。

现代 Web 前端开发目前面临一系列的复杂性问题，列举如下。

* 项目需要通过模块化的方式进行开发。
* 项目需要使用一些高级特性，从而加快开发效率或安全性，比如使用 ES6+、TypeScript 开发脚本逻辑，使用 Sass、Less 等编写 CSS 样式。
* 项目开发过程中需要提供本地服务，能实时监听文件变化并反映到浏览器上，提高开发效率。
* 项目打包部署时，需要对代码进行压缩、合并及其他相关的优化。

大部分的 Vue.js 3、React、Angular 开发者并不会遇到上述问题，因为大部分的人是借助对应框架提供的脚手架（CLI）来创建工程化项目的。例如，Vue CLI、create-react-app、Angular CLI 等脚手架默认已经帮助我们解决了上述问题，它们本质上也是基于 webpack 构建工具实现的。然而，这些通过脚手架创建的项目通常被称为前端工程化项目。

