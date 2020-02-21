---
title: 一个 snapshot line-break 引发的讨论
date: 2020-02-21 23:47:22
tags: react
categories: web
---

事情背景: 我的一位细心同事在帮我 `code review` 的时候发现了如下问题：

![code-review.png](/images/snapshot-br/background.png)

<!-- more -->

我找到源代码，并且对比了一下 `git` 变更历史。
新版本写法：
```tsx
<span className="radio-tip">
    {props.discounts[year]}折
</span>
```

改动之前的写法：
```tsx
<span className="radio-tip">
    {`${props.discounts[year]}折`}
</span>
```

`jsx` 理论上会被 `babel` 转化成 `React.createElement` 的形式，所以到 [babel-playground](https://babeljs.io/repl) 写了一个 `demo`:


```tsx
function Haha1(props) {
    return <span>{`${props.x}折`}</span>
}

function Haha2(props) {
    return <span>{props.x}折</span>
}

```

经过 `babel` 在线编译的输出结果：

```tsx
"use strict";

function Haha1(props) {
  return React.createElement("span", null, "".concat(props.x, "\u6298"));
}

function Haha2(props) {
  return React.createElement("span", null, props.x, "\u6298");
}
```

可见对于 `Haha2` 这个组件的写法，`babel` 编译出来的 `span` 会多创建一个 `children`。接下来需要研究一下 `element` 输出到 `snapshot` 的过程：

我使用的测试工具是 `jest`，跑到 `jest` 官网，有如下的描述：

>Jest uses pretty-format to make snapshots human-readable during code review。

[pretty-format](https://github.com/facebook/jest/tree/master/packages/pretty-format) 就是 `jest` 用来生成 `snapshot` 的工具：

*来自官网* `demo`：

```tsx
const onClick = () => {};
const element = React.createElement('button', {onClick}, 'Hello World');

const formatted1 = prettyFormat(element, {
  plugins: [ReactElement],
  printFunctionName: false,
});
const formatted2 = prettyFormat(renderer.create(element).toJSON(), {
  plugins: [ReactTestComponent],
  printFunctionName: false,
});
/*
<button
  onClick=[Function]
>
  Hello World
</button>
*/
```

在 [code-sand-box](https://codesandbox.io/s/react-typescript-6kh1d) 自己上手试一试：

```tsx
import * as React from "react";
import prettyFormat from "pretty-format";
const { ReactElement, ReactTestComponent } = prettyFormat.plugins;

let x = 8.5;
const element = React.createElement("div", null, "".concat(x, "\u6298"));

const formatted1 = prettyFormat(element, {
  plugins: [ReactElement],
  printFunctionName: false
});

console.log(formatted1);
```

`console` 输出：

```shell
<div>
  8.5折
</div> 
```

换一个写法：

```tsx
//...
const element = React.createElement("span", null, x, "\u6298")
//...
```

`console` 输出：

```shell
<span>
  8.5
  折
</span>
```

原因就出在这里，我在重构代码的时候，把这行代码的编写方式换了一下，所以导致 `jest` 生成的 `snapshot` 发生了变动。`pretty-format` 有一个配置可以控制这个行为：

`min`: 
>minimize added space: no indentation nor line breaks

这个选项默认是 `false`，我们只要在运行 `prettyFormat` 的时候，打开这个选项就好了：

```tsx
//...
const formatted1 = prettyFormat(element, {
  plugins: [ReactElement],
  printFunctionName: false,
  min: true
});
//...
```

得到的结果：

```shell
<span>8.5折</span>
```

因为 `pretty-format` 是被集成到 `jest` 内部，默认这个选项没有暴露出来，貌似只能通过一个序列化选项来控制  [snapshotSerializers](https://jestjs.io/docs/en/configuration)，有兴趣再研究吧~

最后补一张 `jsx` 到 `snapshot` 的转换过程：

![jsx-to-snapshot.png](/images/snapshot-br/jsx-to-snapshot.png)

