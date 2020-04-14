---
title: Mobx-Make Property Observable
date: 2020-04-15 03:09:37
tags: [mobx]
categories: [web,mobx,react]
---

### 背景

团队一直使用 [mobx](https://mobx.js.org/README.html) 作为前端的复杂状态管理工具。在日常使用过程中，发现有一类需求是比较常见的，即：如何把对象中某个属性设置成 `observable`。

<!-- more -->

为什么会有这种需求呢？一方面是业务逻辑的约束，在初始状态对象的某些属性是未知的，需要在随后的逻辑中加入进来。另外一方面原因是因为，`Mobx` < `5` 的版本，没有办法自动把新增的属性设置成 `observable`，这个工作只能由我们自己来完成。

---

### 几种方案

#### extendObservable

[extendObservable](https://mobx.js.org/refguide/extend-observable.html), 用于给对象新增一个不存在的属性，并且把该属性设置成 `observable`。

看个 `demo`：


```ts
// 定义一个 `observable` 对象只包含 `a`
const obj = observable.object({ a: 1 }, {}, { deep: false });

// false
console.log(isObservableProp(obj, "b"));
extendObservable(obj, { b: 2 }, {});
// true
console.log(isObservableProp(obj, "b"));

reaction(
  () => obj.b,
  b => {
    console.log("reaction b:", b);
  }
);

// console.log: reaction b: 3
obj.b = 3
// console.log: reaction b: 4
obj.b = 4
```
>调用 `extendObservable`，`b` 属性变成 `observable` 。在后续使用过程中，对 `obj.b`赋值，触发了 `reaction` 操作。

+ 注意代码的先后顺序：
1. 先把新增属性变成 `observable`
2. 再调用 `reaction` 等函数，观察新增属性的变化

如果在 `extendObservable` 执行之前调用了 `reaction` 观察新增属性，在后续对属性赋值不能够触发 `reaction`。

```ts
reaction(
  () => obj.b,
  b => {
    console.log("reaction b1:", b);
  }
);

// extendObservable

reaction(
  () => obj.b,
  b => {
    console.log("reaction b2:", b);
  }
);

// console.log: reaction b2: 3
obj.b = 3
// console.log: reaction b2: 4
obj.b = 4
```
>`reaction b1` 并没有打印出来。

另外有一个注意点，不能对对象已有的属性设置调用 `extendObservable`，否则会报错：

```ts
const obj = observable.object({ a: 1 }, {}, { deep: false });
extendObservable(obj, { a: 2 }, {});
```
>[mobx] 'extendObservable' can only be used to introduce new properties. Use 'set' or 'decorate' instead. The property 'a' already exists on '[object Object]'


---

#### decorate

前面提到的 `extendObservable` 只能作用于对象本身的属性，但是如果要对某一类对象新增一个 `observable` 属性，那么是行不通的。这个可以通过 `decorate` 来完成。

看个 `demo`:

```ts
class A {
  a = 3;
}

const instance = new A();

// false
console.log(isObservableProp(instance, "prop"));
decorate(A, { prop: observable });
// true
console.log(isObservableProp(instance, "prop"));

reaction(
  () => instance.prop,
  prop => {
    console.log("reaction prop1: ", prop);
  }
);

// reaction prop1:  4
instance.prop = 4;
// reaction prop1:  5
instance.prop = 5;
```
>同 `extendObservable`, `reaction` 必须在 `decorate` 调用之后执行，否则没有效果。另外，`decorate` 对于现有的属性也是有效果的，比如，把上面的例子改成 `decorate a`。

```ts
class A {
  a = 3;
}

const instance = new A();
decorate(A, {
  a: observable
});

reaction(
  () => instance.a,
  a => {
    console.log("reaction a: ", a);
  }
);

// reaction a:  4
instance.a = 4;
// reaction a:  5
instance.a = 5;
```

---

#### proxy

`proxy` 用法相对高级，针对的场景比较特殊一点。考虑这样一个场景， `React Component` 的 `props` 上面有两个可选的 `property`。那么 `props` 可能的值有：

```ts
const props = { a: xx }
//or
const props = { a: xx, b: yy }
```

由于 `Mobx` 的限制（Mobx >=5可以解决这个问题）。在函数组件内使用  `hooks`：[useAsObservableSource](https://mobx-react.js.org/state-outsourcing)，得到的返回值每次引用是一样的，但是新增的属性（`b`）却不是 `observable` 的。

看个例子：

```ts

function Children(props) {
  const observableProps = useAsObservableSource(props);
  // 第一次输出 key:  a observable:  true
  // 5 秒之后输出 :
  // key:  a observable:  true
  // key:  b observable:  false
  Object.keys(observableProps).forEach(key => {
    console.log(
      "key: ",
      key,
      "observable: ",
      isObservableProp(observableProps, key)
    );
  });
  return "Children";
}

function App(_) {
  const [p, setP] = useState({ a: 1 });

  setTimeout(() => {
    setP({ a: 1, b: 2 });
  }, 5300);

  return (
    <div>
      "hello"
      <Children {...p} />
      {/* <Children a={1} b={2} /> */}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```
>新增的 `b` 属性，不是 `observable`，导致后续的 `reaction` 失效。


如何完整的解决这个问题呢？

+ 找到 `props` 内非 `observable` 的属性。

```ts
function getExtraPropsProperty(props: object) {
  return Object.keys(props).filter(key => !isObservableProp(props, key))
}
```

+ 把对象的属性设置成 `observable`

```ts
function makePropertyObservable(obj: object, keys: string[]) {
  keys.forEach(key => {
    const v = obj[key]
    delete obj[key]
    extendObservable(obj, { [key]: v }, {}, { deep: false })
  })
}
```
>避免重复 `render` 的时候，反复做同样的工作。

+ 把 `props` 本身变成 `observable`

```ts
function makePropsObservable(store: ILocalStore) {
  const valueBox = observable.box(store.props)

  Object.defineProperty(store, 'props', {
    configurable: true,
    enumerable: true,
    get() {
      return valueBox.get()
    },
    set(v) {
      valueBox.set(v)
    }
  })
}
```
>为了能够成功触发 `reaction props.b` 这种 `observer`，必须在初始化的时候先把 `props` 本身设置成 `observable`。否则因为时序问题（即：`reaction props.b` 在前，把 `props.b` 设置成 `observable` 在后）还是不能成功触发 `reaction`。

+ 写一个 `hooks` 对 `props` 进行处理

```ts
function useExtraObservableProps(store) {
  const firstRef = useRef(true)

  if (firstRef.current) {
    makePropsObservable(store)
    firstRef.current = false
  }

  const extraKeys = getExtraPropsProperty(store.props || {})
  if (extraKeys.length) {
    makePropertyObservable(store.props, extraKeys)
    runInAction(function updateProps() {
      // eslint-disable-next-line no-self-assign
      store.props = store.props
    })
  }
}
```
>这里有一个小问题，如果 `props` 来自于 `useAsObservableSource` 每次引用都相同，因为 `observable.box` 的优化，`store.props = store.props` 是不能够成功触发更新的。

来做一点优化：

```ts
function makePropsObservable(store: ILocalStore) {
  //  引入 atom, 去除 `observable.box`
  let value = store.props
  const atom = createAtom('props')

  Object.defineProperty(store, 'props', {
    configurable: true,
    enumerable: true,
    get() {
      // 记录观察点
      atom.reportObserved()
      return value
    },
    set(v) {
      value = v
      // 通知更新
      atom.reportChanged()
    }
  })
}
```
> 通过使用 `atom` 规避了 `store.props = store.props` 被`observable.box` 优化导致的问题。

### 总结

+ `extendObservable` 只能作用于新增的属性，否则会报错
+ `decorate` 能作用于现有的属性
+ 通过代理 `props` 配合 `atom` 解决了 `mobx < 5` 版本新增属性不是 `observable` 的问题
+ 值得注意的是，`mobx` 内的 `reaction` 定义必须出现在 `make property observable` 之后 
