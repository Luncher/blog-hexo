---
title: React Context 的基本使用姿势
date: 2020-02-26 00:27:06
tags: [react,context]
categories: web
---

以下示例代码，默认的环境是：
- typescript latest
- react 16.8+

通过这篇文章，希望能够熟悉 `Context` 的各种使用姿势，以及消费 `Context Value` 的时候需要注意的点。

<!-- more -->

### Context 定义

* 首先来定义一个 `context`

`context.ts`:

```ts
import React from "react";

interface IValue {
  count: number;
}

const context = React.createContext<IValue>(null);

export default context;
```

>`createContext` 接受一个泛形，表示 `context` 值的类型，这里还给出了默认值是 `null`。注意 `tsconfig` 的 `strictNullChecks` 要先关闭 :)。创建完毕，导出这个 `context` 实例。


* 再定义一个父组件：

```tsx
interface IState {
  count: number;
}

class App extends React.Component<{}, IState> {
  state = { count: 0 };

  handleUpdateCount() {
    this.setState(({ count }) => ({ count: count + 1 }));
  }

  render() {
    return (
      <div>
        <button onClick={() => this.handleUpdateCount()}>add Inc</button>
        <p>Current Value: {this.state.count}</p>
        <MyContext.Provider value={{ count: this.state.count}}>
          <Children1 />
        </MyContext.Provider>
      </div>
    );
  }
}

```

>`context` 提供数据的使用姿势：`MyContext.Provider`, 通过固定属性 `value` 传入数据, 这里传入的是一个对象。每次点击按钮更新 `count`, `context` 传入新的值会导致 **消费 `context` 的组件** 重新渲染（该行为不会受到 `shouldComponentUpdate` 影响）。

---

### render Props 消费 Context

* 定义一个普通函数组件：

```tsx
import MyContext from './context'

const Children1: React.FC = () => {
  return (
    <MyContext.Consumer>
      {value => <span>Children1 Catch Value: {value.count}</span>}
    </MyContext.Consumer>
  );
};
```

>`MyContext.Consumer` 是 `context` 的使用姿势之一 ([render-props](https://reactjs.org/docs/render-props.html)), 它接受一个函数，这个函数的参数是 `Context.Provider` 注入的值。

#### 注意

>这个例子中，消费 `context` 的实际上是 `MyContext.Consumer`。所以当 `context` 内容发生变化的时候，`Children1` 并不会 `re-render`。

---

### 使用 Hooks 消费 Context

* 再定义一个组件：

```tsx
import MyContext from './context'

function Children4() {
  const context = React.useContext(MyContext);
  return <div>Children4 Catch: {context.count}</div>;
}
```
>使用 `Hooks` 来消费 `context`，相对更简单了，直接 `React.useContext`，类型也能完好的推倒出来。

---

### 在 Class 组件内消费 Context

* 先定义一个 `Class` 组件：

```tsx
import MyContext from './context'

class Children3 extends React.Component {
  static contextType = MyContext;
  context!: React.ContextType<typeof MyContext>;

  render() {
    return <div>Children3 Catch: {this.context.count}</div>;
  }
}
```
> `Class` 组件在使用的过程中需要定义两个属性：一个 `contextType`，是一个静态属性；另一个 `context`，`context` 的类型可以通过 `ContextType` 推导出来，这样可以避免把 `context.ts` 里面的 `IValue` 类型再 `import` 一次。这里 `context` 在声明的时候使用了 `!:` （称之为：definite assignment assertion）, 表明这个属性是 `non-null`。

---

### Context 性能优化

性能优化简单可以概括为一句话：
>避免做重复的事情。


#### 避免 Provider 的 value 重复产生新值

贴一段父组件的代码：

```tsx
//...
  render() {
    return (
      <div>
        <button onClick={() => this.handleUpdateCount()}>add Inc</button>
        <p>Current Value: {this.state.count}</p>
        <MyContext.Provider value={{ count: this.state.count }}>
          <Children1 />
        </MyContext.Provider>
      </div>
    );
  }
  //...
```

>由于`React`使用引用来判断对象类型的值，来决定是否需要 `re-render` 所有消费这个 `context` 的组件。

```ts
value={{ count: this.state.count }}
```

这种写法每次 `render` 都会传给 `context` 一个新的 `object`。这样导致每次由于其他原因父组件 `re-render` 的时候，所有消费这个 `context` 的组件都会重新 `re-render`。

改进一下：

```tsx
//...
<MyContext.Provider value={this.state}>
  <Children1 />
</MyContext.Provider>
//...
```
>这样就避免了每次给 `value` 赋值一个新的 `object`。


#### 避免重新 `createElement`

* 再来新增一段代码：

```tsx
// 注意：该组件没有消费 context
function Children5() {
  console.log("render Children5");
  return <div>Children5 empth</div>;
}

// 调整一下父组件的 render
//...
render() {
    console.log("render");
    return (
      <div>
        <button onClick={() => this.handleUpdateCount()}>add Inc</button>
        <p>Current Value: {this.state.count}</p>
        <MyContext.Provider value={this.state}>
          <Children1 />
          <Children5 />
        </MyContext.Provider>
      </div>
    );
}
//...
```

* 点击按钮，控制台输出：

```shell
render
render Children1
render Children5
```

>`Children5` 并没有消费 `context`。但是每次父组件 `re-render` 的时候，它也 `re-render` 了一次。

* 把父组件的 `render` 函数用 [babel](https://babeljs.io/) 编译一下得到：

```js
  render() {
    return React.createElement("div", null, React.createElement("button", {
      onClick: () => this.handleUpdateCount()
    }, "add Inc"), React.createElement("p", null, "Current Value: ", this.state.count), React.createElement(MyContext.Provider, {
      value: this.state
    }, React.createElement(Children1, null), React.createElement(Children5, null)));
  }

```

可以看到：
>每次父组件 `re-render` 的时候，都调用 `createElement` 函数重新创建了，`Children1` 和 `Children5`。

有没有什么办法可以避免这个行为呢？答案是有的：

#### 把 `Provider` 的内容提到父组件之外，使用 `children props` 传入：

* 改写 `Content`
```tsx
const Content: React.FC = () => {
  return (
    <>
      <Children1 />
      <Children5 />
    </>
  );
};

//使用父组件：
render(<App children={<Content />} />, document.getElementById("root"));
```

* 调整父组件的 render 函数

```tsx
//...
<MyContext.Provider value={this.state}>
    {this.props.children}
</MyContext.Provider>
//...
```

* 点击按钮，控制台输出：

```shell
render
```

* 使用 `babel` 在看一下结果：

```js
const Content = () => {
  return React.createElement(React.Fragment, null, React.createElement(Children1, null), React.createElement(Children5, null));
};

render(React.createElement(App, {
  children: React.createElement(Content, null)
}), document.getElementById("root"));
```

> 父组件的 `children` 是一个固定值。不会在父组件重新渲染的时候变更，从而避免了不必要的 `re-render`。

#### 使用 React.memo/React.PureComponent

* 重写 `Content` 组件：

```tsx

const Content: React.FC = React.memo(() => {
    console.log('render Content')
    return (
        <>
            <Children1 />
            <Children5 />
        </>
    )
})
```

* 还原父组件的 `render` 函数：

```tsx

<MyContext.Provider value={this.state}>
    <Content />
</MyContext.Provider>

```

点击按钮，控制台输出：

```tsx
render
```

---

### 总结

#### 使用 Content 的三种姿势

* render props 的方式
* Hooks 的方式
* Class Component 的方式


#### 性能优化

* 避免 `context` 每次创建一个 `value` 对象
* 使用 `children props` 替换 `jsx`
* 使用 `PureFunction/React.memo` 包装组件

---

参考：

[react-context](https://reactjs.org/docs/context.html#caveats)

（完）
