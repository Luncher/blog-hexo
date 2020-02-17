---
title: npm-的工作原理
categories: server
date: 2015-11-07 10:37:03
---
### 包(Package)和模块(Module)  

#### 如何定义一个`Package`  

满足如下条件都可以称为一个包：  
- 一个文件夹包含应用程序，使用`package.json`来描述它(a)    
- 一个用gzip压缩的文件夹，满足(a)定义(b)    
- 一个url可以获取(b)描述的压缩包(c)  
- 一个<name>@<version>描述的一个包已经被发布到`npm`仓库 (d)  
- 一个<name>@<tag>描述的包同(e)  
- 一个<name>描述的包，并且具有`latest`标签，满足(e) (f)    
- 一个`git url` 可以被克隆，满足(a) 定义  

<!-- more -->

---  

**即使没有把包推送到公共的`npm`仓库，依然可以从`npm`获得很多好处：**  
+ 如果你只是想写一个基于`nodejs`的应用程序，或者  
+ 如果你想安装一个压缩的包  

`git URL`可以是以下几种格式：  
- git://github.com/user/project.git#commit-ish  
- git+ssh://user@hostname:project.git#commit-ish  
- git+http://user@hostname/project/blah.git#commit-ish  
- git+https://user@hostname/project/blah.git#commit-ish  

`commit-ish` 是一个可以`git checkout`的参数。默认为`master`。  

---  

#### 如何定义一个`Module`  

**`Module`是任何的能被`nodejs`程序使用`require`加载的模块。**满足以下条件均可以称为`Module`：  
+ 一个文件夹包含`package.json`文件并指定了`main`字段  
+ 一个文件夹包含`index.js`文件  
+ 一个`javascript`文件  


#### 大多数`Package`都是一个`Module`  

譬如说一些`cli`程序的`package`只包含一些可执行的命令行程序，并没有提供`main`字段来指定程序供外部使用。 这些`package`不是`module`。  

---  

### npm v2解析包的依赖关系  

想像一下现在有三个模块`module A`、`module B`、`module C`。A依赖B的`V1`版本，C依赖于B的`V2`版本。  
![deps2](http://7xsec6.com1.z0.glb.clouddn.com/deps2.png)  


现在创建一个应用程序依赖`A`和`C`。   
![deps4](http://7xsec6.com1.z0.glb.clouddn.com/deps4.png)  

---  
#### 模块依赖地狱(Dependency Hell)  
包管理器必须必须提供一个`module B`的版本。在`nodejs`之前的`runtime`，都会尝试通过提供一个折中的版本来解决它。
![deps3](http://7xsec6.com1.z0.glb.clouddn.com/deps3.png)  


`npm`采取了另外一种方式，**把依赖的模块包嵌入子目录：**    
![deps](http://7xsec6.com1.z0.glb.clouddn.com/deps.png)  


---  

### npm V3 解析包的依赖关系  

npm3和npm2的不同之处在于：  
> npm2使用嵌套的方式来管理依赖包，`npm3`尝试缓和过长的包依赖路径问题。 把二级依赖的包安装在同一级目录下。  

想像一下我们有一个模块`A`依赖模块`B`。我们在安装模块`A`的时候，在项目的`node_modules`文件夹下： 可以看到 `npm v2`与`npm v3`的差异：  

![deps2deps3](http://7xsec6.com1.z0.glb.clouddn.com/npm3deps2.png)  


现在我们需要安装一个模块`C`，模块`C`依赖模块`B`但是版本与模块`A`依赖的不同：  

![deps3deps3](http://7xsec6.com1.z0.glb.clouddn.com/npm3deps3.png)  


由于`B v1.0`已经安装在`node_modules`目录的根目录下了，不能把`B v2.0`也安装在根目录下。这个时候`npm v3`的处理方式和`npm v2`类似：  

![deps3deps4](http://7xsec6.com1.z0.glb.clouddn.com/npm3deps4.png)  


通过 `npm ls`查看当前项目所有包的依赖关系。如果只是想看顶级包的依赖关系可以执行`npm ls --depth=0`。  

---  
### `npm v3`去重  

**npm dedupe**

该命令会删除`node_modules`顶级目录下没有被使用的模块，并且把被重复依赖的模块移动到顶级目录下。  


