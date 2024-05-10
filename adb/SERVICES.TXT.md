该文件尝试记录客户端可以向 adbd 守护进程的 ADB 服务器发出的所有请求。请参阅 OVERVIEW.TXT 文档以了解这里的情况。

宿主服务：

host:version
    请求 ADB 服务器提供其内部版本号。

host:kill
    请求 ADB 服务器立即退出。这在 ADB 客户端检测到升级后运行着一个过时的服务器时使用。

host:devices

host:devices-l
    请求返回可用 Android 设备及其状态的列表。devices-l 包括状态中的设备路径。
    在 OKAY 之后，这是由一个 4 字节的十六进制长度，然后是一个字符串，客户端将原样转储，然后连接关闭。

host:track-devices
host:track-devices-proto-binary
host:track-devices-proto-text
    这些是 host:devices 的变体，它们不会关闭连接。相反，每当设备添加/移除或给定设备的状态更改时，都会发送一个新的设备列表描述。
    变体 [-proto-binary] 是二进制 protobuf 格式。
    变体 [-proto-text] 是文本 protobuf 格式。

host:emulator:\<port>
    当一个新的模拟器启动时，这是发送到 ADB 服务器的特殊查询。\<port> 是一个十进制数，对应于模拟器的 ADB 控制端口，即模拟器将自动转发到在模拟器系统中运行的 adbd 守护进程的 TCP 端口。
    这种机制允许 ADB 服务器知道何时启动新的模拟器实例。

host:transport:\<serial-number>
    请求切换到由 \<serial-number> 标识的设备/模拟器的连接。在 OKAY 响应后，每个客户端请求将直接发送到在设备上运行的 adbd 守护进程。
    （用于实现 -s 选项）

host:transport-usb
    请求切换到通过 USB 连接到宿主机器的一台设备。如果有多于一台这样的设备，这将失败。（用于实现 -d 方便选项）

host:transport-local
    请求切换到通过 TCP 连接的一台模拟器。如果有多于一个这样的模拟器实例在运行，这将失败。（用于实现 -e 方便选项）

host:transport-any
    另一个 host:transport 变体。请求切换到连接到/在宿主上运行的设备或模拟器。
    如果有多于一个这样的设备/模拟器可用，将会失败。（当没有提供 -s, -d 或 -e 时使用）

host-serial:\<serial-number>:\<request>
    这是一种特殊形式的查询，其中 'host-serial:\<serial-number>:' 前缀可以用来指示客户端正在请求 ADB 服务器提供与特定设备相关的信息。\<request> 可以是下面描述的格式之一。

host-usb:\<request>
    用于针对连接到宿主的单个 USB 设备的 host-serial 的变体。如果没有或多于一个，这将失败。

host-local:\<request>
    用于针对在宿主上运行的单个模拟器实例的 host-serial 的变体。如果没有或多于一个，这将失败。

host:\<request>
    当请求与设备相关的信息时，'host:' 也可以被解释为“任何连接到/在宿主上运行的单个设备或模拟器”。

\<host-prefix>:get-serialno
    返回相应设备/模拟器的序列号。
    请注意，模拟器序列号的形式为 "emulator-5554"

\<host-prefix>:get-devpath
    返回相应设备/模拟器的设备路径。

\<host-prefix>:get-state
    以字符串形式返回给定设备的状态。

\<host-prefix>:forward:\<local>;\<remote>
    请求 ADB 服务器将本地连接从 \<local> 转发到给定设备上的 \<remote> 地址。
    在这里，\<host-prefix> 可以是上面描述的 host-serial/host-usb/host-local/host 前缀之一，并指示要定位的设备/模拟器。

​    \<local> 的格式是：
​        tcp:\<port>      -> 本地主机上的 TCP 连接：\<port>
​        local:\<path>    -> 在 \<path> 上的 Unix 本地域套接字

​    \<remote> 的格式是：
​        tcp:\<port>      -> 设备上的 TCP 本地主机：\<port>
​        local:\<path>    -> 设备上的 Unix 本地域套接字
​        jdwp:\<pid>      -> VM 进程 \<pid> 中的 JDWP 线程
​        vsock:\<CID>:\<port> -> 给定 CID 和端口上的 vsock

​    甚至可以是下面描述的任何一个本地服务。

\<host-prefix>:forward:norebind:\<local>;\<remote>
    与 \<host-prefix>:forward:\<local>;\<remote> 相同，但如果从 \<local> 已经存在转发连接，则它会失败。
    用于实现 'adb forward --no-rebind \<local> \<remote>'

\<host-prefix>:killforward:\<local>
    移除从 \<local> 的任何现有的本地转发连接。
    这用于实现 'adb forward --remove \<local>'

\<host-prefix>:killforward-all
    移除所有转发的网络连接。
    这用于实现 'adb forward --remove-all'.

\<host-prefix>:list-forward
    列出此服务器的所有现有转发连接。
    这返回类似于以下内容的东西：

​       \<hex4>: 作为 4 个十六进制字符的有效载荷长度。
​       \<payload>: 以下格式的一系列行：

​         \<serial> " " \<local> " " \<remote> "\n"

​    其中 \<serial> 是设备序列号。
​          \<local>  是主机特定的端点（例如 tcp:9000）。
​          \<remote> 是设备特定的端点。

​    用于实现 'adb forward --list'。

本地服务：

下面所有的查询都假定您已经切换了传输到一个真实设备，或者已经使用了上面描述的查询前缀。

shell:command arg1 arg2 ...
    在设备上的 shell 中运行 'command arg1 arg2 ...'，并返回其输出和错误流。请注意，参数必须以空格分隔。如果参数包含空格，它必须用双引号引用。参数不能包含双引号，否则会出现严重问题。

​    请注意，这是 "adb shell" 的非交互式版本。

shell:
    在设备上启动一个交互式 shell 会话。适当地重定向 stdin/stdout/stderr。请注意，ADB 服务器使用此功能来实现 "adb shell"，但也会在使用前对输入进行处理（参见 commandline.c 中的 interactive_shell()）

shell,v2: (API>=24)
    使用 "shell protocol" 的 shell 服务变体，以区分 stdin、stderr，并且还可获取退出代码。

exec:
    使用原始 PTY 的 shell 变体，以免破坏输出。

abb: (API>=30)
    直接连接到设备上的 Binder。此服务不使用空格作为参数分隔符，而是使用 "\u0000"。示例：
    abb:package0install-create

abb_exec: (API>=30)
    abb 的变体。使用原始 PTY，以免破坏输出。示例：
    abb_exec:package0install-write

remount:
    请求 adbd 重新挂载设备的文件系统为可读写模式，而不是只读。这通常在执行 "adb sync" 或 "adb push" 请求之前是必要的。
    此请求可能不会在某些不允许的构建上成功。

dev:\<path>
    打开设备文件，并将客户端直接连接到它以进行读写。对于调试很有用，但可能需要特殊权限，因此可能不在所有设备上运行。\<path> 是从文件系统根目录的完整路径。除了调试，当需要的非平凡协议和 adb shell 不合适时，这还有助于允许在主机上运行的测试自动化直接与设备文件交互。用例：设备外围工厂测试，模拟外围控制（cuttlefish）进行测试自动化。

dev-raw:\<path>
    类似于 dev:\<path>，唯一的区别是设备以原始 tty 模式打开。当默认 tty 设置干扰用于控制设备的协议时，这很有用。

tcp:\<port>
    尝试连接到本地主机上的 tcp 端口 \<port>。

tcp:\<port>:\<server-name>
    尝试从设备连接到机器 \<server-name> 上的 tcp 端口 \<port>。这在调试只能在设备本身上揭示的某些网络/代理问题时可能很有用。

local:\<path>
    尝试连接到设备上的 Unix 域套接字 \<path>

localreserved:\<path>
localabstract:\<path>
localfilesystem:\<path>
    用于访问其他 Android 套接字命名空间的 local:\<path> 的变体。

framebuffer:
    此服务用于将 framebuffer 的快照发送到客户端。

​    它需要足够的权限，但工作方式如下：

​      在 OKAY 之后，服务发送一个 16 字节的二进制结构
​      包含以下字段（小端格式）：

​            depth:   uint32_t:     framebuffer 深度
​            size:    uint32_t:     framebuffer 大小，单位为字节
​            width:   uint32_t:     framebuffer 宽度，单位为像素
​            height:  uint32_t:     framebuffer 高度，单位为像素

​    当前实现中，深度始终为 16，大小始终为 width*height*2。

​	然后，每当客户端想要一个快照时，它应该通过通道发送一个字节，这将触发服务发送 'size' 字节的 framebuffer 数据。

​	如果 adbd 守护进程没有足够的权限打开 framebuffer 设备，连接将被立即关闭。

jdwp:\<pid>
    连接到进程 \<pid> 的 VM 中运行的 JDWP 线程。

track-jdwp
    这用于定期向客户端发送 JDWP pids 列表。
    返回数据的格式如下：

​        \<hex4>:    所有内容的长度，作为一个 4 个字符的十六进制字符串
​        \<content>: 一系列 ASCII 行，格式如下：
​                        \<pid> "\n"
​    此服务由 DDMS 使用，以了解哪些可调试进程正在设备/模拟器上运行。

​    请注意，没有一次性服务仅检索一次列表。

track-app:
    “track-jdwp”服务的改进版本，还提到了应用程序是否可进行分析以及其架构。每当列表更改时，都会发送一条

新消息（此服务永不停止）。

​    每条消息都有一个 hex4 长度前缀，后面跟着一个二进制协议缓冲区。例如：

​    process {
​      pid: 18595
​      debuggable: true
​      architecture: "arm64"
​    }
​    process {
​      pid: 18407
​      debuggable: true
​      profileable: true
​      architecture: "arm64"
​    }
​    注意：从 [app_processes.proto] 生成一个解析器。

sync:
    这启动了文件同步服务，用于实现 "adb push" 和 "adb pull"。由于这项服务相当复杂，它将在名为 SYNC.TXT 的配套文档中详细说明。

reverse:\<forward-command>
    这实现了 'adb reverse' 功能，即从设备到主机的套接字连接的反向能力。\<forward-command> 是上面描述的转发命令之一，例如：

​      list-forward
​      forward:\<local>;\<remote>
​      forward:norebind:\<local>;\<remote>
​      killforward-all
​      killforward:\<local>

​    请注意，在这种情况下，\<local> 对应于设备上的套接字，而 \<remote> 对应于主机上的套接字。

​    reverse:list-forward 的输出与 host:list-forward 相同，只是 \<serial> 将仅为 'host'。







原文：https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/SERVICES.TXT

