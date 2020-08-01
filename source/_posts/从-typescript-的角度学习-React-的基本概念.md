---
title: 从 typescript 的角度学习 React 的基本概念
date: 2020-07-29 23:45:08
tags: react
categories: web
---

`React` 开发过程中有几个绕不开的基本概念，如：

+ `ReactElement`
+ `Component`
+ `JSX`
+ `ReactNode`

<!-- more -->

---

### `ReactElement`

`ReactElement` 可能是 `React` 中最重要的概念。其定义为：

>一个不可变的对象(`immutable object`)，该对象决定了最终呈现的页面形态。`ReactElement` 不同于 `HTML Dom Element`，`ReactElement` 用于构建虚拟 `Dom` (`Virtual Dom`)。

`ReactElement` 用于构建 `Virtual Dom` ，那为什么需要虚拟 `Virtual Dom` 呢？主要以下几个原因：

1、传统的 `Dom` 操作比较耗时，`Dom` 操作比 `javascript` 操作要慢。操作 `html dom` 的时候，会有比较多的没有必要的更新动作。譬如：假设有一个列表，包含 `10` 个列表项。当对其中某一个项操作的时候，会导致整个列表重新构建。

2、`Virtual Dom` 这一抽象层，把 `UI` 的“描述” 和 `UI` 界面最终的展示分离，使得 `React` 具备构建跨平台的视图的能力，如：`react-native`、`react-dom` 等。

#### `ReactElement` 类型定义

从 `@types/react` 包内可以看到 `ReactElement` 的类型定义：

```typescript
interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
        type: T;
        props: P;
        key: Key | null;
    }
```

`type` 的定义表示该 `ReactElement` 可能描述的是一个 `HTML Dom Element` （`string` 类型），或者是用户自定义的组件（通过 `JSXElementConstructor` 构建）。

`props` 表示该 `ReactElement` 的属性。

`key` 是一个可选的属性，主要用在构建`ReactElement` 列表的时候，方便在 `React` 做 [reconciliation](https://reactjs.org/docs/glossary.html#reconciliation) 的时候，分辨出哪些项发生了变更。`key` 有两个要求点：

1、在相邻的列表项之间唯一  
2、列表项的 `key` 不会因为多次渲染而发生改变


#### `ReactElement` 的构建

`ReactElement` 有三种方式构建：

1、`React.createElement` 

```typescript
var element = React.createElement('div', { className: 'div-wrapper' }, "helloworld")
```

`createElement` 接受三个参数，分别表示 `type`、`props`、`children`，其中第二、三个参数都是可选参数。


2、`React.createFactory`

`createFactory` 是一个工具函数其作用等价于：

```typescript
function createFactory(type) {
    return React.createElement.bind(null, type)
}
```

3、`JSX`

`JSX` 具备 `js` 的灵活表现能力，是创建 `ReactElement` 的语法糖。`JSX` 构建出来的元素是 `JSX.Element` 的类型，其定义：

```typescript
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
  }
}
```

可以看出：
> `JSX.Element` 等于 `React.ReactElement<any, any>`

全局的作用域类型有 `JSX` 类型默认的定义（可以使用自己的方式定义 `JSX`，如果有需要的话），等价于 `React.Element`。

使用 [babel 插件](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx/)，可以把 `jsx` 的语法编译成 `createElement` 的形式：

```js
const a = <div className="div-wrapper">helloworld</div>
```

输出：

```js
"use strict";
const a = /*#__PURE__*/React.createElement("div", {
  className: "div-wrapper"
}, "helloworld");
```

---

### Component

`Component` 的定义：`ReactElement` 用于构建 `Virtual Dom`，而 `Component` 用于构建 `ReactElement`。`Component` 接受 `props` 作为参数，返回 `ReactElement` 作为结果。

#### Component 分类

`ReactElement` 的 `type` 有两种类型：`string | JSXElementConstructor<any>`。`JSXElementConstructor` 的定义：

```typescript
type JSXElementConstructor<P> =
    | ((props: P) => ReactElement | null)
    | (new (props: P) => Component<P, any>);
```

从定义可以看出，`ReactElement` 的构造器可能是两种类型：

1、函数组件
```typescript
(props: P) => ReactElement | null)
```

2、类组件
```typescript
(new (props: P) => Component<P, any>)
```

#### Pure Component vs Stateless Component

相较于普通的 `Component`， `Pure Component` 主要针对 `Class Component` 来说。`Pure Component` 通过定义 `shouldComponentUpdate` 方法来避免组件不必要的 `rerender` 从而提高性能。


`Stateless Component` 主要针对 `Function Component` 来说。该组件等同于一个纯函数，没有内部状态，没有副作用（`side effects`）。


---

### ReactNode

`ReactNode` 的定义：

```typescript
type ReactText = string | number;
type ReactChild = ReactElement | ReactText;

interface ReactNodeArray extends Array<ReactNode> {}
type ReactFragment = {} | ReactNodeArray;

type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
```

在 `React` 系统中，有两个地方用到了 `ReactNode`，一个是 类组件 的 `render` 函数：

```typescript
class Component<P, S> {
    //...
    render(): ReactNode;
    //...
}
```

另外一个是 `children` 的定义：

```typescript
type PropsWithChildren<P> = P & { children?: ReactNode };
```

**为什么 `Function Component` 的返回值不是一个 `ReactNode` 呢？**

`Function Component` 的类型定义：

```typescript
interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>, context?: any): ReactElement | null;
    propTypes?: WeakValidationMap<P>;
    contextTypes?: ValidationMap<any>;
    defaultProps?: Partial<P>;
    displayName?: string;
}
```

返回值是：`ReactElement | null`，这可能是[历史原因](https://github.com/facebook/react/issues/12155)，理论上，`Function Component` 和 `Class Component` 的 `render` [具有相同的返回值类型](https://github.com/facebook/react/issues/12155#issuecomment-363089187) 根据 [React 官方的定义](https://reactjs.org/docs/react-component.html#render)，合法的 `render` 返回值：

```typescript
type ComponentReturnType = ReactElement | Array<ComponentReturnType> | string | number 
  | boolean | null // Note: undefined 是非法的
```

总结：

[Class Component](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/67fdf14/types/react/index.d.ts#L502) 返回 `ReactNode` 是一种比 `React` 要求更加松散的约定
[Function Component](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/67fdf14/types/react/index.d.ts#L555) 返回 `ReactElement | null` 则比 `React` 要求的更加严苛

---

### 参考

+ [react-terminology.md](https://gist.github.com/sebmarkbage/fcb1b6ab493b0c77d589)
+ [react-glossary](https://reactjs.org/docs/glossary.html)
+ [when-to-use-jsx-element-vs-reactnode-vs-reactelement](https://stackoverflow.com/questions/58123398/when-to-use-jsx-element-vs-reactnode-vs-reactelement/59840095#59840095)
+ [react-virtual-dom](https://www.codecademy.com/articles/react-virtual-dom)
+ [stateless-component-vs-pure-component](https://medium.com/groww-engineering/stateless-component-vs-pure-component-d2af88a1200b)
+ [react-components-elements-and-instances](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)
