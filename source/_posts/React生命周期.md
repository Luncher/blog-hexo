---
title: React周期
date: 2019-10-13 22:53:36
tags: react
categories: web
---

React 提供了多个生命周期函数, 不同的生命周期函数有着各自的职责，例如：

<!-- more -->

**constructor**
>`constructor` 函数我们通常会在这里做初始化数据的工作，例如对于 `class` 组件而言，我们通常在这里初始化 `state`（如果有的话）；

**render** 
>主要负责 `create` `ReactElement`, 描述 `UI`的组织结构，用于 `React` 构建 `virtual Dom`；

**componentDidMount**
>在组件输出的结果被挂载到 `Dom Tree` 之后运行，通常会在这里发送网络请求、 一些依赖于实际 `Dom` 节点的操作、`Subscribe` 操作等。

**componentWillUnmount**
>和 `didMount` 的作用相反，`Unmount` 函数在组件`卸载`之前运行，这里主要运行一些清理资源的操作，比如 `clearInterval` 等。

---

### 单个组件的生命周期

#### 组件首次渲染

先构建一个简单的组件，并在各个生命周期函数内加上日志：

```tsx
import * as React from "react";
import { render } from "react-dom";

interface IAppState {
  value: number;
}

class App extends React.Component<{}, IAppState> {
  constructor(props: {}) {
    super(props);
    this.state = { value: 1 };
    console.log("App constructor");
  }

  componentDidMount() {
    console.log("App DidMount");
  }

  componentDidUpdate() {
    console.log("App DidUpdate");
  }

  public render() {
    console.log("App render");
    return (
      <div>
        Application value: 
        {this.state.value}
      </div>
    );
  }
}

```

刷新浏览器，获得运行结果：

```shell
App constructor 
App render 
App DidMount 

```

---

#### 组件更新内部状态

先修改部分代码，加入一个按钮以及事件处理函数，在函数内部修改 `state`：

```tsx
//...

componentDidUpdate() {
    console.log("App DidUpdate");
}

handleUpdateValue() {
    this.setState(state => ({ value: state.value + 1 }))
}

public render() {
    console.log("App render");
    return (
      <div>
        value: 
        {this.state.value}
        <button onClick={() => this.handleUpdateValue()}>
          update value
        </button>
      </div>
    );
}

//...

```

点击按钮，得到运行结果：

```shell
App render 
App DidUpdate 
```

可以看到，每次点击按钮调用函数更新组件的 `state` ，导致 `React` 重新调用了`render` 和 `DidUpdate` 函数。


**注意：**
>并不是因为 `render` 里面没有用到 `state` 就不会出发这个流程。

修改部分代码，把 `state` 从 `render` 里面移除，并增加一个定时器，定时更新 `state`。

```tsx

//...

  componentDidMount() {
    console.log("App DidMount");
    setInterval(() => {
      this.setState(state => ({ value: state.value + 1 }));
    }, 2000);
  }

  public render() {
    console.log("App render");
    return (
      <div>
        value:
        {/* {this.state.value} */}
        <button>update value</button>
      </div>
    );
  }

//...

```

不出意外的话，在控制台每个两秒就会输入如下结果：

```shell
App render 
App DidUpdate 
```

默认情况下的 `React` 够无脑的，也足够简单。只要组件 `state` 发生了改变就执行 `re-render` ...

---

### 父子组件的生命周期

#### 组件首次渲染

新增一个子组件，这个组件有两个 `props` 属性：`val1`、`val2`。

```tsx
interface IChildrenProps {
  val1: number;
  val2: number;
}

class Children1 extends React.Component<IChildrenProps> {
  constructor(props: IChildrenProps) {
    super(props);
    console.log("Children1 constructor");
  }
  
  componentDidMount() {
    console.log("Children1 DidMount");
  }

  componentDidUpdate() {
    console.log("Children1 DidUpdate");
  }

  render() {
    console.log("Children1 render");
    return "Children1";
  }
}

// App render
// ...
  public render() {
    console.log("App render");
    return (
      <div>
        app value:{this.state.value}
        <Children1 val1={1} val2={0} />
      </div>
    );
  }
//...
```

运行结果：

```shell
App constructor 
App render 
Children1 constructor 
Children1 render 
Children1 DidMount 
App DidMount
```

>可以看到父组件的生命周期函数 `constructor`、`render` 总是总是**先于**子组件运行、而 `DidMount` 却是子组件优先于父组件运行, 这是为了在父组件的 `DidMount` 函数内根据子组件再做一些初始化的行为, 这个时候子组件必须确保已经被挂载到 `Dom tree`。

---

#### 更新父组件的状态

修改部分父组件代码：

```tsx

//...
  componentDidMount() {
    console.log("App DidMount");
    setInterval(() => {
      this.setState(() => ({ value: 1 }))
    }, 2000)
  }

  public render() {
    console.log("App render");
    return (
      <div>
        {/* app value:{this.state.value} */}
        <Children1 val1={1} val2={0} />
      </div>
    );
  }
  
//...
```

运行结果：

```shell
App render
Children1 render
Children1 DidUpdate
App DidUpdate
```

>从这个运行结果可以看到两个结论：
>1、子组件的 `DidUpdate` 先于 父组件的 `DidUpdate` 执行，原因同 `DidMount`
>2、默认情况下，父组件的 `state` 的随着定时器更新，这会导致父组件 `re-render`(从前面的例子可以看出来)。 父尽管没有变更任何 `props`，子组件也执行 `re-render` 行为.

---

#### 组件 Unmount

先来构造一个组件 `Unmount` 的场景：

```tsx

// 在父子组件都加上 Unmount 操作
componentWillUnmount() {
    console.log('Children1 Unmount')
}

componentWillUnmount() {
    console.log("App Will Unmount");
}

```

```tsx
// 构造一个 MockApp 组件
function MockApp() {
  return <span>MockApp</span>;
}

// 定一个变量，放置要挂载的组件
let AppView: (React.FunctionComponent) | typeof React.Component = App;

render(<AppView />, document.getElementById("root"));

// 定时 4 秒 卸载 App 组件
setTimeout(() => {
  AppView = MockApp;
  render(<AppView />, document.getElementById("root"));
}, 4000);

```

构造一个 `MockApp` 四秒钟之后被 `ReactDom` 渲染到 `Dom tree`，替换了 `App`，`App` 组件相当于执行了一次 `Unmount`。

运行结果：

```shell
App Will Unmount
Children1 Will Unmount
```

>对于父子组件，`Unmount` 的顺序刚好跟 `DidMount` 相反，这是有意为之的设计，因为假定父组件会在 `DidMount` 做一些依赖于子组件的初始化操作，那么在释放资源的时候可能还是会依赖于子组件。所以父组件的 `Unmount` 先于子组件运行。可以参考：[componentWillUnmount calls not called before owning parent's](https://github.com/facebook/react/issues/4752)。


`React` 还有其他一些生命周期这里没有一一罗列，有些已经建议废弃了，另外一些就等有机会再深入研究研究吧！


参考文档：

[react-component-api](https://reactjs.org/docs/react-component.html)
[react-state-and-lifecycle](https://reactjs.org/docs/state-and-lifecycle.html)

