---
title: Vue：快速上手
date: 2024-01-23 07:45:16
category:
  - Vue
tags:
  - Vue
---
## 线上尝试 Vue [​](https://cn.vuejs.org/guide/quick-start.html#try-vue-online)
* 想要快速体验 Vue，你可以直接试试我们的[演练场](https://play.vuejs.org/#eNo9jcEKwjAMhl/lt5fpQYfXUQfefAMvvRQbddC1pUuHUPrudg4HIcmXjyRZXEM4zYlEJ+T0iEPgXjn6BB8Zhp46WUZWDjCa9f6w9kAkTtH9CRinV4fmRtZ63H20Ztesqiylphqy3R5UYBqD1UyVAPk+9zkvV1CKbCv9poMLiTEfR2/IXpSoXomqZLtti/IFwVtA9A==)。
* 如果你更喜欢不用任何构建的原始 HTML，可以使用 [JSFiddle](https://jsfiddle.net/yyx990803/2ke1ab0z/) 入门。
* 如果你已经比较熟悉 Node.js 和构建工具等概念，还可以直接在浏览器中打开 [StackBlitz](https://vite.new/vue) 来尝试完整的构建设置。

## 创建一个 Vue 应用
前提条件

* 熟悉命令行
* 已安装 18.0 或更高版本的 [Node.js](https://nodejs.org/)

在本节中，我们将介绍如何在本地搭建 Vue [单页应用](https://cn.vuejs.org/guide/extras/ways-of-using-vue.html#single-page-application-spa)。创建的项目将使用基于 [Vite](https://vitejs.dev) 的构建设置，并允许我们使用 Vue 的[单文件组件](https://cn.vuejs.org/guide/scaling-up/sfc.html) (SFC)。

确保你安装了最新版本的 [Node.js](https://nodejs.org/)，并且你的当前工作目录正是打算创建项目的目录。在命令行中运行以下命令 (不要带上 `$` 符号)：

```bash
npm create vue@latest
```
这一指令将会安装并执行 [create-vue](https://github.com/vuejs/create-vue)，它是 Vue 官方的项目脚手架工具。你将会看到一些诸如 TypeScript 和测试支持之类的可选功能提示：

```bash
✔ Project name: … <your-project-name>
✔ Add TypeScript? … No / Yes
✔ Add JSX Support? … No / Yes
✔ Add Vue Router for Single Page Application development? … No / Yes
✔ Add Pinia for state management? … No / Yes
✔ Add Vitest for Unit testing? … No / Yes
✔ Add an End-to-End Testing Solution? … No / Cypress / Playwright
✔ Add ESLint for code quality? … No / Yes
✔ Add Prettier for code formatting? … No / Yes

Scaffolding project in ./<your-project-name>...
Done.
```
如果不确定是否要开启某个功能，你可以直接按下回车键选择 `No`。在项目被创建后，通过以下步骤安装依赖并启动开发服务器：

```bash
$ cd <your-project-name>
$ npm install
$ npm run dev
```
你现在应该已经运行起来了你的第一个 Vue 项目！请注意，生成的项目中的示例组件使用的是[组合式 API](https://cn.vuejs.org/guide/introduction.html#composition-api) 和 `<script setup>`，而非[选项式 API](https://cn.vuejs.org/guide/introduction.html#options-api)。下面是一些补充提示：

* 推荐的 IDE 配置是 [Visual Studio Code](https://code.visualstudio.com/) + [Volar 扩展](https://marketplace.visualstudio.com/items?itemName=Vue.volar)。如果使用其他编辑器，参考 [IDE 支持章节](https://cn.vuejs.org/guide/scaling-up/tooling.html#ide-support)。
* 更多工具细节，包括与后端框架的整合，我们会在[工具链指南](https://cn.vuejs.org/guide/scaling-up/tooling.html)进行讨论。
* 要了解构建工具 Vite 更多背后的细节，请查看 [Vite 文档](https://cn.vitejs.dev)。
* 如果你选择使用 TypeScript，请阅读 [TypeScript 使用指南](https://cn.vuejs.org/guide/typescript/overview.html)。

当你准备将应用发布到生产环境时，请运行：

```bash
$ npm run build
```
此命令会在 `./dist` 文件夹中为你的应用创建一个生产环境的构建版本。关于将应用上线生产环境的更多内容，请阅读[生产环境部署指南](https://cn.vuejs.org/guide/best-practices/production-deployment.html)。

## 通过 CDN 使用 Vue [​](https://cn.vuejs.org/guide/quick-start.html#using-vue-from-cdn)
你可以借助 script 标签直接通过 CDN 来使用 Vue：

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```
这里我们使用了 [unpkg](https://unpkg.com/)，但你也可以使用任何提供 npm 包服务的 CDN，例如 [jsdelivr](https://www.jsdelivr.com/package/npm/vue) 或 [cdnjs](https://cdnjs.com/libraries/vue)。当然，你也可以下载此文件并自行提供服务。

通过 CDN 使用 Vue 时，不涉及“构建步骤”。这使得设置更加简单，并且可以用于增强静态的 HTML 或与后端框架集成。但是，你将无法使用单文件组件 (SFC) 语法。

### 使用全局构建版本 [​](https://cn.vuejs.org/guide/quick-start.html#using-the-global-build)
上面的链接使用了\_全局构建版本\_的 Vue，该版本的所有顶层 API 都以属性的形式暴露在了全局的 `Vue` 对象上。这里有一个使用全局构建版本的例子：

```javascript
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">{{ message }}</div>

<script>
  const { createApp, ref } = Vue

  createApp({
    setup() {
      const message = ref('Hello vue!')
      return {
        message
      }
    }
  }).mount('#app')
</script>
```
**TIP**

> 本指南中许多关于组合式 API 的例子将使用 `<script setup>` 语法，这需要构建工具。如果你打算在没有构建步骤的情况下使用组合式 API，请参考 `setup()`[ 选项](https://cn.vuejs.org/api/composition-api-setup.html)的用法。

### 使用 ES 模块构建版本 [​](https://cn.vuejs.org/guide/quick-start.html#using-the-es-module-build)
在本文档的其余部分我们使用的主要是 [ES 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)语法。现代浏览器大多都已原生支持 ES 模块。因此我们可以像这样通过 CDN 以及原生 ES 模块使用 Vue：

```html
<div id="app">{{ message }}</div>

<script type="module">
  import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

  createApp({
    setup() {
      const message = ref('Hello Vue!')
      return {
        message
      }
    }
  }).mount('#app')
</script>
```
注意我们使用了 `<script type="module">`，且导入的 CDN URL 指向的是 Vue 的 **ES 模块构建版本**。

### 启用 Import maps [​](https://cn.vuejs.org/guide/quick-start.html#enabling-import-maps)
在上面的示例中，我们使用了完整的 CDN URL 来导入，但在文档的其余部分中，你将看到如下代码：

```javascript
import { createApp } from 'vue'
```
我们可以使用[导入映射表 (Import Maps)](https://caniuse.com/import-maps) 来告诉浏览器如何定位到导入的 `vue`：

```html
<script type="importmap">
  {
    "imports": {
      "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
    }
  }
</script>

<div id="app">{{ message }}</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const message = ref('Hello Vue!')
      return {
        message
      }
    }
  }).mount('#app')
</script>
```
你也可以在映射表中添加其他的依赖——但请务必确保你使用的是该库的 ES 模块版本。

**导入映射表的浏览器支持情况**

> 导入映射表是一个相对较新的浏览器功能。请确保使用其[支持范围](https://caniuse.com/import-maps)内的浏览器。请注意，只有 Safari 16.4 以上版本支持。

**生产环境中的注意事项**

> 到目前为止示例中使用的都是 Vue 的开发构建版本——如果你打算在生产中通过 CDN 使用 Vue，请务必查看[生产环境部署指南](https://cn.vuejs.org/guide/best-practices/production-deployment.html#without-build-tools)。

### 拆分模块 [​](https://cn.vuejs.org/guide/quick-start.html#splitting-up-the-modules)
随着对这份指南的逐步深入，我们可能需要将代码分割成单独的 JavaScript 文件，以便更容易管理。例如：

```html
<!-- index.html -->
<div id="app"></div>

<script type="module">
  import { createApp } from 'vue'
  import MyComponent from './my-component.js'

  createApp(MyComponent).mount('#app')
</script>
```
```javascript
// my-component.js
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    return { count }
  },
  template: `<div>count is {{ count }}</div>`
}
```
如果直接在浏览器中打开了上面的 `index.html`，你会发现它抛出了一个错误，因为 ES 模块不能通过 `file://` 协议工作，也即是当你打开一个本地文件时浏览器使用的协议。

由于安全原因，ES 模块只能通过 `http://` 协议工作，也即是浏览器在打开网页时使用的协议。为了使 ES 模块在我们的本地机器上工作，我们需要使用本地的 HTTP 服务器，通过 `http://` 协议来提供 `index.html`。

要启动一个本地的 HTTP 服务器，请先安装 [Node.js](https://nodejs.org/zh/)，然后通过命令行在 HTML 文件所在文件夹下运行 `npx serve`。你也可以使用其他任何可以基于正确的 MIME 类型服务静态文件的 HTTP 服务器。

可能你也注意到了，这里导入的组件模板是内联的 JavaScript 字符串。如果你正在使用 VSCode，你可以安装 [es6-string-html](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html) 扩展，然后在字符串前加上一个前缀注释 `/*html*/` 以高亮语法。



## 原文链接
* [https://cn.vuejs.org/guide/quick-start.html#next-steps](https://cn.vuejs.org/guide/quick-start.html#next-steps)