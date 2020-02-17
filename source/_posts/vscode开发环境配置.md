---
title: vscode开发环境配置
categories: vscode
date: 2016-03-07 12:37:03
---

## 初衷  

一直一来都是`vim`编辑器的忠实用户，说来也没有什么特别的原因，只不过是因为用的久了，习惯罢了。
改变已有的习惯就跟在学习新知识的时候刻意练习会带来同样的体会，会让你感觉不舒服。之所以想放弃使用多年的`vim`
(也就3-4年罢了)转投`vscode`名下.

<!-- more -->
## 前言

> 
学习任何东西都有一个有效的方法论：在了解了一些必要的知识之后，快速开始行动，
刻意练习！在练习中不断总结提高！

科学研究者把人们应对一件事情分为3个步骤：
- 1、认知该事件的方式方法。 
- 2、通过何种方式方法可以完成该事情。
- 3、实践该方法的步骤以及条件。
  

## 安装编辑器

在`github`上找到`vscode`仓库，简要的阅读一下`readme`文档，然后再阅读一下
`How to build and run from source`。`vscode`是基于`electron`开发的，所以再安装过程中需要下载`electron`的平台包，考虑到墙的原因
我们可以自己下载`electron` [electron](https://npm.taobao.org/mirrors/electron),放到`vscode`根目录的`.build`下的`electron`文件夹

另外一种安装方式更为简便，到`vscode`官网下载安装包并安装。  

## 阅读官方文档

`vscode`官方网站是 `https://code.visualstudio.com`。阅读完`overview`以及`setup`下的平台环境完成安装。
对于新手来说接下来应该认真阅读`EDITOR`一章。

## vscode cheatsheet

对于 任意一个软件来说，掌握好了快捷键会提升你的效率，让你有更多的时间专注于有价值的事情上。
`vscode`按下`F1`快捷键，会提示所有的快捷键，还有一种方式：打开`File=>Preferences=>keyboard Shortcuts`
列出所有的快捷键。另外这一章节的内容必须把它背下来：`https://code.visualstudio.com/docs/editor/editingevolved`。

小结：
- vscode `EDITOR`一章  
- vscode cheatsheet  
