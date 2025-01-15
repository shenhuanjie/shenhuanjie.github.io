---
title: MySQL 8.0 如何禁用 ONLY_FULL_GROUP_BY
date: '2025-01-15 11:01:39'
updated: '2025-01-15 11:03:51'
excerpt: >-
  MySQL 8.0 中，可以通过三种方法禁用 ONLY_FULL_GROUP_BY
  模式：临时禁用（仅当前会话）、全局禁用（所有会话）和通过配置文件永久禁用。临时禁用和全局禁用分别使用 SET SESSION 和 SET GLOBAL
  命令，而永久禁用则需要修改 MySQL 配置文件并重启服务。禁用该模式后，需注意数据准确性问题，并谨慎使用。
tags:
  - MySQL
  - 禁用
  - GROUP
  - 模式
  - 配置
categories:
  - MySQL
permalink: /post/how-to-disable-onlyfullgroupby-z28azoh.html
comments: true
toc: true
---





　　在 MySQL 8 中，`ONLY_FULL_GROUP_BY`​ 是默认启用的 SQL 模式之一。如果你希望禁用 `ONLY_FULL_GROUP_BY`​，可以通过以下几种方式实现：

---

### **方法 1：临时禁用（仅对当前会话有效）**

　　你可以通过修改当前会话的 `sql_mode`​ 来临时禁用 `ONLY_FULL_GROUP_BY`​。

#### 步骤：

1. 查看当前的 `sql_mode`​：

    ```sql
    SELECT @@sql_mode;
    ```

    输出可能类似于：

    ```
    ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
    ```
2. 移除 `ONLY_FULL_GROUP_BY`​：

    ```sql
    SET SESSION sql_mode = (SELECT REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', ''));
    ```
3. 验证是否已移除：

    ```sql
    SELECT @@sql_mode;
    ```

    输出中不应再包含 `ONLY_FULL_GROUP_BY`​。

---

### **方法 2：全局禁用（对所有会话有效）**

　　如果你希望全局禁用 `ONLY_FULL_GROUP_BY`​，可以修改全局的 `sql_mode`​。

#### 步骤：

1. 查看当前的全局 `sql_mode`​：

    ```sql
    SELECT @@GLOBAL.sql_mode;
    ```
2. 移除 `ONLY_FULL_GROUP_BY`​：

    ```sql
    SET GLOBAL sql_mode = (SELECT REPLACE(@@GLOBAL.sql_mode, 'ONLY_FULL_GROUP_BY', ''));
    ```
3. 验证是否已移除：

    ```sql
    SELECT @@GLOBAL.sql_mode;
    ```

---

### **方法 3：通过配置文件永久禁用**

　　如果你希望永久禁用 `ONLY_FULL_GROUP_BY`​，可以通过修改 MySQL 配置文件来实现。

#### 步骤：

1. 打开 MySQL 配置文件：

    * Linux 系统：`/etc/my.cnf`​ 或 `/etc/mysql/my.cnf`​
    * Windows 系统：`my.ini`​
2. 找到 `[mysqld]`​ 部分，修改或添加 `sql_mode`​ 配置项，移除 `ONLY_FULL_GROUP_BY`​。例如：

    ```ini
    [mysqld]
    sql_mode = STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
    ```
3. 保存文件并重启 MySQL 服务：

    * Linux 系统：

      ```bash
      sudo systemctl restart mysql
      ```
    * Windows 系统：  
      通过服务管理器重启 MySQL 服务。
4. 验证是否生效：

    ```sql
    SELECT @@sql_mode;
    ```

---

### **注意事项**

1. **数据准确性**：禁用 `ONLY_FULL_GROUP_BY`​ 后，MySQL 允许在 `GROUP BY`​ 查询中使用未明确分组的非聚合列。这可能导致查询结果不确定或不准确，因此需要谨慎使用。
2. **生产环境**：在生产环境中，建议保持 `ONLY_FULL_GROUP_BY`​ 启用，以确保查询的准确性和一致性。
3. **兼容性**：禁用 `ONLY_FULL_GROUP_BY`​ 后，某些在严格模式下会报错的查询可能会正常运行，但结果可能不符合预期。

---

### **总结**

* 临时禁用：使用 `SET SESSION sql_mode`​。
* 全局禁用：使用 `SET GLOBAL sql_mode`​。
* 永久禁用：修改 MySQL 配置文件并重启服务。

　　根据你的需求选择合适的方法，但请务必注意禁用 `ONLY_FULL_GROUP_BY`​ 可能带来的数据准确性问题。
