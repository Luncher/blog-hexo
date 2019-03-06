---
title: Golang几种依赖注入的实现
date: 2018-12-26 23:20:40
tags: golang
categories: server
---


### 依赖注入的作用

 依赖注入是一个业界标准技术，用于解决复杂应用状态下模块之间依赖的问题。有了依赖注入，不需要再写很多按照依赖顺序而编写的初始化代码。在没有使用依赖注入的前提下，在升级重构一个模块的时候是相当痛苦的，因为这意味着需要在项目依赖图里面把所有该模块涉及的一整套依赖关系重新构建。简而言之，依赖注入主要目的只有一个：**旨在简化初始化代码的管理**。


go语言社区有很多依赖注入的框架，可以分为两个类别：

+ 依赖反射实现的运行时依赖注入

+ 使用代码生成实现的依赖注入


### 依赖反射实现的运行时依赖注入

运行时依赖注入目前使用比较广泛的主要有：`facebook inject`、`uber dig`。

#### facebook inject

```go

package main

import (
	"fmt"
	"github.com/facebookgo/inject"
	"net/http"
	"os"
)

type HomePlanetRenderApp struct {
	NameAPI   *NameAPI   `inject:""`
	PlanetAPI *PlanetAPI `inject:""`
}

func (a *HomePlanetRenderApp) Render(id uint64) string {
	return fmt.Sprintf("%s is from the planet %s.", a.NameAPI.Name(id), a.PlanetAPI.Planet(id))
}

type NameAPI struct {
	HTTPTransport http.RoundTripper `inject:""`
}

func (n *NameAPI) Name(id uint64) string {
	return "Spock"
}

type PlanetAPI struct {
	HTTPTransport http.RoundTripper `inject:""`
}

func (p *PlanetAPI) Planet(id uint64) string {
	return "Vulcan"
}

func main() {
	var g inject.Graph
	var app HomePlanetRenderApp

	err := g.Provide(&inject.Object{Value: &app}, &inject.Object{Value: http.DefaultTransport})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if err := g.Populate(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Println(app.Render(42))
}


```

`var g inject.Graph`一个项目会有一个对象依赖图。`app`是一个需要被注入的对象。因为`PlanetAPI`和`NameAPI`都依赖`http.RoundTripper`这个接口，所以也需要注入一个`transport`实现。调用`g.Populate`完成创建对象，把`DefaultTransport`填充到`PlanetAPI`和`NameAPI`的行为。执行完`Populate`之后就可以正常使用`app`对象了。这里还有个问题，如果`PlanetAPI`和`NameAPI`需要依赖不同的`transport`怎么办呢？

`facebook inject`提供了`named dependency`解决这个问题。

```go

type NameAPI struct {
	HTTPTransport http.RoundTripper `inject:"name-transport"`
}

type PlanetAPI struct {
	HTTPTransport http.RoundTripper `inject:"planet-transport"`
}
...
err := g.Provide(
    &inject.Object{Value: &app},
    &inject.Object{Value: http.DefaultTransport, Name: "planet-transport"},
    &inject.Object{Value: http.DefaultTransport, Name: "name-transport"},
)
...

```


#### uber dig

```go

type Config struct {
	Prefix string
}

func main() {
    c := dig.New()

	err := c.Provide(func() (*Config, error) {
		var cfg Config
		err := json.Unmarshal([]byte(`{"prefix": "[foo] "}`), &cfg)
		return &cfg, err
	})
	if err != nil {
		panic(err)
	}

	err = c.Provide(func(cfg *Config) *log.Logger {
		return log.New(os.Stdout, cfg.Prefix, 0)
	})
	if err != nil {
		panic(err)
	}

	err = c.Invoke(func(l *log.Logger) {
		l.Print("You've been invoked")
	})
	if err != nil {
		panic(err)
	}
}
```

和`facebook inject`类似，`c := dig.New()`创建一个实例，在这个实例上执行`Provide`注入对象构造器。`Invoke`依赖注入的构造器创建一个用户希望得到的对象。

---

### 使用代码生成实现的依赖注入

#### google wire

先看一个最传统的实现：
```go
package main

import "fmt"

type Message string

func NewMessage() Message {
	return Message("Hi there!")
}

type Gretter struct {
	Message Message
}

func NewGretter(m Message) Gretter {
	return Gretter{m}
}

func (g Gretter) Greet() Message {
	return g.Message
}

type Event struct {
	Gretter Gretter
}

func NewEvent(g Gretter) Event {
	return Event{Gretter: g}
}

func (e Event) Start() {
	msg := e.Gretter.Greet()
	fmt.Println(msg)
}

func main() {
	message := NewMessage()
	gretter := NewGretter(message)
	event := NewEvent(gretter)

	event.Start()
}
```

使用`wire`重构：

```go

func InitializeEvent() Event {
	wire.Build(NewEvent, NewGretter, NewMessage)
	return Event{}
}

func main() {
	event := InitializeEvent()
	event.Start()
}

```

这样就简化了初始化对象模块的代码，一目了然。