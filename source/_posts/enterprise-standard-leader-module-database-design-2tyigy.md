---
title: 企业标准领跑者模块数据库表设计
date: '2024-02-04 00:00:29'
updated: '2024-02-04 00:42:00'
permalink: /post/enterprise-standard-leader-module-database-design-2tyigy.html
comments: true
toc: true
---

# 企业标准领跑者模块数据库表设计

## 名词说明：

* 行业： industry
* 领域：domain
* 产品：product
* 标准：standard
* 领跑者：leader
* 父级分类：parent category
* 评估：evaluate
* 机构：institution
* 省份：province
* 城市：city
* 区县：districts
* 法人：legal person

## 标准产品分类表

* 产品名称：product name
* 所属行业：industry
* 所属领域：domain

## 标准行业领域分类表

* 分类名称：category name
* 父级分类：parent category

  * 父级 ID：parent id
* 分类类型：category type

  * 行业：industry
  * 领域：domain

## 标准产品评估方案表

* 产品名称：product name

  * 产品 ID：product id
* 发布日期：publish date
* 所属行业：industry

  * 行业 ID：industry id
* 所属领域：domain

  * 领域 ID：domain id
* 机构名称：institution name
* 机构统一社会型号代码：institution usci
* 机构法人：institutional legal person
* 联合评估机构名称：union evaluate institution name

## 标准领跑者信息表

* 发布状态：publish status

  * 公示中：announcing
  * 已发布：published
* 发布日期：publish date
* 企业名称：enterprise name
* 所在省份：province

  * 省份 ID：province id
* 所在城市：city

  * 城市 ID：city id
* 所在区县：districts

  * 区县 ID：districts id
* 评估机构名称：evaluate institution name
* 公示开始日期：announcing begin date
* 公示结束日期：announcing end date
* 标准编号：standard number
* 标准名称：standard name
* 产品名称；product name
* 产品型号：product model
* 所属行业：industry

  * 行业 ID：industry id
* 所属领域：domain

  * 领域 ID：domain id

‍
