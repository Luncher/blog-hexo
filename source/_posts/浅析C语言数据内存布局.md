---
title: 浅析C语言数据内存布局
date: 2014-01-21 13:22:03
tags: c
categories: server
---

  对于程序员而言，详细了解数据内存布局十分必要，否则自己常常犯一些错误却不知为什么。只有做到对内存布局心中有数，编写程序才会游刃有余。遇到问题也能想对方向。下面就C语言内存布局做简要分析。

<!-- more -->

### 一.几个主要的位置段
+ .bss段，之前看过书上解释其为blocked started by symbol。不去追究具体含义，简单而言bas段放的是未初始化的和初始化为 0 的生命周期为全局性质的变量。先通过一段实例代码来探个究竟。

```shell

lc@lc-Lenovo:~/work/test/demo$ cat test.c 
#include <stdio.h>
#include <stdlib.h>
char anArray1[1024*1024];
char anArray2[1024*1024] = {0};

int main(int argc, char* argv[])
{
	
	static char anArray3[1024*1024];
	static char anArray4[1024*1024] = {0};

	return (0);
}
lc@lc-Lenovo:~/work/test/demo$ gcc test.c 
lc@lc-Lenovo:~/work/test/demo$ ls -l a.out 
-rwxrwxr-x 1 lc lc 7438  8月 20 15:42 a.out

```

>可以看到可执行文件7k

```shell
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out | grep bss
 24 .bss          00400020  0804a020  0804a020  0000101c  2**5
```

>可以看到bss段在4M.

如果我们初始化为1而不是0看结果为：

```shell
lc@lc-Lenovo:~/work/test/demo$ cat test.c 
#include <stdio.h>
#include <stdlib.h>

char anArray1[1024*1024];
char anArray2[1024*1024] = {1};

int main(int argc, char* argv[])
{
	
	static char anArray3[1024*1024];
//	static char anArray4[1024*1024] = {0};

	return (0);
}
lc@lc-Lenovo:~/work/test/demo$ vim test.c 
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out | grep bss
 24 .bss          00200020  0814a040  0814a040  00101040  2**5
```

>这里可以验证了我们的想法，bss段只占用运行时候内存空间。


  现代大多数操作系统, 在加载程序时,会把所有的 bss 全局变量清零。(在一些嵌入式设备上，我们在编写启动代码的时候，需要手动执行bss段清0.)但为保证程序的可移植性,手工把这些变量初始化为 0 也是一个好习惯,这样这些变量都有个确定的初始值。当然作为全局变量,在整个程序的运行周期内,bss 数据是一直存在的。


+ .data段
data段主要放的是初始化为非0的生命周期为全局性质的变量。上面的例子上，我们把数组的初始化修改为非0值，可以看到数据从bss转移到data段.

```shell

lc@lc-Lenovo:~/work/test/demo$ cat test.c 
#include <stdio.h>
#include <stdlib.h>

char anArray1[1024*1024];
char anArray2[1024*1024] = {0};

int main(int argc, char* argv[])
{
	
	static char anArray3[1024*1024] = {1};
	static char anArray4[1024*1024] = {0};

	return (0);
}
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out |grep bss
 24 .bss          00300020  0814a040  0814a040  00101040  2**5
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out |grep .data
 14 .rodata       00000008  08048480  08048480  00000480  2**2
 23 .data         00100020  0804a020  0804a020  00001020  2**5

```

>可以看到data段放置了初始化为非0 的变量。

```shell
lc@lc-Lenovo:~/work/test/demo$ ls -l a.out 
-rwxrwxr-x 1 lc lc 1056050  8月 20 16:04 a.out
```

通过观察可执行文件大小我们可以发现data段即占用可执行文件空间，又占用运行时候内存空间。而bss段只占用运行时候内存空间。

+ .rodata段
rodata 的意义同样明显,ro 代表 read only,rodata 就是用来存放常量数据的。关于 rodata 类型的数据,要注意以下几点:
o 常量不一定就放在 rodata 里,有的立即数直接和指令编码在一起,存放在代码段(.text)中。
o 对于字符串常量,编译器会自动去掉重复的字符串,保证一个字符串在一个可执行文件(EXE/SO)中只存在一份拷贝。o rodata 是在多个进程间是共享的,这样可以提高运行空间利用率。
o 在有的嵌入式系统中,rodata 放在 ROM(或者 norflash)里,运行时直接读取,无需加载到RAM 内存中。
o 在嵌入式 linux 系统中,也可以通过一种叫作 XIP(就地执行)的技术,也可以直接读取,而无需加载到 RAM 内存中。
o 常量是不能修改的,修改常量在 linux 下会出现段错误。由此可见,把在运行过程中不会改变的数据设为 rodata 类型的是有好处的:在多个进程间共享,可以大大提高空间利用率,甚至不占用 RAM 空间。同 时由于 rodata 在只读的内存页面(page)中,是受保护的,任何试图对它的修改都会被及时发现,这可以提高程序的稳定性。字符串会被编译器自动放到 rodata 中,其它数据要放到 rodata 中,只需要加 const 关键字修饰就好了。

```shell
lc@lc-Lenovo:~/work/test/demo$ cat test.c 
#include <stdio.h>
#include <stdlib.h>

const char anArray1[1024*1024] = {1};
char anArray2[1024*1024] = {0};

int main(int argc, char* argv[])
{
	
const	static char anArray3[1024*1024] = {1};
	static char anArray4[1024*1024] = {0};

	return (0);
}
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out |grep rodata
 14 .rodata       00200020  08048480  08048480  00000480  2**5
lc@lc-Lenovo:~/work/test/demo$ ls -l a.out 
-rwxrwxr-x 1 lc lc 2104590  8月 20 16:15 a.out
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out |grep bss
 24 .bss          00200020  0824a020  0824a020  0020101c  2**5
lc@lc-Lenovo:~/work/test/demo$ objdump -h a.out |grep data
 14 .rodata       00200020  08048480  08048480  00000480  2**5
 23 .data         00000008  0824a014  0824a014  00201014  2**2

```

+ text 段

text 段存放代码(如函数)和部分整数常量,它与 rodata 段很相似,相同的特性我们就不重复了,主要不同在于这个段是可以执行的。

+ stack段  

栈用于存放临时变量和函数参数。栈作为一种基本数据结构,我并不感到惊讶,用来实现函数调用,这也司空见惯的作法。直到我试图找到另外一种方式实现递归操作时,我才感叹于它的巧妙。要实现递归操作,不用栈不是不可能,只是找不出比它更优雅的方式。尽管大多数编译器在优化时,会把常用的参数或者局部变量放入寄存器中。但用栈来管理函数调用时的临时变量(局部变量和参数)是通用做法,前者只是辅助手段,且只在当前函数中使用,一旦调用下一层函数,这些值仍然要存入栈中才行。通常情况下,栈向下(低地址)增长,每向栈中 PUSH 一个元素,栈顶就向低地址扩展,每从栈中 POP 一个元素,栈顶就向高地址回退。一个有兴趣的问 题:在 x86 平台上,栈顶寄存器为 ESP,那么 ESP 的值在是 PUSH 操作之前修改呢,还是在 PUSH 操作之后修改呢?PUSH ESP 这条指令会向栈中存入什么数据呢?据说 x86 系列 CPU 中,除了 286 外,都是先修改 ESP,再压栈的。由于 286 没有 CPUID 指令,有的 OS 用 这种方法检查 286 的型号。要注意的是,存放在栈中的数据只在当前函数及下一层函数中有效,一旦函数返回了,这些数据也自动释放了,继续访问这些变量会造成意想不到的错误。

+ 堆(heap) 

堆是最灵活的一种内存,它的生命周期完全由使用者控制。标准 C 提供几个函数: malloc 用来分配一块指定大小的内存。 realloc 用来调整/重分配一块存在的内存。 free 用来释放不再使用的内存。 ... 使用堆内存时请注意两个问题:alloc/free 要配对使用。内存分配了不释放我们称为内存泄露(memory leak),内存泄露多了迟早会出现 Out of memory 的错误,再分配内存就会失败。当然释放时也只能释放分配出来的内存,释放无效的内存,或者重复 free 都是不行的,会造成程序 crash。分配多少用多少。分配了 100 字节就只能用 100 字节,不管是读还是写,都只能在这个范围内,读多了会读到随机的数据,写多了会造成的随机的破坏。这种情况我们称为缓冲区溢出(buffer overflow),这是非常严重的,大部分安全问题都是由缓冲区溢出引起的。手工检查有没有内存泄露或者缓冲区溢出是很困难的,幸好有些工具可以使用,比如 linux下有 valgrind,它的使用方法很简单,大家下去可以试用一下,以后每次写完程序都应该用valgrind 跑一遍.