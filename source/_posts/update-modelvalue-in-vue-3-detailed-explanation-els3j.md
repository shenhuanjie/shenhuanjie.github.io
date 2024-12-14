---
title: Vue 3 中的 `update:modelValue` 事件详解
date: '2024-12-14 11:01:25'
updated: '2024-12-14 11:02:47'
tags:
  - 双向数据绑定
  - ' Vue3'
permalink: /post/update-modelvalue-in-vue-3-detailed-explanation-els3j.html
comments: true
toc: true
---

在 Vue 3 中，`update:modelValue`​ 事件通常与 `v-model`​ 指令一起使用，以实现自定义组件的双向数据绑定。以下是对该事件的详细分析：

#### 事件定义

首先，我们需要在组件中定义 `update:modelValue`​ 事件。可以使用 `defineEmits`​ 函数来声明组件可以发出的事件：

```typescript
const emit = defineEmits(['update:modelValue']);
```

#### 属性定义

接下来，我们需要定义组件接收的 `modelValue`​ 属性。可以使用 `defineProps`​ 函数来声明组件的 props：

```typescript
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});
```

#### 创建计算属性

为了实现双向数据绑定，我们可以创建一个计算属性 `_modelValue`​。这个计算属性的 `get`​ 方法返回 `modelValue`​ 的当前值，而 `set`​ 方法则触发 `update:modelValue`​ 事件并传递新值：

```typescript
const _modelValue = computed({
    get: () => {
        return props.modelValue;
    },
    set: (val) => {
        emit('update:modelValue', val);
    }
});
```

#### 完整示例

以下是一个完整的示例，展示了如何在 Vue 3 中使用 `update:modelValue`​ 事件实现双向数据绑定：

```vue
<script lang="ts" setup>
import { computed } from "vue";

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});
const _modelValue = computed({
    get: () => {
        return props.modelValue;
    },
    set: (val) => {
        emit('update:modelValue', val);
    }
});
</script>

<template>
  <input type="checkbox" v-model="_modelValue">
</template>

<style lang="scss" scoped>
/* 样式代码 */
</style>
```

#### 总结

通过使用 `defineEmits`​ 和 `defineProps`​ 函数，我们可以轻松地在 Vue 3 组件中实现 `update:modelValue`​ 事件，从而实现双向数据绑定。这种设置允许组件与 `v-model`​ 无缝配合，使父组件和子组件之间的数据同步变得更加简单和高效。
