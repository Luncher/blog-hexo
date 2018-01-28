---
title: iptables配置
categories: server
date: 2015-10-07 10:37:03

---
### 1、Iptables介绍

Centos系统内建了一个强大的防火墙，通常又被称为`iptables`。准确的说应该叫iptables/netfilter。iptables工作于用户层，用户通过命令行给防火墙预定规则表。netfilter是一个内核模块，完成实际的过滤工作。有许多GUI软件方便用户来设置防火墙规则，但都缺乏一定的灵活性，并且限制用户了解其中真正发生了什么。

在开始配置Iptables之前，我们需要知道知道一些它是如何工作的。Iptables利用到了 IP 地址、协议(tcp,udp,icmp)和端口。我们不需要成为这方面的专家，但多少知道一些有助于理解iptables是如何工作的。

Iptables给预定义的链路(INPUT、OUTPUT、FORWARD)设置规则。链路校验IP包并根据定义的规则对其做相应的处理，如：接受、丢弃等。对包的处理又被称为：`targets`。两个通常用到的`target`一个是`DROP`用于丢弃一个包、一个是`ACCEPT`用于接受一个包。

#### 链路  
有三个预定义的链路定义在`filter`表内，我们可以给它添加规则来处理通过链路的IP包。三个链路分别是：  
- INPUT -所有发往本机的数据包
- OUTPUT -所有从本机输出的数据包  
- FORWARD -所有的即不是发往本机也不是从本机发出的数据包，但是需要通过本机的数据包。通常用在本机当作一个路由器的情况下。

所有的规则最终被添加到链路的一张表内。一个数据包在链路的规则表内轮流被校验，从顶部开始，一旦匹配到规则，规则定义的行为被执行，例如接受(ACCEPT)、丢弃(DROP)数据包。一旦数据包被处理、后续的规则将不会被执行。如果一个数据包没有匹配到任何一条规则，那么链路的默认行为会被使用，这被称为链路的默认策略。通常有两种默认的链路配置策略：  

+ 1、 设置默认策略丢弃所有的数据包、添加规则指定我们需要允许的IP地址或者指定端口的服务，如FTP、web服务器、Samba文件服务等。  
+ 2、 设置默认策略接受所有的数据包、添加规则指定我们需要拒绝的IP地址或者指定端口等。

### 2、起步

确认iptables已经安装：  
```
[luncher@localhost ide-server]$ rpm -qa iptables
iptables-1.4.21-13.fc21.x86_64
[luncher@localhost ide-server]$
```

查看当前配置信息：  
```
[luncher@localhost ide-server]$ sudo iptables -L
[sudo] password for luncher: 
Chain INPUT (policy DROP)
target     prot opt source               destination         
ACCEPT     all  --  anywhere             anywhere            
ACCEPT     all  --  anywhere             anywhere             state RELATED,ESTABLISHED
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh

```

我们可以看到ssh服务默认被centos服务允许了。

iptables 还有一些基本的命令如：start/restart/off/on等，和其他系统服务器基本类似。


### 3、写一个简单的规则设置

一组简单的配置规则：  
```  
# iptables -P INPUT ACCEPT
# iptables -F
# iptables -A INPUT -i lo -j ACCEPT
# iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# iptables -P INPUT DROP
# iptables -P FORWARD DROP
# iptables -P OUTPUT ACCEPT
# iptables -L -v
```

看看最终的结果：
```
[luncher@localhost ide-server]$ sudo iptables -L -v
Chain INPUT (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
   34  6368 ACCEPT     all  --  any    any     anywhere             anywhere             state RELATED,ESTABLISHED
    0     0 ACCEPT     tcp  --  any    any     anywhere             anywhere             tcp dpt:ssh

```

下面来详细解释一下以上八个命令的具体作用：  
+ 1、 iptables -P INPUT ACCEPT  
如果我们远程登录到服务器修改配置，那么我们必须临时给INPUT设置默认的策略ACCEPT，否则一旦我们把规则表清空，我们将无法登录服务器。  

+ 2、 iptables -F  
用户清空`filter`表当前的配置规则。以便添加新规则。  

+ 3、iptables -A INPUT -i lo -j ACCEPT  
给INPUT链的末尾添加规则，当数据包进入本地网络使用的接口为`localhost`时，那么跳转(-j)到行为接受(ACCEPT)。多数软件都回和本地主机(localhost)适配器通信，所以必须开启该通道。  

+ 4、iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT  
接下来我们要保障已经建立的链路通信，这里我们使用`state`判断数据包的状态，辨别这是一个新的链接、还是一个已经建立的链接。允许接受已经建立链接的数据包。

+ 5、iptables -A INPUT -p tcp --dport 22 -j ACCEPT  
`SSH`链接基于22端口，我们必须开启ssh服务。`--dport`选项基于tcp包的目的端口来匹配包，`--sport`类似。  

+ 6、iptables -P INPUT DROP  
为`INPUT`链设置默认的行为(`target`)。`-P`用于指定链路(`--policy`)。  

+ 7、iptables -P FORWARD DROP  
为`FORWARD`链设置默认行为(`target`)。  

+ 8、iptables -P OUTPUT ACCEPT  
最后，我们设置`OUTPUT`允许默认输出，表明我们信任我们的用户。  

+ 9、iptables -L -v  
列出当前的配置规则  


### 4、接口  

在上面例子，我们可以给以指定网络接口的数据包设置规则，例如：

```
iptables -A INPUT -i lo -j ACCEPT  
```  

常用的网口还有:`eth0`、`eth1`等等。  


### 5、IP地址

有时候对整个网口做限制还是不够精确，我们需要更加细致的规则来达到我们说要的效果。例如，添加一个可信的IP地址：
```
iptables -A INPUT -s 192.168.0.51 -j ACCEPT  
```  
有时候一个IP还是不够用，我们需要对一个地址范围的IP定制规则：
```
iptables -A INPUT -s 192.168.0.0/51 -j ACCEPT 
```  
为了防止`IP`地址伪造，我们也可以根据`mac`地址来过滤：  
```
iptables -A INPUT -s 192.168.0.51 -m mac --mac-source 0a:d0:62:de -j ACCEPT
```  

### 6、端口和协议

上面我们看到了一些基于IP地址的过滤规则配置，接下来我们来学习根据协议以及端口号来设置过滤规则。在我们开始之前，必须知道一些特定服务的协议以及端口号，例如：bittorrent 服务，使用的是`tcp`协议，端口号默认`6881`：  
```
iptables -A INPUT -p tcp --dport 6881 -j ACCEPT
```  
如果我们要对一系列连续的端口做相同的操作可以这样：  
```
iptables -A INPUT -p tcp --dport 6881:6991 -j ACCEPT  
```  
注意：在限制端口之前必须指定协议类型，常用的有：tcp、udp、icmp。  

### 7、总结  
来看一个生产机器上的防火墙配置：

```
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j ACCEPT
-A INPUT -m state --state NEW -s 117.135.137.133 -m tcp -p tcp --dport 10050 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 10240 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A INPUT -p tcp -m tcp --dport 80 -j ACCEPT
-A FORWARD -j REJECT --reject-with icmp-host-prohibited
-A OUTPUT -p tcp -m tcp --sport 10240 -j ACCEPT
COMMIT

```  
解释几个选项  
- 1、*filter表示当前的表名为`filter`，一般不可以修改  
- 2、:INPUT ACCEPT [0:0]表示链的详细说明，`:<chain-name> <chain-policy> [<packet-counter>:<byte-counter>]`。 
- 3、COMMIT：每个表的描述都以`COMMIT`关键字结束  
- 4、--reject-with icmp-host-prohibited：设置REJECT(target)的返回信息，也就是给发送者返回拒绝信息。可以参看常用的`icmp`类型。

---  
*到这里，我们学习了`iptables`的基础配置。相信经过不断的刻意练习，iptables配置一定烂熟于心。*





