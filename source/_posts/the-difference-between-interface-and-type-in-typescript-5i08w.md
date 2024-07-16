---
title: Typescript 中 interface 和 type 的区别
date: '2024-07-16 19:30:15'
updated: '2024-07-16 19:49:23'
tags:
  - TypeScript
permalink: /post/the-difference-between-interface-and-type-in-typescript-5i08w.html
comments: true
toc: true
---

在 TypeScript 中，`interface`​ 和 `type`​ 是用来描述对象结构或类型的两种主要方式，它们有一些区别和各自的特点。

### Interface（接口）

1. **定义方式**：

    * 使用 `interface`​ 关键字定义，例如：

      ```typescript
      interface Person {
          name: string;
          age: number;
      }
      ```
2. **适用场景**：

    * 主要用于描述对象的形状（Shape），定义对象应该包含哪些属性以及它们的类型。
3. **特点**：

    * 可以在声明合并（Declaration Merging）时扩展一个已有的接口，以增加新的属性。
    * 可以被类实现（implements），使类能够符合某个接口的契约。
4. **支持的语法**：

    * 可以使用 `extends`​ 关键字继承另一个接口，形成接口的继承关系。

### Type（类型）

1. **定义方式**：

    * 使用 `type`​ 关键字定义，例如：

      ```typescript
      type Person = {
          name: string;
          age: number;
      };
      ```
2. **适用场景**：

    * 用于定义各种类型，不仅仅局限于对象类型，还可以定义联合类型、交叉类型等。
3. **特点**：

    * 可以使用联合类型、交叉类型等高级类型，使得类型定义更加灵活和复杂。
    * 可以定义原始类型（如 `number`​、`string`​）、联合类型（`|`​）、交叉类型（`&`​）等。
    * 可以使用 `typeof`​ 获取变量的类型。
4. **区别与注意事项**：

    * ​`type`​ 能够做的大多数事情，`interface`​ 也能做，但反之不一定。
    * 当你需要使用联合类型、交叉类型或者定义复杂的类型别名时，应优先选择 `type`​。
    * 当需要进行接口扩展或者定义类实现的契约时，应使用 `interface`​。

### 总结

* 使用 `interface`​ 主要用于定义对象的结构和类实现的契约。
* 使用 `type`​ 主要用于定义各种类型，包括对象类型以及更复杂的类型别名。
* 在实际使用中，可以根据具体的需求和语境选择合适的方式来定义类型或者对象结构。
