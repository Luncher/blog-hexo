---
title: MobX-依赖注入
date: 2019-02-24 19:41:15
tags: mobx
categories: web
---

### 定义

MobX基于React的`Context`机制，提供了依赖注入的语法来实现跨组件层级的数据注入功能。这项功能在要往子组件传递数据，但是不知道具体有多少层级的时候，相当有用。

`inject`用在目标组件上，设置依赖的`store`。`Provider`是一个`HOC`，用它包装现有的组件，为子组件传递数据。

<!-- more -->

### 使用方式

基本用法：

```tsx

type UserStore = {
  name: string,
  age: number
}

interface IMessageProps {
  text: string
  userStore?: UserStore
}

interface ImessageInjectProps extends IMessageProps {
  userStore: UserStore
}

@inject("userStore")
class Message extends Component<IMessageProps> {
  render() {
    const { userStore } = this.props
    return (
      <div>
        {userStore && userStore.name}:
        <strong>{this.props.text}</strong>
      </div>
    )
  }
}

interface IMessageListProps {
  messages: IMessageProps[]
}

class MessageList extends Component<IMessageListProps> {
  render() {
    return (
      this.props.messages.map(it =>
      <Message
        key={it.text}
        text={it.text}
      />)
    )
  }
}
class App extends Component {
  render() {
    return (
      <Provider userStore={{ name: "linchen", age: 30 }}>
        <MessageList
          messages={[{ text: "hello"}, { text: "foo"}, { text: "bar"}]}
        />
      </Provider>
    )
  }
}

```

### ts类型安全的依赖注入

`Message`组件依赖`userStore`，`userStore`从`App`组件注入。整个应用程序能够正常工作。但是这里存在一个问题：`Message`的父组件`MessageList`并不需要知道`userStore`的存在，所以在定义`Message`的`props`类型的时候，把`userStore`设置为可选的参数。这也导致了，`Message`组件在使用`userStore`的时候，需要判断是否为空的情况。尽管我们知道，这里的`userStore`是必须存在的参数。

一种更好的方式：

```tsx

interface ImessageInjectProps extends IMessageProps {
  userStore: UserStore
}

@inject("userStore")
class Message extends Component<IMessageProps> {
  get InjectedProps() {
    return this.props as ImessageInjectProps
  }

  render() {
    const { userStore } = this.InjectedProps
    return (
      <div>
        {userStore.name}:
        <strong>{this.props.text}</strong>
      </div>
    )
  }
}

```

定义一个`ImessageInjectProps`类型，继承`IMessageProps`。在使用的时候强制转换为`ImessageInjectProps`类型。同时享受了`ts`强大的类型系统带来的便利性。


### 参考文档：

[How to get typesafe injection](https://github.com/mobxjs/mobx-react/issues/256)  
[strongly-typing-injected-react-props](https://medium.com/@prashaantt/strongly-typing-injected-react-props-635a6828acaf)