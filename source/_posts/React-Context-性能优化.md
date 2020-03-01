---
title: React Context 性能优化
date: 2020-03-01 19:59:28
tags: [react,context]
categories: web
---

### 背景

`context` 的出现良好的解决了垮多个层级的组件传递 `props` 的问题。 但是在使用 `context` 的过程中，绝大多数开发者都发现 `context` 有一个不太优雅的点：
> 只要 `context` 的 `value` 发生变化，所有消费该 `context` 的组件都会 `re-render`。

<!-- more -->

#### 举个例子

定义一个父组件和 `context`
```tsx
interface IState {
  count1: number;
  count2: number;
}

interface IContextValue {
  state: IState;
  updateState: (s: IState) => void;
}

const MyContext = React.createContext<IContextValue | null>(null);

class App extends React.Component {
  state: IState = { count1: 0, count2: 0 };

  updateState(state: IState) {
    this.setState(prev => ({ ...prev, ...state }));
  }

  render() {
    return (
      <div>
        <MyContext.Provider
          value={{
            state: this.state,
            updateState: state => this.updateState(state)
          }}
        >
          <Children1 />
          <Children2 />
        </MyContext.Provider>
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));

```

定义两个子组件

```tsx

const Children1: React.FC = React.memo(() => {
  const value = React.useContext(MyContext);
  return (
    <div>
      Children1 (time: {Date.now()}) got: {value!.state.count1}
      <button
        onClick={() =>
          value.updateState({
            ...value.state,
            count1: value.state.count1 + 1
          })
        }
      >
        Update Count1
      </button>
      <hr />
    </div>
  );
});

const Children2: React.FC = () => {
  const value = React.useContext(MyContext);
  return (
    <div>
      Children2 (time: {Date.now()}) got: {value!.state.count2}
      <button
        onClick={() =>
          value.updateState({
            ...value.state,
            count2: value.state.count2 + 1
          })
        }
      >
        Update Count2
      </button>
      <hr />
    </div>
  );
};
```

> 在页面中，`Children1` 依赖于 `count1`、`Children2` 依赖于 `count2`。当点击 `Children1` 或者 `Children2` 的按钮时候，会导致对方也 `re-render`。即使使用了 `React.memo` 也不行 ( 从 `Children1` 可以看出来)。针对这种情况， 业界几种思路，下面来具体实践一下。

---

### 拆分 Context

基本原则：
> 把需要频繁更新的 `context` 内的属性单独拆出来。从而避免了其他仅仅需要低频率刷新的组件 `re-render`。

通过上面的例子，把 `count1`、`count2` 分别放入各自的 `Context`。

```tsx
// 修正 Context 定义
interface IState2 {
  count2: number;
}

interface IContext2Value {
  state: IState2;
  updateState: (s: IState2) => void;
}

const MyContext2 = React.createContext<IContext2Value | null>(null);

//...

// Children2 
const value = React.useContext(MyContext2);
//...

```

---

### 利用 `memo` or `useMemo`

基本前提：
> 通过 「React Context 的基本使用姿势」`了解到，`context` 会强制无脑 `re-render` 消费 `context` 的组件。我们通过把组件的内容和消费 `context` 的行为分开，并且把组件内容使用 `memo` 包装起来即可(`memo` 会比较 `props`)。

#### `memo` 的方式

改写 `Children1`
```tsx
const Content = React.memo<{ count1: number }>(props => {
  console.log("render Children1");
  return (
    <div>
      Children1 got: {props.count1}
      <hr />
    </div>
  );
});

const Children1: React.FC = () => {
  const value = React.useContext(MyContext);
  return <Content count1={value.state.count1} />;
};

```
> 把 `Children1` 的 `Content` 单独提出来，并使用 `memo` 包装起来。


#### `useMemo` 的方式

同样改写 `Children1`

```tsx

const Children1: React.FC = () => {
  const value = React.useContext(MyContext);
  return React.useMemo(() => {
    return (
      <div>
        Children1 {Date.now()} got: {value.state.count1}
        <hr />
      </div>
    );
  }, [value.state.count1]);
};

```

>使用 `useMemo` 就不用把 `content` 单独提出来了。值得注意的是，通过对比，可以看到： `useMemo` 返回的是 `JSX.Element`，而 `memo` 返回的是 `JSXConstructor`。

---


### 使用位运算 `calculateChangedBits`

`createContext` 有第二个参数不太常用：

```tsx
function createContext<T>(
    // If you thought this should be optional, see
    // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
    defaultValue: T,
    calculateChangedBits?: (prev: T, next: T) => number
): Context<T>;
```
>`calculateChangedBits` 是一个函数，这个函数用来判定到底是那个 `context` 内的属性发生了变化。

举个例子，改写`createContext`:

```tsx
// 0x01 表示更新 count1
// 0x02 表示更新 count2
const MyContext = React.createContext<IContextValue | null>(null, function(
  prev,
  next
) {
  if (prev.state.count1 !== next.state.count1) {
    return 0x01;
  }
  if (prev.state.count2 !== next.state.count2) {
    return 0x02;
  }

  return 0;
});

```

`Context.Consumer` 提供了另外一个配合使用的 `props`：

```tsx
interface ConsumerProps<T> {
    children: (value: T) => ReactNode;
    unstable_observedBits?: number;
}
```
>`unstable_observedBits` 标示了该组件关注的 `provider` 内的状态变更。


举个例子，改写 `Children1`：

```tsx
const Children1: React.FC = React.memo(() => {
  return (
    <div>
      <MyContext.Consumer
        unstable_observedBits={0b01}
        children={value => (
          <>
            Children1 {Date.now()} got: {value.state.count1}
            <hr />
          </>
        )}
      />
    </div>
  );
});
```
>`0b01` 唯一标示了 `count1` 这个属性更新的行为，而  `Children1` 只关系 `count1` 的变更。目前该特性处于不稳定的状态， `React` 官方也没有对外宣布，连文档都还没有 :) 。有个开源的状态管理库：[react-tracked](https://github.com/dai-shi/react-tracked) 就是依赖于该特性来做的状态管理。


---

### 总结

* 为什么要对 `context` 做性能优化？
> `context` 对于消费该 `context` 的组件无脑刷新，对消费`context` 的组件做类似于 `pureComponent` 的操作也无效，而这种刷新很大程度上是没有意义的。


* `context` 性能优化的方式

1. `context` 拆分，把频繁更新的属性，单独拆到一个 `context`
2. 使用 `memo` 或者 `useMemo` 的方式
3. 使用 `calculateChangedBits` 每个消费组件，使用位运算标示自己关注的 `context` 内容。

>首先推荐 `1` 的方式，因为这符合关注分离的模式，内容组件不需要关心数据来源。其次是 `2`，需要注意的是： `useMemo` 只能在 `hooks` 内使用。`3` 方案建议不要使用，因为很可能会废弃 ：）

---
(完)

参考：

[react-memo](https://reactjs.org/docs/react-api.html#reactmemo)
[react-tracked](https://github.com/dai-shi/react-tracked)
[Preventing rerenders with React.memo and useContext hook](https://github.com/facebook/react/issues/15156)

