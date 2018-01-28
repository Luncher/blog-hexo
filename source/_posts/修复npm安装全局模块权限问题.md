---
title: 修复npm安装全局模块权限问题
categories: server
date: 2015-11-07 10:37:03
---
> **我们曾经可能都遇到过安装某个模块包的过程中提示`EACCESS`的错误问题。这是由于`npm`全局安装模块的默认路径没有权限导致的。**

---  
有三个方式可以解决该问题：  
- 修改全局安装路径的权限  
- 修改默认安装路径  
- 借助第三方工具安装`node`  


#### 修改安装路径的权限  

- 查看默认全局安装路径  

> npm config get prefix  

对于大多数系统显示目录为：`/usr/local`  

**警告：如果默认路径是在/usr/请跳过该步骤，否则你会搞乱系统权限。**  

- 修改路径权限  

> sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

执行完毕将会把`/usr/local`下的`lib/node_modules`、`bin`、`share`所有权更改为当前用户。  

---  

#### 修改默认全局安装路径  

当你不想修改默认安装路径的权限，因为由此可能会带来一些额外问题，譬如说，修改权限后无法跟当前系统其他用户共享。这个时候可以考虑修改默认的安装路径。

在示例下，我把默认全局安装路径修改到当前用户的`home`目录下面：  

- 1、新建一个全局安装的路径  

> mkdir ~/.npm-global  

- 2、配置`npm`使用新的路径  

> npm config set prefix '~/.npm-global'  

- 3、打开或者新建`~/.profile`，加入下面一行  

> export PATH=~/.npm-global/bin:$PATH  

- 4、更新系统环境变量  

> source ~/.profile  

安装一个全局包试一试：  

> npm install -g jshint 

``` javascript 
[luncher@localhost aaa]$ ls ~/.npm-global/bin/
jshint
[luncher@localhost aaa]$ 
```  

---  

#### 借助第三方工具安装`node`  

- mac系统借助brew安装`node`  

> brew install node  

- centos借助yum工具安装`node`  

> yum install node 
