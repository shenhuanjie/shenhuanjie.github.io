---
title: GitLab 迁移并推送代码仓库
date: '2024-09-20 11:02:13'
updated: '2024-09-20 11:20:12'
tags:
  - Git
  - Gitlab
permalink: /post/gitlab-migrate-and-push-the-code-warehouse-1qrdso.html
comments: true
toc: true
---

迁移并推送代码仓库到 GitLab 可以有多种方法，以下是一些常见的步骤：

## 一、创建空仓库

1. 在 Gitlab 上创建一个空仓库

    * 方式一：点击左上角“+”号，选择新建项目/仓库
    * 方式二：进入“项目”界面，点击右上角“新建项目”按钮

​![image](https://qiniu.skyner.cn/image-20240920110715-ftt7xwq.png)​

‍

2. 选择“创建空白项目”

​![image](https://qiniu.skyner.cn/image-20240920110917-sglhbcw.png)​

3. 填写项目信息并点击“新建项目”

> TIP：不要勾选“项目配置->使用自述文件初始化仓库”选项

​![image](https://qiniu.skyner.cn/image-20240920111158-4n9mln8.png)​

* 点击完成创建项目

​![image](https://qiniu.skyner.cn/image-20240920111412-3oaajpi.png)​

## 二、迁移并上传仓库代码

#### 该项目仓库当前为空

您可以通过克隆仓库开始或开始以以下方式之一添加文件。

### 命令行指引

您还可以按照以下说明从计算机中上传现有文件。

##### Git 全局设置

```shell
git config --global user.name "shenhuanjie"
git config --global user.email "shenhuanjie@live.cn"
```

##### 创建一个新仓库

```shell
git clone git@gitlab.skyner.cn:devcloud/demo-project.git
cd demo-project
git switch --create master
touch README.md
git add README.md
git commit -m "add README"
git push --set-upstream origin master
```

##### 推送现有文件夹

```shell
cd existing_folder
git init --initial-branch=master
git remote add origin git@gitlab.skyner.cn:devcloud/demo-project.git
git add .
git commit -m "Initial commit"
git push --set-upstream origin master
```

##### 推送现有的 Git 仓库

```shell
cd existing_repo
git remote rename origin old-origin
git remote add origin git@gitlab.skyner.cn:devcloud/demo-project.git
git push --set-upstream origin --all
git push --set-upstream origin --tags
```

---

> **温馨提示：**
>
> 在进行迁移时，请确保在迁移过程中对数据进行备份，以防数据丢失。同时，迁移完成后，需要更新项目的文档和团队成员的仓库地址。如果迁移涉及到权限和用户信息，还需要确保在新服务器上正确设置这些信息。

### **参考文章**

* ## [Git cheatsheet](https://skyner.cn/archives/git-cheatsheet-zzyv1y)
* ## [Linux 生成 git ssh 公钥](https://skyner.cn/archives/linux-generates-git-ssh-public-key-z1zfmkc)
* ## [服务器部署 Gitlab 并设置 Https 域名](https://skyner.cn/archives/server-deploy-gitlab-and-set-up-https-domain-names-z1lbxus)

‍
