本文是关于ADB（Android Debug Bridge）服务器与客户端之间文件相关请求的文档。

这个文件试图记录客户端可以向adbd守护进程的ADB服务器发出的与文件相关的请求。查看OVERVIEW.TXT文档以了解这里发生了什么。查看SERVICES.TXT以了解更多可能的请求。 

同步服务： 

使用SERVICES.TXT中描述的协议请求同步服务（"sync："），将连接设置为同步模式。这种模式是一种二进制模式，与常规的ADB协议不同。连接保持在同步模式，直到明确终止（见下文）。

在发送初始的"sync:"命令后，服务器必须根据常规协议响应"OKAY"或"FAIL"。 

在同步模式下，服务器和客户端将频繁使用八个字节的数据包进行通信。在本文档中，这些通信被称为同步请求和同步响应。前四个字节构成了一个标识符，指定了同步请求。它由四个ASCII字节表示，以便在调试时更易于人类阅读。最后四个字节是一个小端整数，有各种用途。下面的文档中将称这个数字为“length”。实际上，在同步模式中所有的二进制整数都是小端的。每个同步请求之后，同步模式都会隐式退出，然后按照SERVICES.TXT中描述的进行正常的ADB通信。 

接受以下同步请求： 

LIST - 列出文件夹中的文件 

RECV - 从设备检索文件 

SEND - 向设备发送文件 

STAT - 统计文件信息 

所有上述同步请求后面都必须跟随“length”：length 表示以utf-8字符串表示的远程文件名的字节数。 

LIST： 

列出由远程文件名指定的目录中的文件。服务器将响应零个或多个 directory entries 或“dents” （凹痕）。 

directory entries 将以以下形式返回：

1. 四个字节的同步响应 id "DENT"
2. 四个字节的整数表示文件模式。
3. 四个字节的整数表示文件大小。
4. 四个字节的整数表示最后修改时间。
5. 四个字节的整数表示文件名长度。
6. length 表示以utf-8字符串表示的文件名的字节数。 

当收到同步响应"DONE"时，列表完成。 

SEND： 远程文件名被最后的逗号（","）分隔两部分。第一部分是实际的路径，而第二部分是包含设备上文件权限的十进制编码文件模式。 

请注意，某些文件类型将在复制开始之前被删除，如果传输失败。一些文件类型将不会被删除，这允许 adb push disk_image /some_block_device 工作。 

在此之后，实际文件以块的形式发送。每个块的格式如下。 一个同步请求，其标识符为"DATA"，长度等于块大小。随后是块大小的字节数。这将重复，直到文件传输完成。每个块的尺寸不得超过64k。 文件传输完成后，发送一个同步请求"DONE"，其中长度设置为文件的最后修改时间。服务器对此最后一个请求（但不是块请求）响应一个"OKAY"同步响应（长度可以忽略）。 

RECV： 从设备检索文件到本地文件。远程路径是将返回的文件的路径。就像SEND同步请求一样，接收到的文件被分成块。同步响应标识符是"DATA"，长度是块大小。随后是块大小的字节数。这将重复，直到文件传输完成。每个块的尺寸不得超过64k。 

文件传输完成后，检索到一个同步响应"DONE"，其中长度可以忽略。



原文：https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/SYNC.TXT