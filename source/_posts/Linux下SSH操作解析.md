---
title: Linux下SSH操作解析
date: 2015-01-13 23:19:34
tags: ssh
categories: server
---

### 1.查看SSH状态：

service sshd status

查看ssh是否已经启动以及一些状态信息

### 2.启动SSH服务：
systemctl restart sshd.service

ps:fedora下的一些基本服务都是通过systemctl restart/stop xxx.service操作来控制的，例如apache的服务器：httpd.service、防火墙服务firewalld.service等。

### 3.SSH配置文件路径：
/etc/ssh/sshd_config。配置ssh连接的端口号，权限等信息

### 4.关闭防火墙
systemctl disable firewalld.service

    把防火墙整个关闭不太合适，使用下面的命令比较好一些：

### 5.将端口22（或者自定义的其他端口）加到防火墙的设置中，标记为Accept
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

    查看ssh的配置文件可以看到默认端口号是22，所以在防火墙解除屏蔽

### 6.防火墙配置文件路径：
/etc/sysconfig/iptables

    SSH组件的一些基本操作：

首先登录远程服务器：

    ssh user@192.168.1.28

    user表示远程服务器的用户名，这里需要输入密码。

利用scp进行文件操作：

文件上传：scp -r /home/xxx user@192.168.1.28:/home/xxx

文件下载：和文件上传的路径对调下就OK了。

利用sftp进行文件上传和下载：

sftp和ftp工具操作类似，便于目录资源的管理。

登录：

格式：sftp -oPort=<port> <user>@<host>
通过sftp连接<host>，端口为<port>，用户为<user>。


sftp连接成功之后常用操作命令如下：
help/? 打印帮助信息。

```shell
pwd 查看远程服务器当前目录；

lpwd 查看本地系统的当前目录。

cd <dir> 将远程服务器的当前目录更改为<dir>

lcd <dir> 将本地系统的当前目录更改为<dir>。

ls 显示远程服务器上当前目录的文件名；

ls -l 显示远程服务器上当前目录的文件详细列表

ls <pattern> 显示远程服务器上符合指定模式<pattern>的文件名；

ls -l <pattern> 显示远程服务器上符合指定模式<pattern>的文件详细列表。

lls 显示本地系统上当前目录的文件名；

lls的其他参数与ls命令的类似。

get <file> 下载指定文件<file>；
get <pattern> 下载符合指定模式<pattern>的文件。
put <file> 上传指定文件<file>；  
get <pattern> 上传符合指定模式<pattern>的文件。  
progress 切换是否显示文件传输进度。
mkdir <dir> 在远程服务器上创建目录；   

lmkdir <dir> 在本地系统上创建目录。  

exit/quit/bye 退出sftp。  
! 启动一个本地shell。  
! <commandline> 执行本地命令行。

其他命令还有：chgrp, chmod, chown, ln, lumask, rename, rm, rmdir, symlink, version。

谨记：在sftp模式下对本地文件的操作前面会多一个'l'
```


免密码登陆：

ssh提供了一套密钥对验证机制，把公钥文件上传服务器，并导入公钥库文件。这样客户端在以后不用输入密码可以登陆了。

### 一、生成密钥文件：

```shell
[luncher@localhost test]$ ssh-keygen -t rsa
Generating public/private rsa key pair.
Enter file in which to save the key (/home/luncher/.ssh/id_rsa): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/luncher/.ssh/id_rsa.
Your public key has been saved in /home/luncher/.ssh/id_rsa.pub.
The key fingerprint is:
9e:39:ec:d8:fa:46:02:6a:d1:36:b9:83:04:75:95:b9 luncher@localhost.localdomain
The key's randomart image is:
+--[ RSA 2048]----+
| .. ...o         |
|.  .  o          |
| . . . .         |
|  o * E          |
| . = +  S        |
|  + o .o.o       |
| .   . o*        |
|       +..       |
|      o++        |
+-----------------+

```

### 二、利用scp命令把公钥拷贝到服务器

```shell

[luncher@localhost test]$ scp /home/luncher/.ssh/id_rsa.pub luncher@192.168.1.17:/tmp
id_rsa.pub                                    100%  411     0.4KB/s   00:00    
[luncher@localhost test]$ 

```

### 三、在服务器端把公钥导入验证key文件

```shell
cat /tmp/id_rsa.pub /home/luncher/.ssh/authorized_keys
```

### 四、用ssh-agent和ssh-add管理密钥
ssh-agent是用于管理密钥，ssh-add用于将密钥加入到ssh-agent中，SSH可以和ssh-agent通信获取密钥，这样就不需要用户手工输入密码了。


End~
