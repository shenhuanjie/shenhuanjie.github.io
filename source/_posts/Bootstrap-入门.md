---
title: Bootstrap 入门
date: 2024-01-31 11:50:12
category:
  - Bootstrap
tags:
  - Bootstrap
  - 前端
  - CSS
  - HTML
---
Bootstrap是一个功能强大、功能丰富的前端工具包。在几分钟内构建任何东西——从原型到生产。

## 快速启动

无需任何构建步骤，即可通过CDN包含Bootstrap的生产就绪CSS和JavaScript。

1. 在项目根目录中创建一个新的`index.html`文件。还包括`<meta name=“viewport”>`标签，以便在移动设备中实现正确的响应行为。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap demo</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>
```

2. 包括`Bootstrap`的`CSS`和`JS`。在关闭`</body>`之前，将`CSS`的`<link>`标记和`JavaScript`捆绑包的`<script>`标记（包括用于定位下拉菜单、Popper和工具提示的Popper）放在`<head>`中。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap demo</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
  </head>
  <body>
    <h1>Hello, world!</h1>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-/mhDoLbDldZc3qpsJHpLogda//BVZbgYuw6kof4u2FrCedxOtgRZDTHgHUhOCVim" crossorigin="anonymous"></script>
  </body>
</html>
```

您也可以单独包含`Popper`和我们的`JS`。如果您不打算使用下拉菜单、弹出菜单或工具提示，请通过不包括`Popper`来节省一些`KB`。

```html
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js" integrity="sha384-oBqDVmMz9ATKxIep9tiCxS/Z9fNfEXiDAYTujMAeBAsjFuCZSmKbSSUnQlmh/jp3" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.min.js" integrity="sha384-ep+dxp/oz2RKF89ALMPGc7Z89QFa32C8Uv1A3TcEK8sMzXVysblLA3+eJWTzPJzT" crossorigin="anonymous"></script>
```

3. `Hello,world!`在您选择的浏览器中打开页面，查看您的引导页面。现在，您可以通过创建自己的布局、添加数十个组件并利用我们的官方示例，开始使用`Bootstrap`进行构建。

## CDN links

作为参考，以下是我们的主要CDN链接。

Description | URL
--- | ---
CSS | https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css
JS | https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js

您还可以使用CDN获取“内容”页面中列出的任何其他构建。

## 接下来的步骤

*阅读更多关于`Bootstrap`使用的一些重要全局环境设置的信息。
*请在我们的内容部分阅读`Bootstrap`中包含的内容，以及下面需要`JavaScript`的组件列表。
*需要多一点动力吗？考虑通过包管理器包含源文件来使用`Bootstrap`进行构建。
*想要使用Bootstrap作为`<script type=“module”>`的模块吗？请参阅我们的“使用引导程序作为模块”部分。

## JS组件

想知道哪些组件明确需要我们的`JavaScript`和`Popper`吗？单击下面的显示组件链接。如果您对一般页面结构完全不确定，请继续阅读示例页面模板。
