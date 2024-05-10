ADB 可以配置为使用 systemd 风格的套接字激活，允许守护进程在 adb 控制端口通过网络转发时自动启动。您需要两个文件，放置在通常的 systemd 服务目录中（例如，对于用户服务是 ~/.config/systemd/user）。
adb.service 文件内容如下：

```txt
--- 此处开始 adb.service 文件 ---
[Unit]
Description=adb
After=adb.socket
Requires=adb.socket
[Service]
Type=simple
# FD 3 is part of the systemd interface
ExecStart=/path/to/adb server nodaemon -L acceptfd:3
--- 此处结束 adb.service 文件 ---

--- START adb.socket CUT HERE ---
[Unit]
Description=adb
PartOf=adb.service
[Socket]
ListenStream=127.0.0.1:5037
Accept=no
[Install]
WantedBy=sockets.target
--- END adb.socket CUT HERE ---
```


安装 adb 服务后，任何对 127.0.0.1:5037（默认的 adb 控制端口）的连接都会自动启动 adb 服务器，即使使用 adb kill-server 命令关闭了服务器。
其他“超级服务器”启动系统（如 macOS 的 launchd）也可以类似地配置。重要的是 adb 必须以 "server" 和 "nodaemon" 命令行参数启动，并且监听地址（传递给 -L 的）命名的文件描述符已经准备好接受连接，并且已经绑定到所需的地址并处于监听状态。inetd 风格的预先接受的套接字在此配置中**不**工作：传递给 acceptfd 的文件描述符必须是服务套接字，而不是已接受的连接套接字。
