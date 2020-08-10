---
title: React 和 Vue 的 Location 同步
date: 2020-08-11 02:31:52
tags: [react,vue]
categories: [web]
---

### Location

浏览器提供了一个 [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) 对象，该对象用于描述当前 URL 的信息，主要包括包含：域名、路径、端口等。`html` 的 `window` 和 `document` 对象都有一个 `location` 对象：

```json
// window.location
{
    //...
    host: "developer.mozilla.org"
    hostname: "developer.mozilla.org"
    href: "https://developer.mozilla.org/en-    US/docs/Web/API/Location"
    origin: "https://developer.mozilla.org"
    pathname: "/en-US/docs/Web/API/Location"
    //...
}
```

<!-- more -->

---

### History

浏览器还提供了一个 [History](https://developer.mozilla.org/en-US/docs/Web/API/History) 对象，该对象主要用于管理浏览器的会话历史。浏览器的会话历史是一个栈的结构，`history` 提供了一些属性和 `api` 用于查看和操作这些会话记录：

```js
// 控制台输入：window.history

{
    //...
    length: 2
    scrollRestoration: "auto"
    state: null
    __proto__: History
    back: ƒ back()
    forward: ƒ forward()
    go: ƒ go()
    length: (...)
    pushState: ƒ pushState()
    replaceState: ƒ replaceState()
    scrollRestoration: (...)
    //...
}

```

+ state

`state` 表示当前的浏览记录的状态信息，通过 `pushState` 设置，或者通过 `replaceState` 修改。

+ pushState

`pushState` 用于新增一条记录，参数如下：

`state object`: 
>可以序列化的用户自定义 `javascript` 对象。通过 `window.history.state` 可以读到最新的浏览记录的状态。

`title`: 
> 浏览器暂时没有支持，留空即可

`URL`:
>新的 `URL` 地址，该地址跟原有的地址必须在同一个域下，否则操作不成功

**注意：**
>`pushState` **不会**导致浏览器马上 `reload` 新的页面（但是浏览器的地址栏会被修改）
>`pushState` **不会**触发 `popevent` 事件，下面会看到

`小 Demo`:

```js
// 当前地址：https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API

// 在浏览器的控制台执行：
window.history.pushState({ foo: 'bar' }, "page 2", "/foo/bar")
// 浏览器的地址栏变成：https://developer.mozilla.org/foo/bar

// window.location 对象变成：
{
    //...
    host: "developer.mozilla.org"
    hostname: "developer.mozilla.org"
    href: "https://developer.mozilla.org/foo/bar"
    origin: "https://developer.mozilla.org"
    //...
}

// window.history.length:
2
// window.history.state:
{foo: "bar"}
```

+ replaceState

`replaceState` 用于修改当前浏览记录的 `state` 信息，不会往栈里面新增一条记录，如：

```js
window.history.replaceState({ foo: 'baz' }, "", "/foo/baz")
// window.history.state:
{foo: "baz"}
```

+ go/back/forward

这几个函数都表示跳转到某个历史记录，区别在于向前/后跳转、跳转到指定的页面。

**注意**
> 1. 这些函数会导致页面重新加载
> 2. 这些函数**会**触发 `popevent` 事件，下面会看到


+ popevent

`popevent` 事件当浏览器的浏览历史发生变化的时候，会给 `window` 抛出该事件。触发 `popevent` 的方式主要有：

1、 go/back/forward
2、 用户点击浏览器的前进后退按钮

---

从上面的例子可以看到，浏览器的 `Location` 变更主要有两种途径：

+ 用户点击浏览器的 `前进`、`后退` 按钮
+ 通过浏览器的 `api`: go/back/forward

>前端框架为了在不同的 `URL` 显示不同的页面，统一"监听" `Location` 的变更，并做了相识的处理。

---

### React 和 Vue 的实现

#### React-Router
`React-Router` 依赖于 [History](https://github.com/ReactTraining/history) 来对这一层进行抽象和封装。提供统一的 [listen](https://github.com/ReactTraining/history/blob/28c89f4091ae9e1b0001341ea60c629674e83627/docs/getting-started.md#listening) 方法监听 `Location` 的变更。同时，维护了一份类似于 `window.history` 的栈信息。


#### Vue-Router

`vue-router` 内置了 [history](https://github.com/vuejs/vue-router/blob/dev/src/history/html5.js) 的抽象处理，干的事情跟 `React-Router` 使用的 `history` 模块差不多。维护了一份类似于 `window.history` 的栈信息。

### Location 同步问题

当同一个前端项目既有 `vue-router` 又用 `react-router` 的时候，部分页面使用 `vue` 来编写，另外一部分基于 `react` 来实现。由于历史原因，当前项目主体结构还是 `vue` (即：侧边栏的 `link` 都是基于 `vue` 实现)。

+ 当页面从 `vue` 切换到 `react`

> `react` 组件会 `didMount` `react-router` 会同步”监听“当前的 `Location` 信息，页面显示正常


+ 当一个 `react` 页面切换到另一个 `react` 页面

> 因为 `vue-router` 和 `react-router` 各种维护了一份“浏览器历史记录”表，所以当点击 `vue` 的 `link` 组件，通过 `pushState` 修改了 `window.history`（前面说过 `pushState` 不会抛出 `popevent` 事件），这个时候 `react-router` 并不会响应这个事件，导致 `react-router` 的维护的信息是旧的，新的 `react` 页面不会正常显示。

+ 当页面从 `react` 切换到 `vue`

>显示正常，因为 `link` 组件的点击事件始终是交给 `vue-router` 来进行处理的。

#### 同步 Location

+ 监听 `vue` 路由变更

```js
const router = new VueRouter({
  mode: 'history',
  routes
})

router.afterEach(() => {
  // 由于直接调用 `window.dispatchEvent`，会导致事件消费方没有办法拿到最新的 location 所以这里 setTimeout
  // 又为了避免 Vue 和 React 两个 history 同时修改 window 上的 location 信息会，所以这里没有选择把最新的 router path dispatch
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(eventLocationChange))
  }, 0)
})
```

+ `react` 消费变更事件

```js
impory routerStore from '...'

export function useSyncLocation() {
  const handleLocationChange = React.useCallback(() => {
    const history = routerStore.history
    history.transitionTo(history.getCurrentLocation())
  }, [])

  React.useEffect(() => {
    window.addEventListener(eventLocationChange, handleLocationChange)
    // 清理事件处理函数
    return () => {
      window.removeEventListener(eventLocationChange, handleLocationChange)
    }
  }, [handleLocationChange])
}
```

---

### 参考

[History](https://developer.mozilla.org/en-US/docs/Web/API/History)
[Working_with_the_History_API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
[diveintohtml5-history](http://diveintohtml5.info/history.html)
[vue-router-html5](https://github.com/vuejs/vue-router/blob/dev/src/history/html5.js)
[ReactTraining-history](https://github.com/ReactTraining/history/blob/master/packages/history/index.ts)

