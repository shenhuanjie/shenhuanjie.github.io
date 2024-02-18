---
title: Linux 后台运行 natapp(ngrok)教程
date: '2024-02-18 09:58:53'
updated: '2024-02-18 10:02:11'
permalink: /post/run-natapp-ngrok-tutorial-in-linux-background-fdo4b.html
comments: true
toc: true
---

首先,要确保常规方式运行natapp 没有任何问题.

如 我们将natapp放在 /usr/local/natapp/ 下

```sh
cd /usr/local/natapp
```

然后运行

```sh
./natapp -authtoken=xxxxx
```

正常运行如下

浏览器访问等测试,均无任何问题.

这是,如果关掉窗口,就是关掉了natapp程序,所以会掉线.

下面利用 nohup 实现natapp(ngrok)后台运行方法

很简单,运行

```sh
nohup ./natapp -authtoken=xxxx -log=stdout &
```

注意一定要加上 -log=stdout

运行如图

此时,按Ctrl+C 退出,或者直接关闭窗口都可以.

另开一个窗口检查一下

```sh
ps -ef|grep natapp
```

可以看到natapp进程代表运行成功!如果运行了多次,则会出现多个natapp进程,需要结束进程.下面 那个 2790的,代表查找程序本身,忽略掉.

找到natapp进程的pid 2777 ,如果要结束进程,运行

```sh
kill -9 2777
```

nohup 默认会在当前目录 创建 nohup.out 文件,会记录natapp运行日志,为避免日志过大,可以将日志等级降低 如

```sh
nohup ./natapp -authtoken=xxx -log=stdout -loglevel=ERROR &
```

如果需要开机自启动,请参考 [natapp(ngrok) Linux 开机自启动](https://natapp.cn/article/supervisor)

‍
