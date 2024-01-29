---
title: Vue 模版语法
date: 2024-01-29 14:28:02
category:
  - Vue
tags:
  - Vue
  - 模版语法
---
## 模板语法

Vue 使用一种基于 HTML 的模板语法，使我们能够声明式地将其组件实例的数据绑定到呈现的 DOM 上。所有的 Vue 模板都是语法层面合法的 HTML，可以被符合规范的浏览器和 HTML 解析器解析。

在底层机制中，Vue 会将模板编译成高度优化的 JavaScript 代码。结合响应式系统，当应用状态变更时，Vue 能够智能地推导出需要重新渲染的组件的最少数量，并应用最少的 DOM 操作。

如果你对虚拟 DOM 的概念比较熟悉，并且偏好直接使用 JavaScript，你也可以结合可选的 JSX 支持直接手写渲染函数而不采用模板。但请注意，这将不会享受到和模板同等级别的编译时优化。

### 文本插值

最基本的数据绑定形式是文本插值，它使用的是"Mustache"语法（双大括号）：

```html
<span>Message: {{ msg }}</span>
```

双大括号标签会被替换为相应组件实例中 `msg` 属性的值。同时每次`msg`属性更改时它也会同步更新。

## 原始 HTML

双大括号会将数据解释为纯文本，而不是 HTML。若想插入 HTML，你需要使用 `v-html` 指令：

```html
<p>Using mustaches: {{ rawHtml }}</p>
<p>Using v-html directive: <span v-html="rawHtml"></span></p>
```

```
Using text interpolation: <span style="color: red">This should be red.</span>

Using v-html directive: This should be red.
```

这里我们遇到了一个新的概念。这里看到的 `v-html` attribute 被称为一个指令。指令由 `v-` 作为前缀，表明它们是一些由 Vue 提供的特殊 attribute，你可能已经猜到了，它们将为渲染的 DOM 应用特殊的响应式行为。这里我们做的事情简单来说就是：在当前组件实例上，将此元素的 innerHTML 与 `rawHtml` 属性保持同步。

`span` 的内容将会被替换为 `rawHtml` 属性的值，插值为纯 HTML————数据绑定将会被忽略。注意，你不能使用 `v-html` 来拼接组合模板，因为 Vue 不是一个基于字符串的模板引擎。在使用 Vue 时，应当使用组件作为 UI 重用和组合的基本单元。

**安全警告**

在网站上动态渲染任意 HTML 是非常危险的，因为这非常容易造成 `XSS 漏洞`。请仅在内容安全可信时再使用 `v-html`，并且永远不要使用用户提供的 HTML 内容。

## Attribute 绑定

双大括号不能在 HTML attribute 中使用。想要响应式地绑定一个 attribute，应该使用 `v-bind` 指令：

```html
<div v-bind:id="dynamicId"></div>
```

`v-bind` 指令指示 Vue 将元素的 `id` attribute 与组件的 `dynamicId` 属性保持一致。如果绑定的值是 `null`、`undefined` 或 `false`，那么该 attribute 将会从渲染的元素上移除。

### 简写

因为 `v-bind` 非常常用，我们提供了特定的简写语法：

```html
<div :id="dynamicId"></div>
```

开头为 `:` 的 attribute 可能和一般的 HTML attribute 看起来不太一样，但它的确是合法的 attribute 名称字符，并且所有支持 Vue 的浏览器都能正确解析它。此外，他们不会出现在最终渲染的 DOM 中。简写语法是可选的，但相信在你了解了它更多的用处后，你应该会更喜欢它。

> 接下来的指引中，我们都将在示例中使用简写语法，因为这是在实际开发中更常见的用法。

### 同名简写 `3.4+`

如果 attribute 的名称与绑定的 JavaScript 值的名称相同，那么可以进一步简化语法，省略 attribute 值：

```html
<!-- same as :id="id" -->
<div :id></div>

<!-- this also works -->
<div v-bind:id></div>
```

这与在 JavaScript 中声明对象时使用的属性简写语法类似。请注意，这是一个只在 Vue 3.4 及以上版本中可用的特性。

### 布尔型 Attribute 

`布尔型 attribute` 依据 true / false 值来决定 attribute 是否应该存在于该元素上。`disabled` 就是最常见的例子之一。

`v-bind` 在这种场景下的行为略有不同：

```html
<button :disabled="isButtonDisabled">Button</button>
```

当 `isButtonDisabled` 为`真值`或一个空字符串 (即 `<button disabled="">`) 时，元素会包含这个 `disabled` attribute。而当其为其他**假值**时 attribute 将被忽略。

### 动态绑定多个值 

如果你有像这样的一个包含多个 attribute 的 JavaScript 对象：

```js
data() {
  return {
    objectOfAttrs: {
      id: 'container',
      class: 'wrapper'
    }
  }
}
```

通过不带参数的 `v-bind`，你可以将它们绑定到单个元素上：

```html
<div v-bind="objectOfAttrs"></div>
```

## 使用 JavaScript 表达式 

至此，我们仅在模板中绑定了一些简单的属性名。但是 Vue 实际上在所有的数据绑定中都支持完整的 JavaScript 表达式：

```vue
{{ number + 1 }}

{{ ok ? 'YES' : 'NO' }}

{{ message.split('').reverse().join('') }}
```

```html
<div :id="`list-${id}`"></div>
```

这些表达式都会被作为 JavaScript ，以当前组件实例为作用域解析执行。

在 Vue 模板内，JavaScript 表达式可以被使用在如下场景上：

* 在文本插值中 (双大括号)
* 在任何 Vue 指令 (以 `v-` 开头的特殊 attribute) attribute 的值中

### 仅支持表达式 

每个绑定仅支持单一表达式，也就是一段能够被求值的 JavaScript 代码。一个简单的判断方法是是否可以合法地写在 `return` 后面。

因此，下面的例子都是无效的：

```html
<!-- 这是一个语句，而非表达式 -->
{{ var a = 1 }}

<!-- 条件控制也不支持，请使用三元表达式 -->
{{ if (ok) { return message } }}
```

### 调用函数 

可以在绑定的表达式中使用一个组件暴露的方法：

```html
<time :title="toTitleDate(date)" :datetime="date">
  {{ formatDate(date) }}
</time>
```

**TIP**

> 绑定在表达式中的方法在组件每次更新时都会被重新调用，因此不应该产生任何副作用，比如改变数据或触发异步操作。

### 受限的全局访问

模板中的表达式将被沙盒化，仅能够访问到**有限的全局对象列表**。该列表中会暴露常用的内置全局对象，比如 `Math` 和 `Date`。

没有显式包含在列表中的全局对象将不能在模板内表达式中访问，例如用户附加在 **window** 上的属性。然而，你也可以自行在 `app.config.globalProperties` 上显式地添加它们，供所有的 Vue 表达式使用。
