---
title: Mobx Hooks
date: 2020-05-24 23:54:55
tags: [mobx,hooks]
categories: [react]
---

### 背景

React [16.8](https://reactjs.org/blog/2019/02/06/react-v16.8.0.html) 正式推出 `Hooks` 至今已经一年多了。作为当下炙手可热的状态管理库 `Mobx` 也顺应了这一潮流，推出了 [v6](https://github.com/mobxjs/mobx-react/blob/master/CHANGELOG.md#600) 版本，方便我们在 `Hooks` 环境下，更好的对 `React` 进行状态管理。


这篇文章主要想深入研究一下，`Mobx` 为了适应 `React Hooks` 而作出的一些更新。为了更好的理解 `mobx` 的变更，首先需要了解一些背景知识。

<!-- more -->

---

### Observe State

`Observe State` 表示观察数据状态的含义，如果放到 `React` 语境下，可以理解成：
> 使 `React Component` 响应数据状态的变化。即：当组件内有 `observable state` 变更的时候，自动 `re-render` 当前组件。


`Mobx` 使组件响应数据状态的变化主要有三种方式：

+ `observer HOC`

`hoc` 的方式是自打 `mobx-react` 诞生以来就支持的一种方式，其主要提供了如下能力：
1、响应数据状态的变化
2、给函数组件提供 `memo` 的能力
3、给类组件提供 `pure component` 的能力
4、把类组件的 `props` 和 `state` 转换成 `shallow observable`


+ `Observer Component`

`Observer Component` 出现了也比较早，但是最新版本的实现已经基于 [hooks](https://github.com/mobxjs/mobx-react-lite/blob/master/src/ObserverComponent.ts#L13) 来实现了。其主要目的为：
1、更加细粒度的控制组件的 `re-render`，特别是针对我们需要传递 `render props` 给第三方组件的情形，当 `render props` 内使用了 `observable state`，这个时候我们需要使用 `<Observer>` 包裹 `render props` 的内容。

+ `useObserver hooks`

`useObserver` 是 `mobx-react` 组件响应数据变化的基础。函数组件的 `observer hoc`、`Observer Component` 都是基于 `useObserver` 来实现的。`useObserver` 提供的能力非常单一：`响应数据状态的变化`。其好处在于定制能力比较强，例如：我们可以使用 `useObserver` 配合 [React.memo](https://reactjs.org/docs/react-api.html#reactmemo) 的比较函数，定制化优化组件等。


---

### useLocalStore

`Mobx` 推荐使用 [useLocalStore](https://mobx-react.js.org/state-local) 来组织组件的状态。首先来看一下基本使用姿势：

```ts
const Children = function Children(props: { base: number }) {
//...
  const store = useLocalStore(
    source => ({
      valueWrap: { v: 1 },
      get computedValue() {
        return this.valueWrap.v * source.base;
      },
      incValue() {
        console.log("inc");
        this.valueWrap.v += 1;
      }
    }),
    props
  );
 //...
 }
```

`useLocalStore` 接受两个参数，第一个参数是一个函数，该函数返回一个对象，需要注意的是，该函数只会调用一次，并没有依赖其他状态重新创建对象的机制。这个对象里面可能有：属性、`getter`、函数。`useLocalStore` [内部](https://github.com/mobxjs/mobx-react-lite/blob/master/src/useLocalStore.ts#L19)使用 [observable](https://mobx.js.org/refguide/object.html) 处理该对象，经过处理之后，其转换关系为：

| 类型 | 结果 |
| --- | --- |
| 属性 | observable property(deep) |
| getter | computed |
| 函数 | mobx action |


`useLocalStore` 第二个参数是一个对象，该对象可能是 `props`，也可以是其他任意的非 `observable` 的对象，其内部会调用 [useAsObservableSourceInternal](https://github.com/mobxjs/mobx-react-lite/blob/master/src/useLocalStore.ts#L16)，下面会讲到。

---

### useAsObservableSource

[useAsObservableSource](https://mobx-react.js.org/state-outsourcing), 用于把对象（主要是 `props` 或 其他）转换成 `observable`，转换结果是一个 [shallow observable](https://github.com/mobxjs/mobx-react-lite/blob/master/src/useAsObservableSource.ts#L29) 对象。并且该对象在组件的生命周期内始终保持一份引用，这样在 `useLocalStore` 或者 `useEffect` 等就能正常的引用该对象。`useAsObservableSource` 相较于 `useLocalStore` 差异在于，如果不需要 `action`、`computed`，那么可以用 `useAsObservableSource` 来取代 `useLocalStore`。
因为 `mobx` 推荐使用 `useLocalStore` 组织状态信息，把 `props` 传给 `useAsObservableSource` 处理。 这或许就是函数组件的 `observer hoc` 默认不把 `props` 转换成 `observable` 的原因？

**注意**
>`useAsObservableSource`, 不能正常响应新增、删除属性的变更，具体可以参考之前的文章： `Mobx-Make Property Observable`。

---


### useEffect

日常在使用 `useEffect` 的过程中，`React` 官方提供了一个 [linter插件](https://www.npmjs.com/package/eslint-plugin-react-hooks) 避免我们在使用 `useEffect` 的时候忘记了某些依赖。

但是也有例外的情况，譬如：`useRef` 的返回值不需要被加入 `useEffect` 的 `deps`，否则还可能导致 [BUG](https://github.com/facebook/react/issues/16121)。同样的，`useAsObservableSource` 、`useLocalStore` 的返回值也不需要被加入 `deps`，但是这个时候 `linter` 会给出警告。


通常为了响应 `props` 数据的变化并做一些操作，我们的做法是，使用 `useEffect`，把依赖的 `props` 作为 `deps`，在 `useEffect` 内使用 `reaction`。但是更好的办法是把`props` 交给 `useAsObservableSource` 生成一个 `store`，直接使用这个 `store`。这样的好处是：

+ 避免 `props` 变化的时候重复创建 `reaction`
+ 降低心智负担，不需要一直查看 `useEffect` 依赖了那些 `props`


---

### 总结

- `mobx` 响应数据变更主要有三种方式：`observer hoc`、`Observer Component`、`useObserver`。对于函数组件而言，`useObserver` 是前两者的基础。类组件的 `observer` 会自动把 `props` 和 `state` 转换成 `shallow observable`，而函数组件不会。`observer hoc` 针对函数组件和类组件分别有优化：(React.memo、Pure Component)
- `mobx` 提供了三个 `hooks` 来处理 `React` 组件的状态：`useObserver`、`useLocalStore`、`useAsObservableSource`
- `useObserver` 就只有一项基础能力，`使组件能够响应数据的变化`。能力基础意味着定制能力更强
- `useLocalStore` 是 `mobx` 推荐的组织数据状态的方式，如果数据状态不需要 `computed`、`action` 那么可以直接使用 `useAsObservableSource`
- `useAsObservableSource` 把对象（主要是 `props` 或 其他）转换成 `shallow observable`，但是需要注意的是：其`不能正常响应新增、删除属性的变更`
- 同 `useRef`，`useAsObservableSource` 和 `useLocalStore` 的返回值并不需要 `放到` `useEffect` 的 `deps`，因为 `React` 本身并不能感知其变化。
- 在需要响应 `props` 变更并且做 `reaction` 的时候 采用 `useAsObservableSource` 是更好的做法，因为它可以避免重复创建 `reaction`、不需要一直关系 `useEffect` 具体依赖了那些 `props`。

---


### 参考

[mobx-react.js](https://mobx-react.js.org/)
[mobx-react-lite](https://github.com/mobxjs/mobx-react-lite)

[useEffect(effect, [ref.current]) is prematurely re-running ](https://github.com/facebook/react/issues/14387)
[useEffect will unpredictable when depends on ref](https://github.com/facebook/react/issues/16121)

