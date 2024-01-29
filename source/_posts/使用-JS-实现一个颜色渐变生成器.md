---
title: 使用 JS 实现一个颜色渐变生成器
date: 2024-01-29 15:48:19
category:
  - JavaScript
tags:
  - JavaScript
  - 颜色渐变
---

## 颜色渐变生成器

### 理论分析

> 给出两个颜色，生成平均过渡的 N 个 RGB 值

要生成两个颜色之间的平均过渡，我们可以使用线性插值（Linear Interpolation）来计算中间的颜色。线性插值是一种简单的方法，它假设颜色空间是线性的，即颜色之间的变化是均匀的。以下是一个JavaScript函数，它接受两个RGB颜色和一个过渡步数N，然后返回一个包含N个颜色的数组，这些颜色是从第一个颜色平滑过渡到第二个颜色的：

```js
function interpolateColors(color1, color2, N) {
  // 确保颜色是有效的RGB数组
  if (!Array.isArray(color1) || !Array.isArray(color2) || color1.length !== 3 || color2.length !== 3) {
    throw new Error('Invalid color values');
  }

  // 创建一个数组来存储过渡颜色
  const interpolatedColors = [];

  // 计算每个颜色分量的差值
  const rDelta = color2[0] - color1[0];
  const gDelta = color2[1] - color1[1];
  const bDelta = color2[2] - color1[2];

  // 生成过渡颜色
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1); // 插值因子，从0到1
    const r = Math.round(color1[0] + rDelta * t);
    const g = Math.round(color1[1] + gDelta * t);
    const b = Math.round(color1[2] + bDelta * t);
    interpolatedColors.push(`rgb(${r}, ${g}, ${b})`);
  }

  return interpolatedColors;
}

// 示例使用
const colorA = [255, 0, 0]; // 红色
const colorB = [0, 0, 255]; // 蓝色
const N = 10; // 过渡步数
const transitionColors = interpolateColors(colorA, colorB, N);

console.log(transitionColors);
```

这个函数首先计算两个颜色在RGB分量上的差异，然后通过循环生成N个新的颜色，每个颜色都是通过在两个原始颜色之间进行线性插值得到的。插值因子t从0（第一个颜色）变化到1（第二个颜色），这样在循环的每一步中，我们都会得到一个新的颜色值，这些值构成了从第一个颜色到第二个颜色的平滑过渡。

请注意，这个函数返回的是颜色的字符串表示，例如"rgb(255, 0, 0)"。您可以根据需要调整N的值来增加或减少过渡的平滑度。

### 完整源码

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>颜色渐变生成器</title>
    <style>
        .gradient-container {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }

        .color-box {
            width: 20px;
            height: 20px;
            border: 1px solid #000;
        }
    </style>
</head>

<body>
    <div id="gradient-container" class="gradient-container"></div>

    <script>
        function interpolateColors(color1, color2, N) {
            // 确保颜色是有效的RGB数组
            if (!Array.isArray(color1) || !Array.isArray(color2) || color1.length !== 3 || color2.length !== 3) {
                throw new Error('Invalid color values');
            }

            // 创建一个数组来存储过渡颜色
            const interpolatedColors = [];

            // 计算每个颜色分量的差值
            const rDelta = color2[0] - color1[0];
            const gDelta = color2[1] - color1[1];
            const bDelta = color2[2] - color1[2];

            // 生成过渡颜色
            for (let i = 0; i < N; i++) {
                const t = i / (N - 1); // 插值因子，从0到1
                const r = Math.round(color1[0] + rDelta * t);
                const g = Math.round(color1[1] + gDelta * t);
                const b = Math.round(color1[2] + bDelta * t);
                interpolatedColors.push(`rgb(${r}, ${g}, ${b})`);
            }

            return interpolatedColors;
        }

        function createGradient() {
            const container = document.getElementById('gradient-container');
            const startColor = [255, 0, 0]; // Red
            const endColor = [0, 0, 255]; // Blue
            const gradientColors = interpolateColors(startColor, endColor, 5);

            gradientColors.forEach(color => {
                const colorBox = document.createElement('div');
                colorBox.style.backgroundColor = color;
                colorBox.classList.add('color-box');
                container.appendChild(colorBox);
            });
        }

        // Call the function to create the gradient when the page loads
        window.onload = createGradient;
    </script>
</body>

</html>
```

## 应用案例

https://www.arealme.com/color-hue-test/cn/
