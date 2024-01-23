---
title: What is JSX?
date: 2024-01-23 18:03:26
category:
  - JSX
tags:
  - JavaScript
  - JSX
---

JSX is a statically-typed, object-oriented programming language designed to run on modern web browsers. Being developed at [DeNA](http://dena.com/intl/) as a research project, the language has following characteristics.

## faster
JSX performs optimization while compiling the source code to JavaScript. The generated code runs faster than an equivalent code written directly in JavaScript. The gain may vary, but even the optimized JavaScript libraries like Box2D becomes faster when ported to JSX ([12% faster on iOS 5.1, 29% faster on Android 2.3](http://www.slideshare.net/kazuho/jsx-optimizer)).

## safer
In contrast to JavaScript, JSX is statically-typed and mostly type-safe. The quality of applications becomes higher when being developed using JSX, since many errors will be caught during the compilation process. It also offers debugging features at the compiler level as well.

## easier
JSX offers a solid class system much like Java, freeing the developers from working with the too-primitive prototype-based inheritance system provided by JavaScript. Expressions and statements, however, are mostly equal to JavaScript, so it is easy for JavaScript programmers to start using JSX. There are also plans on language-services for editors / IDEs, for example [code completion](https://github.com/jsx/jsx.vim#code-completion), to make coding easiler.

## Other Resources
A slide describing the objectives of JSX can be found [here](http://www.slideshare.net/kazuho/jsx).

There is [JSX wiki](https://github.com/jsx/JSX/wiki) to gather JSX resources.

---

JSX是一种静态类型的、面向对象的编程语言，设计用于在现代web浏览器上运行。作为DeNA的一个研究项目，该语言具有以下特点。

## 更快的

JSX在将源代码编译为JavaScript时执行优化。生成的代码比直接用JavaScript编写的等效代码运行得快。增益可能会有所不同，但即使是优化的JavaScript库(如Box2D)在移植到JSX时也会变得更快(在iOS 5.1上快12%，在Android 2.3上快29%)。

## 更安全的

与JavaScript相比，JSX是静态类型的，并且大部分是类型安全的。当使用JSX开发应用程序时，应用程序的质量会变得更高，因为在编译过程中会捕获许多错误。它还提供了编译器级别的调试功能。

## 更容易

JSX提供了一个非常类似于Java的坚实的类系统，使开发人员不必再使用JavaScript提供的过于原始的基于原型的继承系统。然而，表达式和语句基本上等同于JavaScript，因此JavaScript程序员很容易开始使用JSX。还计划为编辑器/ ide提供语言服务，例如代码补全，以使编码更容易。

## 原文链接

* [http://jsx.github.io/](http://jsx.github.io/)


