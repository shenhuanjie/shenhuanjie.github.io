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

## 原文链接
* [http://jsx.github.io/](http://jsx.github.io/)


