---
title: 'Kibana中文汉化支持 '
date: '2024-03-20 14:28:34'
updated: '2024-03-20 15:28:10'
permalink: /post/kibana-chinese-sinicization-support-z1xmir.html
comments: true
toc: true
---

# Kibana中文汉化支持 

Kibana从6.6.0版本开始支持中文

参考：[https://github.com/anbai-inc/Kibana_Hanization](https://github.com/anbai-inc/Kibana_Hanization)

 汉化方法如下：

 以现行最新版本7.2.0为例，测试机器为Windows 10

 打开`\kibana-7.2.0-windows-x86_64\config\kibana.yml`​

 找到`i18n.locale`​，如果没找到自行添加如下文本

```sh
i18n.locale: "zh-CN"
```

启动Kibana，应该就可以查看到中文界面。

如果没有正确汉化，请找到目录`\kibana-7.2.0-windows-x86_64\x-pack\plugins\translations\translations`​，该目录下应存在汉化包，一个Json文件 `zh-CN.json`​

汉化效果基本满足使用，赞！

> 特别提示，yml 文件中以 `key: value`​ 形式存储，`value`​ 前注意必须添加`空格`​，不然 Kibana 启动时将会报配置文件读取异常。
