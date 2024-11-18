---
title: Elasticsearch集群拒绝请求：索引磁盘使用超限
date: '2024-11-18 15:28:06'
updated: '2024-11-18 15:31:13'
tags:
  - Elasticsearch
permalink: /post/elasticsearch-cluster-refuses-request-index-disk-use-overrun-2qo8fa.html
comments: true
toc: true
---

这是一个典型的Elasticsearch集群因为磁盘空间不足而触发的保护机制，导致索引被设置为只读模式（`read-only-allow-delete`​）。

以下是解决这个问题的步骤：

1. **释放磁盘空间**：您需要清理服务器上的磁盘空间，删除不必要的旧索引或者日志文件，以降低磁盘使用率。可以使用以下命令删除不需要的索引：

```js
DELETE /index_name
```

2. **增加磁盘容量**：如果清理磁盘空间后仍然无法解决问题，您可能需要对服务器进行扩容，增加更多的磁盘空间。

3. **临时调整磁盘水位线**：作为临时解决方案，您可以提高磁盘水位线的阈值，以允许写入操作继续进行，但这并不是长久之计。您可以使用以下命令：

```js
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.disk.watermark.low": "90%",
    "cluster.routing.allocation.disk.watermark.high": "95%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "97%"
  }
}
```

然后，取消索引的只读设置：

```js
PUT */_settings?expand_wildcards=all
{
  "index.blocks.read_only_allow_delete": null
}
```

4. **永久解决方案**：在增加了磁盘空间或者删除了足够的数据之后，您应该重置或重新配置磁盘水位线到默认值：

```js
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.disk.watermark.low": null,
    "cluster.routing.allocation.disk.watermark.high": null,
    "cluster.routing.allocation.disk.watermark.flood_stage": null
  }
}
```

请按照这些步骤操作，以解决您的Elasticsearch集群问题。如果问题仍然存在，可能需要进一步的诊断和操作。

>  原文链接：https://skyner.cn/archives/elasticsearch-cluster-refuses-request-index-disk-use-overrun-2qo8fa

‍
