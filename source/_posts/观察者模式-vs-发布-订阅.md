---
title: 观察者模式 vs 发布/订阅
date: 2020-08-16 12:32:39
tags: [观察者模式,发布订阅]
categories: [设计模式]
---

观察者模式和发布/订阅模式，属于基于`事件`的编程范式的两种使用广泛的实现。这里尝试对两种模式做简要的剖析。

<!-- more -->

### 观察者模式

观察者模式在"4 人帮"设计模式一书中归类为对象行为模式。在 `wikipedia` 文章中，定义如下：
> 在这种模式中，一个目标对象（被观察者）管理所有的依赖于它的对象（观察者），并且在它本身的状态发生变化的时候主动发出通知。这通常通过调用观察者提供的某个函数来实现。

通过观察者模式的定义看出，其主要包含两个对象：

+ 被观察者
+ 观察者

首先来实现一个基础的 `typescript` 版本：

```typescript
interface INotify {
  notify: (...args: any[]) => void
}

class Target {
  observers: INotify[] = []

  observe<T extends INotify>(observer: T) {
    this.observers.push(observer)
  }

  onChange(...args: any[]) {
    this.observers.forEach(it => it.notify(...args))
  }
}

class Foo implements INotify {
  notify(...args: any[]) {
    console.log('Foo receive notify')
  }
}

class Bar implements INotify {
  notify(...args: any[]) {
    console.log('Bar receive notify')
  }
}
```

`Target` 表示目标对象，即：被观察者。其维护了一个观察者对象的列表。当其自身状态发生变化的时候(`onChange`)，通过 `notify` 函数通知观察者对象（所有的观察者必须实现 `INotify` 接口）

观察者模式的实现简单明了，但是它主要存在以下两个问题：

+ 耦合问题
> 每个观察者必须和被观察对象绑定在一起，这引入了耦合。

+ 性能问题
> 在最基本的实现中观察对象必须同步地通知观察者。这可能会导致性能瓶颈。


---


### 发布/订阅模式

发布/订阅模式 定义如下：

> 在 `发布/订阅模式` 有 `发布者` 和 `订阅者`，它们通过`信道`链接到一起。

发布/订阅模式完成了观察者模式的基本功能的同时，也解决了观察者模式的两个主要的缺陷。其主要包含以下三个基本概念：

+ 信道

每个信道都有一个名字，发布者可以往某个信道中发布消息，订阅者可以订阅一个或者多个信道的消息。在这里 `信道` 是一个更加抽象的概念，它一般在其他代码库中实现。可以是：
    1、进程
    2、分布式基础设施
    3、第三方库
    ...
    
**信道的实现细节对用户代码来说是隐藏的。**

+ 发布者

顾名思义就是消息的发布者，它往信道中投递消息。

+ 订阅者

订阅者可以订阅它感兴趣的一个或者多个信道的消息。


发布/订阅模式的主要优点有：
>1、发布者和订阅者的通信是在用户代码之外处理的，通过`信道`降低了发布者和订阅者的耦合性
>2、不同的信道的实现中，发布者和订阅者的通信可能是异步的，实现比较灵活

当然 发布/订阅模式 也有其缺点：
> 比较难以查看当前系统中有哪些发布者、订阅者以及事件的处理情况，这需要借助额外的工具来做 `profile`


目前很多平台都有内置的发布订阅的实现，譬如：`Node.js` 内置的 [events](https://nodejs.org/api/events.html) 模块包含了发布/订阅模式的简单实现：

```js
var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 
event.on('some_event', function() { 
    console.log('some_event 事件触发'); 
}); 

setTimeout(function() { 
    event.emit('some_event'); 
}, 1000); 
```
> `EventEmitter` 仅限于单个进程内的通信。


其他基础设施例如：[Redis](https://redis.io/topics/pubsub#pubsub) 也提供了发布/订阅模式的实现。

---

### 参考

[Publish–subscribe_pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
[Observer_pattern](https://en.wikipedia.org/wiki/Observer_pattern)
[events_class_eventemitter](https://nodejs.org/api/events.html#events_class_eventemitter)
[redis-pubsub](https://redis.io/topics/pubsub#pubsub)
