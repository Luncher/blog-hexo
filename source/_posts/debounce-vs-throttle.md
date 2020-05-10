---
title: debounce vs throttle
date: 2020-05-11 02:33:50
tags: [debounce,throttle]
categories: [web]
---

### 背景

`debounce` vs `throttle` 是前端开发常用的工具函数。日常过程中没有太注意其中的细节差异。凭借印象都知道它们都是延迟某个函数的执行，用于性能优化的目的等等。但其实 `debounce` 和 `throttle` 使用场景是完全不一样的。

<!-- more -->

---

### debounce
`debounce`，中文含义：`去抖动`， 如果用一句话概括，可以表述为：
> 控制某个函数`只`在特定的`空闲时间段后`调用一次。

为了更好的理解 `debounce` 的工作原理，可以对比电梯门。假设有几个人排队进入电梯，电梯门是不会尝试关闭的。只有当电梯门口没有人进出`一段时间后`电梯门才会尝试关闭。


#### 使用场景

日常使用 `debounce` 的场景主要有两个：

+ `resize`、`scroll`
>对 `html` 常用的事件 `debounce`，在特定的时间段内停止触发相关的事件后，才执行目标函数。
```js
window.addEventListener('resize', debounce() => {
    // do something
}, 200)

// or
window.addEventListener('scroll', debounce() => {
    // do something
}, 200)
```

+ `input OnChange`
>对 `input` 输入框数据变化的时候，需要发送请求到服务器获取数据、校验输入的数据合法性等操作，通常也是需要 `debouce`。


#### 实现

先来实现一个基础的版本：

```js
function debounce(func: (...args: any[]) => void, wait: number) {
  let timer: number | undefined = undefined;
  let result: any = undefined
  return function debounced(...args: any[]) {
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
    timer = setTimeout(() => {
      result = func(...args);
    }, wait);
    
    return result
  };
}
```
`debounce` 本身是一个高阶函数，传入目标函数，返回一个 `debounced` 函数。在调用 `debounced` 之后会开启一个定时器，如果在定时器时间结束之前再次调用 `debounced` 会重置该定时器，在定时器结束之后则调用对应的目标函数。`debounced` 返回最后一次调用目标函数的返回值或者 `undefined`(初始状态)。

#### 高级选项

前面看到的 `debounced` 函数会在 `某个空闲时间之后`调用目标函数，`underscore` 和 `lodash` 等库提供的实现还支持 `leading edge` 模式，可以理解成：
>控制某个函数`只`在特定的`空闲时间开始时段`调用一次。

```js

export function debounceWithEdge(
  func: (...args: any[]) => void,
  wait: number,
  options: { edge: "leading" | "tailing" }
) {
  let timer: number | undefined = undefined;
  let allowInvoke = true;
  let result: any = undefined;

  return function debounced(...args: any[]) {
    if (options.edge === "leading") {
      if (allowInvoke) {
        result = func(...args);
        allowInvoke = false;
      }
    }

    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }

    timer = setTimeout(() => {
      if (options.edge === "leading") {
        allowInvoke = true;
      } else {
        result = func(...args);
      }
    }, wait);

    return result;
  };
}
```
对于 `leading` 模式，在首次触发 `debounced` 函数的时候调用一次，并开启一个定时器，在定时器结束之前，如果再次触发 `debounced` 函数则重置该定时器。定时器结束之后，标记允许再次调用目标函数。

---

### throttle

`throttle` 中文名称`节流阀`，如果用一句话来概括的话，可以表述成：
>控制某一函数在特定时间范围内`最多`允许调用一次。

#### 使用场景

+ 无限滚动

>对于无限滚动的 `web` 页面。在用户滚动内容区域到某一位置的时候需要加载数据，填充到内容区域，实现数据无限的滚动加载效果。而 `debounce` 需要某一`静置时间`才会调用目标函数，所以对于这种场景 `throttle` 是恰当的选择。

#### 实现

`throttle` 基于 `debounce` 来实现，不过增加了一个最大等待时间，保证在等待时间结束的时候，目标函数被调用一次。

基于 `debounceWithEdge` 实现 `throttle`。

```js

export function debounceWithEdge(
  func: (...args: any[]) => void,
  wait: number,
  options: { edge: "leading" | "tailing"; maxWait?: number }
) {
  //...

  let waitTimer: number | undefined = undefined;
  let lastDatetime = 0;

  return function debounced(...args: any[]) {
    if (options.maxWait) {
      if (lastDatetime === 0) {
        lastDatetime = Date.now();
      }

      if (waitTimer == null) {
        waitTimer = setTimeout(() => {
          if (Date.now() - lastDatetime >= options.maxWait!) {
            result = func(...args);
            if (timer != null) {
              clearTimeout(timer);
              timer = undefined;
            }
          }
          waitTimer = undefined;
        }, options.maxWait);
      }
    }
   //...
 }
}
   
```
>在 `debounce` 的基础之上增加了一个定时器，确保目标函数至少会被调用一次。

---

### 注意事项

+ 推荐使用，`lodash` 或者 `underscore` 的实现。
一方面自己实现的容易有缺陷，二是第三方库实现的功能完善，譬如 `lodash` 版本的实现还提供了诸如 `cancel` 等操作。


+ 不要重复调用 `debounce`、`throttle`
`debounce` 和 `throttle` 每次调用都返回一个新的函数，重复调用则起不到本来的效果，还可能导致错误。

---

### 总结
+ `debounce` 控制函数在某一个空闲时间之后调用一次
+ 可以通过参数控制 `debounce` 调用的时机，即：`tailing` 或 `leading`
+ `throttle` 在 `debounce` 基础上确保函数在特定时间内最多被调用一次
+ 推荐使用第三方库现成的实现，一来它们都经过稳定的测试，功能也比较完善。还需要注意的是，不要重复调用 `debounce`、`throttle`。

---

### 参考

[the-difference-between-throttling-and-debouncing](https://css-tricks.com/the-difference-between-throttling-and-debouncing/)
[debouncing-throttling-explained-examples/](https://css-tricks.com/debouncing-throttling-explained-examples/)

[lodash-debounce.js](https://github.com/lodash/lodash/blob/master/debounce.js)
