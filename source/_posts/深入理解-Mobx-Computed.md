---
title: 深入理解 Mobx Computed
date: 2020-05-18 01:29:00
tags: computed
categories: [mobx,statemanager]
---

### 背景

`computed` 又名计算属性，是 `Mobx` 最重要的特性之一。其目的在于：根据某一个或者多个属性计算得到新的属性，提供给消费方。
>注：被 `computed` 依赖的属性本身需要是 `observable` 的，可以是直接通过 `observable.xx` 定义的属性，也可以是另外一个 `computed` 属性。　

使用 `computed` 主要有两个优势：
- 尽量减少可修改的状态属性
>a、可修改的属性越多意味着程序需要维护的状态越多，间接提高了程序的复杂度，增加维护成本。b、避免了无意间修改了某个属性而导致 `BUG`，提升程序的健壮性。

- `computed` 最大程度的提升了程序性能
>`computed` 缓存计算结果，避免不必要的复杂计算，下面会慢慢分析。

基于以上两点，日常开发过程中原则是：**能使用 `computed` 的地方应该尽量使用 `computed`。**

<!-- more -->

---

### 基本使用

来定义一个订单的 `Store`

```typescript
class Order {
  @observable price = 3;
  @observable amount = 1;

  @computed get total() {
    console.log("calc total");
    return this.price * this.amount;
  }
}

const inst = new Order();
// console: calc total
// console: 3
autorun(() => console.log(inst.total)); 
```

以上就是 `computed` 的基本使用姿势：
- 基于某些个 `observable` 计算得到新的属性值
- 通过 `reaction` 来消费 `computed` 属性值

当修改 `computed` 依赖的 `observable` 属性时，`computed` 会再次执行，得到新的值，并缓存之。

```typescript
//...
const inst = new Order();
autorun(() => console.log(inst.total))
// console: calc total
// console: 12
inst.amount = 4 
```

**注意**：如果 `computed` 还依赖了某些非 `observable` 属性，而属性的变更并不会导致 `computed` 重新执行：

```typescript
class Order {
  @observable price = 3;
  @observable amount = 1;
  x = 2

  @computed({ keepAlive: true })
  get total() {
    console.log("calc total");
    return this.price * this.amount * this.x;
  }
}

const inst = new Order();
// console: calc total
// console: 6
autorun(() => console.log(inst.total))
// 没有任何输出
inst.x = 4
```

---

### computed vs autorun

通过上面的了解，`computed` 感觉跟 `autorun` 很像。都用于响应某些 `observable` 属性的变化。其主要差异有以下几点：
- `computed` 主要用于基于现有属性生成新的属性值，供其他 `observer`（如：`autorun`、`reaction` 等） 消费。
- `autorun` 基于某些 `observable` 属性的变化作出一些行为，可能是发送请求也可能是打印日志等等
- `autorun` 需要使用者自己 `dispose`，而 `computed` 由`mobx`内部负责回收，如果 `computed` 消费者不存在的时候，`computed` 会处于 `Suspend` 状态，即：`computed` 依赖的属性变化也不会重新计算生成新的属性值。（当开启 `keepLive` 的时候情况会有所不同，下面会说明）

---

### 进阶

#### 避免不必要的重复计算

使用 `computed` 有一个比较大的误区在于，绕过 `reaction` 直接使用 `computed` 属性：

```typescript
//...

const inst = new Order();
// console: calc total
// console: 3
console.log(inst.total)
// console: calc total
// console: 3
console.log(inst.total)
// console: calc total
// console: 3
console.log(inst.total)
```

`console` 引用了 `computed` 三次，重复计算了三次。所以当某些计算量比较大的 `computed` 计算了太多次，那么就要看看使用姿势是不是不对了。庆幸的是，`mobx` 有一个配置来警告这种行为：

```typescript
configure({
  computedRequiresReaction: true
})
```

或者：

```typescript
//...
@computed({ requiresReaction: true })
get total() {
  console.log("calc total");
  return this.price * this.amount;
}
//...
```

#### Computed KeepAlive

通过上面的例子看到，`computed` 不适合被直接使用，因为会有重复的计算。但是为了方便想要直接使用该怎么办呢？一种办法是把 `computed value` 进行 `reaction` 化、另外一种方式是：`keepAlive`。`keepAlive` 的作用在于避免过多的计算，同时又能获取最新的值（对比不使用 `keepAlive`），而且经过 `mobx` 优化具有延迟计算的能力（对比 `autorun`）。即：在 `computed keepAlive` 在消费之前修改 `observable` 的值，并不会导致重新计算，看两个例子。 

**computed with keepAlive**
```typescript
class Order {
  @observable price = 3;
  @observable amount = 1;

  @computed({ keepAlive: true })
  get total() {
    console.log("calc total");
    return this.price * this.amount;
  }
}

const inst = new Order();
// console: 3
console.log(inst.total)
// console: 3
console.log(inst.total)
// console: 3
console.log(inst.total)
```
>没有重复的 `calc total`

**computed defer compute**

```typescript
class Order {
  @observable price = 3;
  @observable amount = 1;

  @computed({ keepAlive: true })
  get total() {
    console.log("calc total");
    return this.price * this.amount;
  }
}

const inst = new Order();

inst.price = 4
inst.price = 5

//console: calc total
//console: 5
console.log(inst.total)
//console: 5
console.log(inst.total)
//console: 5
console.log(inst.total)
```
>第一次 `console` 的时候再计算 `computed` 属性值。

使用 `keepAlive` 有一个缺陷是容易导致内存泄露，因为它无法被 `mobx` 回收，又必须时刻保持 `alive` 的状态。详情参考：[why-does-mobxs-keepalive-cause-a-memory-leak](https://medium.com/terria/when-and-why-does-mobxs-keepalive-cause-a-memory-leak-8c29feb9ff55)

#### Computed Comparer

`Computed` 还有一个比较重要的属性：`equals`。`equals` 用来指定一个函数用于比较两次计算得出的 `computed value` 是否相等。如果不相等，则消费 `computed` 的 `reaction` 会响应。看一个例子：

```typescript
class Order {
  //...

  @computed({ equals: () => true })
  get total() {
    console.log("calc total");
    return this.price * this.amount;
  }
}

const inst = new Order();

//console: calc total
//console: 3
autorun(() => console.log(inst.total))

//console: calc total
inst.price = 4
//console: calc total
inst.price = 5
```
> 当 `observable` 变化的时候，触发了 `computed`，但是自定义比较器始终返回 `true`，导致 `mobx` 认为前后的值没有变化，所以 `autorun` 没有被响应。

`mobx` 内置了 `4` 种比较器：
```typescript
//...
function identityComparer(a: any, b: any): boolean {
    return a === b
}
function structuralComparer(a: any, b: any): boolean {
    return deepEqual(a, b)
}

function shallowComparer(a: any, b: any): boolean {
    return deepEqual(a, b, 1)
}

function defaultComparer(a: any, b: any): boolean {
    return Object.is(a, b)
}

export const comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    default: defaultComparer
    default: defaultComparer,
    shallow: shallowComparer
}
```

默认使用 [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) 判断函数。多说一句，在 `react` 内默认使用的比较函数是：[shallowEqual](https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/shallowEqual.js#L39-L67)，也依赖了 `Object.is` 譬如：`shouldComponentUpdate`、`memo` 等。比较器本身没啥可说的。重点来看看 `shallowComparer`、`structuralComparer` 的使用场景。

首先来看看 `structuralComparer` 的使用场景：

```typescript
class Sum {
  @observable.ref val1 = { v: 1 };
  @observable.ref val2 = { v: 2 };

  @computed
  get total() {
    console.log("calc total");
    return {
      val1: this.val1,
      val2: this.val2
    };
  }
}

const inst = new Sum();
// console: xx
autorun(() => console.table(inst.total));
// console: xx
inst.val2 = { v: 2 };
```

因为 `val2` 的引用变了，所以导致触发了 `total computed`，但是我们看到 `val2.v` 实际上还是等于 `2`。这个时候就可以用 `structuralComparer`：

```typescript
  //...
  @computed({ equals: comparer.structural })
  get total() {
    console.log("calc total");
    // atom.reportObserved();
    return {
      val1: this.val1,
      val2: this.val2
    };
  }
  
//...
// console: calc total
// console: xx
autorun(() => console.table(inst.total));
// console: calc total
inst.val2 = { v: 2 };
```
可以看到，虽然设置 `val2` 的时候 `total computed` 被重新计算了，但是由于深度比较后发现计算值跟前一次并没有差别，所以 `autorun` 没有被响应。

`shallowComparer` 的例子比较困难，因为 `mobx` 有内置的优化，导致以下写法不会重新计算属性：

```typescript
class Sum {
  @observable.ref val1 = 1;
  @observable.ref val2 = 2;

  @computed
  get total() {
    console.log("calc total");
    return {
      val1: this.val1,
      val2: this.val2
    };
  } 
}

const inst = new Sum()
// calc total
// console: xx
autorun(() => console.log(inst.total));
// 没有 calc total
inst.val2 = 2
```

由于 `mobx` 内置优化的缘故，对于：`inst.val2 = 2` 并没有引起重新的 `calc computed`，也就没法验证 `shallow comparer` 的作用了。需要一个办法绕过这个优化：那就是：[Atom](https://mobx.js.org/refguide/extending.html)。

>`Atom` 是 `Mobx` 的基础设施，多数 `observable` 特性都是基于 `atom` 来实现的。`Atom` 主要使用在，当目前提供的 `reaction`、`observable` 不能满足需求的时候，例如需要对 `stream` 信息做响应式计算。

先定义一个 `Atom`: 

```typescript
const atom = createAtom("test-shallowComparer");
```

对属性劫持，强制触发变更通知：

```typescript
//...
@computed({ equals: comparer.shallowComparer })
get total() {
  console.log("calc total");
  return {
    val1: this.val1,
    val2: this.val2
  };
} 

// ...

const inst = new Sum();

let val2 = inst.val2;

Object.defineProperty(inst, "val2", {
  configurable: true,
  enumerable: true,
  get() {
    atom.reportObserved();
    return val2;
  },
  set(v) {
    val2 = v;
    atom.reportChanged();
  }
});
// console: calc total
// console: xx
autorun(() => console.table(inst.total));
// console: calc total
inst.val2 = 2
// console: calc total
inst.val2 = 2
```

通过劫持 `val2` 属性，当第一次读取 `val2` 值信息的时候都记录一个观察者，当设置 `val2` 属性值的时候通知观察者。因为此时由于 `shallowComparer` 两个 `total` 的值实际上是相等的。所以只触发了计算，没有触发 `autorun`。

---

### 总结

+ 日常开发应该尽可能多的使用 `computed` 减少 `mutable` 状态的使用，提升代码的健壮性、降低复杂度
+ `computed` 有两个前置条件：1、依赖 `observable` 属性的变化。2、被 `reaction` 消费（如果有意减少不必要的计算）
+ `computed` 和 `autorun` 有很多相识之处，`computed` 主要用于生成一个新的属性值供消费，`autorun` 用于基于 `observable` 做某些操作。`computed` 会被 `mobx` 优化，也可以根据需要调整 `comparer` 函数。
+ 解决直接使用 `computed` 有两个方式：`reaction` 转换、`keepAlive`，`keepAlive` 的好处是：延迟计算，也不需要额外的转换，坏处是容易导致内存泄漏，而 `reaction` 的方式容易 `dispose`

