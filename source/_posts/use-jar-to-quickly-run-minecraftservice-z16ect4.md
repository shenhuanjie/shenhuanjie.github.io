---
title: 使用 jar 方式，快速运行 minecraft-service
date: '2024-06-06 16:38:09'
updated: '2024-06-06 17:00:59'
permalink: /post/use-jar-to-quickly-run-minecraftservice-z16ect4.html
comments: true
toc: true
---

在Linux系统中，要将命令封装成.service文件，需要创建一个systemd服务单元文件。下面是创建一个名为`minecraft.service`​的示例，它会运行你提供的`java`​命令来启动Minecraft Spigot服务器。

1. 打开终端。
2. 使用文本编辑器创建一个新的.service文件。你可以使用`nano`​或者`vi`​。例如：

    ```bash
    sudo vi /etc/systemd/system/minecraft.service
    ```
3. 在打开的编辑器中，输入以下内容：

    ```ini
    [Unit]
    Description=Minecraft Spigot Server
    After=network.target

    [Service]
    Type=simple
    User=root
    ExecStart=/usr/bin/java -Xms1G -Xmx4G -jar /root/minecraft-server/spigot-1.20.1.jar nogui

    [Install]
    WantedBy=multi-user.target
    ```
4. 保存并关闭文件。如果你使用的是`nano`​，可以通过按`Ctrl+X`​，然后按`Y`​确认保存，最后按`Enter`​键退出。
5. 重新加载systemd管理器配置，以确保新的服务文件被识别：

    ```bash
    sudo systemctl daemon-reload
    ```
6. 启用服务，以便在启动时自动运行：

    ```bash
    sudo systemctl enable minecraft.service
    ```
7. 启动服务：

    ```bash
    sudo systemctl start minecraft.service
    ```
8. 检查服务的状态，确保它正在运行：

    ```bash
    sudo systemctl status minecraft.service
    ```

请注意，你可能需要根据你的系统配置和Minecraft服务器的安装位置来调整上述文件中的路径和用户。此外，确保你有足够的权限来创建和编辑`/etc/systemd/system/`​目录下的文件，通常需要root权限。

---

要删除原有的`minecraft.service`​，你可以按照以下步骤操作：

1. **停止服务**：  
    首先，你需要停止正在运行的`minecraft.service`​服务。可以使用以下命令：

    ```bash
    sudo systemctl stop minecraft.service
    ```
2. **禁用服务**：  
    然后，禁用服务以防止它在系统启动时自动运行：

    ```bash
    sudo systemctl disable minecraft.service
    ```
3. **删除服务文件**：  
    接下来，删除`/etc/systemd/system/`​目录下的`minecraft.service`​文件。使用以下命令：

    ```bash
    sudo rm /etc/systemd/system/minecraft.service
    ```
4. **重新加载systemd管理器配置**：  
    删除服务文件后，重新加载systemd管理器配置，以确保更改生效：

    ```bash
    sudo systemctl daemon-reload
    ```
5. **确认服务已删除**：  
    最后，检查服务是否已从systemd中删除：

    ```bash
    sudo systemctl status minecraft.service
    ```

    如果服务已被删除，你应该会看到一条消息，说明服务未找到或不存在。

请注意，直接删除服务文件可能会影响系统的稳定性，特别是如果该服务是由系统管理员或系统软件管理的。在删除任何服务之前，请确保你了解该服务的作用，以及删除它的后果。如果你不确定，最好咨询有经验的系统管理员。

---

要在后台运行命令，你可以使用 `nohup`​ 命令或者将命令放入一个脚本中，并使用 `&`​ 符号将脚本放入后台执行。以下是两种方法的示例：

### 方法一：使用 `nohup`​ 命令

​`nohup`​ 命令可以防止你的命令在终端关闭后被终止。以下是如何使用 `nohup`​ 来运行你的 Java 命令：

```bash
nohup java -Xms1G -Xmx4G -jar /root/minecraft-server/spigot-1.20.1.jar nogui &
```

这条命令会在后台运行 Java 程序，并且即使终端关闭，程序也会继续运行。`nohup`​ 的输出默认会被重定向到名为 `nohup.out`​ 的文件中。

### 方法二：创建并运行一个脚本

1. 创建一个脚本文件，例如 `start_minecraft.sh`​：

```bash
vi start_minecraft.sh
```

2. 在打开的编辑器中，输入以下内容：

```bash
#!/bin/bash
java -Xms1G -Xmx4G -jar /root/minecraft-server/spigot-1.20.1.jar nogui
```

3. 保存并退出编辑器。
4. 给脚本文件添加执行权限：

```bash
chmod +x start_minecraft.sh
```

5. 运行脚本并将其放入后台：

```bash
./start_minecraft.sh &
```

使用 `&`​ 符号将脚本放入后台执行，这样即使终端关闭，脚本也会继续运行。

### 检查后台进程

要检查后台进程的状态，你可以使用以下命令：

```bash
jobs
```

这将列出所有在后台运行的作业。

或者，你可以使用 `ps`​ 命令来查找 Java 进程：

```bash
ps aux | grep java
```

这将显示所有包含 `java`​ 关键字的进程。

### 注意事项

* 确保你的 Java 应用程序能够处理在后台运行时可能遇到的任何问题，例如日志记录和错误处理。
* 如果你使用的是 `nohup`​，确保 `nohup.out`​ 文件有足够的空间来存储输出，或者考虑将输出重定向到其他文件。
* 如果你的系统配置了 `ulimit`​ 来限制后台进程的数量，你可能需要调整这些限制，或者确保你不会超出限制。

---

要查看后台运行的进程状态，你可以使用多种Linux命令。以下是一些常用的命令：

1. **使用** **​`jobs`​**​ **命令**：  
    这个命令会列出当前终端会话中的后台作业。

    ```bash
    jobs
    ```
2. **使用** **​`ps`​**​ **命令**：  
    ​`ps`​ 命令可以显示当前运行的进程。结合 `grep`​ 命令，你可以过滤特定的进程。

    ```bash
    ps aux | grep java
    ```

    这将列出所有包含 `java`​ 关键字的进程。
3. **使用** **​`top`​**​ **或** **​`htop`​**​ **命令**：  
    这些命令提供了一个动态更新的进程列表，你可以看到进程的实时状态。

    ```bash
    top
    ```

    或者，如果你的系统安装了 `htop`​：

    ```bash
    htop
    ```
4. **使用** **​`pgrep`​**​ **和** **​`pkill`​**​ **命令**：  
    ​`pgrep`​ 可以根据进程名或其他属性查找进程的PID。

    ```bash
    pgrep -f java
    ```

    这将查找所有包含 `java`​ 字符串的进程的PID。
5. **使用** **​`systemctl`​**​ **命令**：  
    如果你的进程是作为系统服务运行的，你可以使用 `systemctl`​ 来查看服务的状态。

    ```bash
    systemctl status 服务名称
    ```

    例如，如果你的服务名为 `minecraft.service`​，你可以使用：

    ```bash
    systemctl status minecraft.service
    ```
6. **查看日志文件**：  
    如果后台进程有日志输出，查看日志文件也是了解进程状态的一种方式。例如，如果你使用了 `nohup`​，输出通常会被重定向到 `nohup.out`​ 文件。

    ```bash
    cat nohup.out
    ```
7. **使用** **​`tail`​**​ **命令**：  
    ​`tail`​ 命令可以用来查看文件的最后几行，这在查看日志文件时非常有用。

    ```bash
    tail -f /path/to/logfile.log
    ```

    这将持续显示日志文件的最后几行，直到你停止命令（使用 `Ctrl+C`​）。

请根据你的具体需求选择合适的命令。如果你正在寻找特定的进程或服务，确保你知道进程的名称或服务的确切名称。
