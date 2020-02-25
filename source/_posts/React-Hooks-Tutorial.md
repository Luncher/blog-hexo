---
title: React Hooks Tutorial
date: 2019-03-13 21:53:36
tags: [react,hooks]
categories: web
---

## Hooks的定义

>Hook是一个函数，在不创建类的前提下，使用`React state`以及`React`的其他特性。


## 为什引入Hooks

+ 状态相关的逻辑难以重用、测试
+ 复杂组件难以理解，嵌套过深(需要引入`HOC`、`render props`等概念)
+ 类相比函数更加难以理解

<!-- more -->

## Hooks详解 

### state hooks
>给函数组件提供state特性。

1. state hook通过replace的方式更新数据而不是merge
2. state值会在多次执行的时候保持


### effect hooks
>hooks会对其他组件产生副作用，并且不能在渲染的时候执行。提供统一的API，提供和类组件的`componentDidMount`、`componentDidUpdate`、`componentWillMount`一样的功能。

1. 每次渲染之后都执行某一项操作(包含初始化和更新操作)
2. 每次渲染之前会执行清理函数(如果有的话)

side effect 操纵类型：
+ 修改DOM
+ 接口获取数据
+ 状态订阅操作

分类：
1. 不需要清理的`effect`
2. 需要清理的`effect`
>useEffect返回一个清理函数,在运行下一次渲染之前执行清理函数。

**总结**
1. 使用多个`useEffect`组件分离关注点
>按照`state`和`effect`分离关注点。尽可能解耦

2. 为什么要在每次`Update`的时候运行`effect`函数
>避免在数据变更`componentDidUpdate`的时候，由于资源没有释放导致的`BUG`问题。

3. 优化性能跳过不必要的`useEffect`执行
>useEffect第二个参数由于比较，如果两次执行的时候第二个参数相同则不会执行`useEffect`内的函数。如果传递的是一个空数组，那么只会执行一次。


## Hooks规则

+ 只能在函数组件内使用
+ 只能在函数组件内顶层作用域使用

原因：
>React 依赖于`hook`的执行顺序来对照`state`和`useState`, 以及`effect function`。这样在`function component`反复执行的时候才不会出错。


## 构建自己的组件

>解决HOC、render props同样的问题，但是不引入新的组件。

`hook`使用`use`开头，函数内可能会调用其他`hook`。
