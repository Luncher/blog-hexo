---
title: 基于Jaeger的分布式监控系统实践
date: 2017-09-10 20:08:42
tags: monitor
keywords: 
  - jaeger
  - opentracing
  - dapper
categories: 系统监控
---


# 基于`Jaeger`的分布式监控系统实践

## 为什么要引入监控系统

微服务架构消除了传统`SOA`架构服务之间的耦合性，降低系统的复杂度，单个服务可以独立运行部署也提升了产品迭代速度。但是，衍生出来的问题是如何才能够有效监控每一个服务，多个服务之间互相调用如何被监控，如何更快的发现系统故障，消除系统瓶颈。随着微服务数量增多，系统并发量上升通过传统`log`来定位问题变得比较困难，这个时候分布式监控系统变得非常重要。

---

## 监控系统实现的理论基础

现代流行的监控系统实现的理论依据主要来源于[Google Dapper paper](https://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/36356.pdf)。该论文中提出了`trace`、`span`、`annotations`、`log`、`采样`、`服务依赖分析`等概念。

![TraceSpan](http://owoeej96r.bkt.clouddn.com/o_1btqo9g0i1bul11p61178kk613coa)

一个完整的客户端请求可以被称为一个`trace`, `span`是指调用过程中的一个时间区间, 也就是这个英文名的由来，一般对应一个方法或者代码块的执行。服务端收到请求后需要做相应的处理，可能是调用内部函数，也可能是通过`RPC`调用其他服务的功能。这些调用过程都可以被称为`span`。而这些`span`之间会有依赖关系，从而构成了一条完整的`trace tree`。为了方便应用程序开发者追踪调试问题，`trace`系统在实现的还应该提供相应的`API`方便开发者写入数据，也就是给`span`注入一些`annotations`或者`log`。`trace`系统在设计的时候必须考虑到不能影响应用系统的吞吐效率，特别是对于高并发系统需要特别注意，这个时候采样的策略变得尤其关键。在系统并发量小的时候提高采样频率、并发量上升的时候降低采样频率是一个比较好的选择。

现代监控系统的实现都在该论文基础上或多或少做了一定的修改。目前云计算基金会`CNCF`下的`OpenTracing`项目是一个厂商中立语言无关的分布式`trace`标准。而本文后续介绍的`Jaeger`分布式监控系统正是基于该标准来实现。

`OpenTracing`标准明确了三个重要的互相关联的类型：`Tracer`、`Span`、`SpanContext`。`Tracer`主要负责：

*  `Span`创建

`Tracer`创建`Span`的时候需要指定一个名称,表明`Span`的含义,以及该`Span`之间的引用关系。

* `SpanContext`的注入和提取

在跨进程追踪的时候,需要利用注入接口把当前`trace`和`span`的信息传递给目标进程。而目标进程需要调用提取接口取得信息。这中间的可能是通过`HTTP`请求、或者其他`RPC`框架。`OpenTracing`不对通信协议限制，只是提出三个注入和提取的时候需要满足指定的数据格式。

`Span`的实现除了必须支持应用程序设置`tag`、写入调试`log`信息，还必须支持设置用户自定义数据，该数据会随着系统调用而传递。`OpenTracing`标准对`span`常用的`tag`以及`log`信息有规范推荐。应用程序代码在接入的时候，建议遵循该规范。

`SpanContext`存放的是`Span`上下文相关的数据, 如：当前`tracer id`, `span id`, 用户自定义数据等。

关于`OpenTracing`更加详细的描述，可以参考[官方文档](http://opentracing.io/documentation/pages/spec.html)。

---

## Jaeger监控系统介绍

`Jaeger`分布式监控系统由`Uber`设计并实现，现已捐赠给`CNCF`基金会,作为分布式环境下推荐的监控系统。Jaeger系统架构如下：

![Jaeger监控系统架构](http://owoeej96r.bkt.clouddn.com/o_1btr8q4mh1qb3fue1rtq8qq1r3la)

和其他监控系统类似，`Jaeger`主要包含一下几个模块：

* 应用程序探针`SDK`(`jaeger-client`)

`jaeger-client`实现了特定语言相关的`opentracing-api`，应用程序调用`api`写入数据，`client`把`trace`信息按照应用程序指定的采样策略传递给`jaeger-agent`。这里用的是`Thrift`序列化协议,采用`UDP`通信。

* 数据传输代理(`jaeger-agent`)

`agent`作为一个代理，负责把`client`传递上来的数据，批量发送给`jaeger-collector`。如图所示这里采用的是`Uber`自己研发的`TChannal` `RPC`框架。

* 数据处理中心(`jaeger-collector`)

`collector`负责对`agent`发上来的数据进行校验、创建索引、分析、汇总、存储。从图示可以看到`collector`还有一个功能是控制`agent`的`采样频率`。从而降低对应用程序系统的影响。

* `UI`(`jaeger-ui`)

`ui`模块负责从持久化存储中读取数据，在前端页面展示出来。除此之外`jaeger-ui`还能展现系统依赖拓扑图。

---

## Jaeger监控系统部署

`Jaeger`在部署过程中需要用到以下包几个镜像。

| 组件名称                                     | 镜像地址                                     |
| ---------------------------------------- | ---------------------------------------- |
| **jaeger-agent**                         | [hub.docker.com/r/jaegertracing/jaeger-agent/](https://hub.docker.com/r/jaegertracing/jaeger-agent/) |
| **jaeger-collector**                     | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/) |
| **jaeger-query**                         | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/) |
| **jaegertracing/jaeger-cassandra-schema** | [hub.docker.com/r/jaegertracing/jaeger-cassandra-schema/](https://hub.docker.com/r/jaegertracing/jaeger-cassandra-schema) |
| **cassandra**                            | [https://hub.docker.com/r/library/cassandra/](https://hub.docker.com/r/library/cassandra/) |


我们可以通过`docker`命令依次启动组件镜像，或者通过`docker-compose`来部署。

#### 通过`docker`命令部署

* 启动`cassandra`数据库

> docker run --rm -it --name cassandra -v /Users/ytx/cassandra/datadir:/var/lib/cassandra -p 9042:9042 cassandra:3.11

* 初始化数据库表结构

> docker run --link cassandra --rm jaegertracing/jaeger-cassandra-schema

* 启动`jaeger-collector`连接到数据库

> docker run --rm -it \
  -p 14267:14267/tcp \
  -p 14268:14268/tcp \
  -p 9411:9411/tcp \
  -e CASSANDRA_KEYSPACE=jaeger_v1_dc1 \
  -e CASSANDRA_SERVERS=192.168.33.99 jaegertracing/jaeger-collector

这里`14267`端口用于接受`Agent`发送上来的数据。`14268`端口用于接受`Client`直接发送上来的数据。在实际部署的时候`CASSANDRA_SERVERS`配置要做相应修改。

* 启动`Agent`

> docker run --rm -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778/tcp jaegertracing/jaeger-agent /go/bin/agent-linux --collector.host-port=192.168.33.99:14267

`Agent` `5778`端口用于接受`Collector`控制，如：采样频率变更、配置变更等。`6831`和`6832`端口表示`jaeger.thrift`分别通过`compact thrift protocol`和`binary thrift protocol`协议传输。`5775`端口用于接受`zipkin.thrift`数据结构。

`Client`默认通过`6832`端口发送数据。

* 启动`JaegerUI`

> docker run --rm -e CASSANDRA_KEYSPACE=jaeger_v1_dc1 -e CASSANDRA_SERVERS=192.168.33.99 -it -p 16686:16686/tcp jaegertracing/jaeger-query

`JaegerUI`需要连接到`cassandra`数据查询数据。同时提供提供前端页面展示数据。

`Jaeger`目前支持`cassandra`和`ElasticSearch`作为数据持久化系统，后续会有对`MySQL`等支持。


#### 通过`docker-compose`命令部署

```yaml
version: '2'
services:
  cassandra:
    image: cassandra:3.11
    container_name: cassandra
    environment:
      - CASSANDRA_DC=dc1
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    ports:
      - 9042:9042
    restart: on-failure
    volumes:
      - /Users/ytx/cassandra/logs:/var/log/cassandra    
      - /Users/ytx/cassandra/data:/var/lib/cassandra

  jaeger-cassandra-schema:
    image: jaegertracing/jaeger-cassandra-schema:0.9
    container_name: cassandra-schema
    links:
      - cassandra
    environment:
      - MODE=test
      - DATACENTER=dc1

  jaeger-collector:
    image: jaegertracing/jaeger-collector:0.9
    container_name: jaeger-collector
    restart: on-failure
    links:
      - cassandra
    environment:
      - CASSANDRA_SERVERS=cassandra
      - CASSANDRA_KEYSPACE=jaeger_v1_dc1
      - CASSANDRA_PORT=9042
    ports:
      - 14267:14267/tcp
      - 14268:14268/tcp
      - 9411:9411/tcp

  jaeger-agent:
    image: jaegertracing/jaeger-agent:0.9
    container_name: jaeger-agent
    restart: on-failure
    links:
      - jaeger-collector
    environment:
      - COLLECTOR_HOST_PORT=jaeger-collector:14267
    ports:
      - 5775:5775/udp
      - 6831:6831/udp
      - 6832:6832/udp
      - 5778:5778/tcp

  jaeger-query:
    image: jaegertracing/jaeger-query:0.9
    container_name: jaeger-query
    restart: on-failure
    links:
      - cassandra
    environment:
      - CASSANDRA_KEYSPACE=jaeger_v1_dc1
      - CASSANDRA_SERVERS=cassandra
    ports:
      - 8003:16686/tcp

networks:
  default:
    driver: bridge

```

---

## Jaeger集成到应用程序

`jaeger`团队提供了针对`Node.js`环境的工具包[jaeger-client-node](https://github.com/jaegertracing/jaeger-client-node)。如何能够跟团队项目代码更好的契合是接下来要考虑的点。针对现有的项目，在接入`Jaeger`的时候是一个渐进的过程，希望能够做尽量少的修改代码。

针对`Node.js`生态下`web`服务器的路由都是采用类似`connect`风格，我们对常用的`web`框架路由做相应的包装：

```javascript

function RouterProxy(router, config) {
  this.config = config
  this.proxyInstance = router  
}

RouterProxy.create = function (config, tracer = null) {
  if (!config.router) {
    throw new Error("Not Setup Router")
  }

  if (!config.proxy) {
    throw new Error("Not Setup Proxy")    
  }

  const proxyInstance = RouterCreator(config.proxy)
  const instance = new RouterProxy(proxyInstance, config)
  instance.wrap(config.router, tracer)

  return instance
}

RouterProxy.prototype.wrap = function (router, tracer = null) {
  if (!tracer) {
    tracer = opentracing.globalTracer()  
  }

  constants.PROXY_NAMES.forEach(method => {
    this.wrapRouterMethod(router, method, tracer)
  })

  return router
}

RouterProxy.prototype.wrapRouterMethod = function (router, method, tracer) {
  if (typeof router[method] !== 'function') {
    return
  }

  const that = this
  const doit = router[method].bind(router)
  router[method] = function (...args) {
    const length = args.length
    if (length <= 1 || typeof args[length-1] !== 'function') {
      return doit(...args)
    }
    const uri = args[0]
    const handler = that.wrapRouterMethodHandler(args[args.length - 1], uri, tracer)
    args.splice(length -1, 1, handler)
    return doit(...args)
  }

  return
}

RouterProxy.prototype.wrapRouterMethodHandler = function (handler, uri, tracer) {
  const that = this

  return function (...args) {
    const req = that.proxyInstance.request(...args)
    const res = that.proxyInstance.response(...args)
    const url = that.proxyInstance.url(...args)
    const method = that.proxyInstance.method(...args)

    const span = extractOrCreateSpan(req, uri, tracer)
    span.setTag(opentracing.Tags.HTTP_METHOD, method)
    span.setTag(opentracing.Tags.HTTP_URL, url)
    span.setTag(opentracing.Tags.SPAN_KIND, 'server')

    const traceCtx = { span, tracer }
    if (that.config.customizeTags) {
      that.config.customizeTags(traceCtx, ...args)
    }

    args[0].traceCtx = traceCtx

    function spanFinised () {
      span.finish()
    }

    onFinished(res, spanFinised)

    return handler(...args)
  }
}

```

通过以上方式在每个路由到达正式处理函数之前，[opentracing-connect](http://gitlab.yintech.net/ytx/paprika/nugget/backend/opentracing-connect)类库记录当前的`http`请求基本信息并把数据通过上下文参数暴露给用户处理函数，在处理完毕之后类库自动调用`finish`函数表示一次请求结束。需要注意的是：如果实际过程中希望记录更多的信息或者调用关系，需要用户参照`API`自己实现。

---

## JaegerUI基本使用

假定现有如下两个服务：

* Service One

```javascript

const express = require('express')
const request = require('request-promise')
const { Tracer, RouterProxy } = require('opentracing-connect')

const app = new express()

const serviceName = 'One'
Tracer.createGlobalTracer(serviceName, { logger: console })
const Router = RouterProxy.create({ router: { type: "express" }}).routerProxy(express.Router())

Router.get('/one',  async (request, response, next) => {
  const result = await requestServiceTwo(request.traceCtx.span)
  response.json(result)
})

async function requestServiceTwo(span) {
  const peerServiceName = 'Two'
  span.setTag(Tracer.opentracing.Tags.PEER_SERVICE, peerServiceName)
  
  let result  
  try {
    const carrier = {}
    const uri = 'http://localhost:8020/two'
    span.tracer().inject(span.context(), 
      Tracer.opentracing.FORMAT_HTTP_HEADERS, carrier)
    result = await request({ uri, headers: carrier })
    console.dir(result)
    span.log({'event': 'request_end'})
  } catch(err) {
    span.setTag(Tracer.opentracing.Tags.ERROR, true)
    span.log({ 'event': 'error', 'message': err.message })
  }

  return result
}

app.use(Router)

app.listen(8010)

```

* Service Two

```javascript

const Koa = require('koa')
const KoaRouter = require('koa-router')
const request = require('request-promise')
const { Tracer, RouterProxy } = require('opentracing-connect')
const Redis = require('./redis')

const app = new Koa()

const serviceName = 'Two'
const tracer = Tracer.createGlobalTracer(serviceName, { logger: console })
const Router = RouterProxy.create({ router: { type: "koa2" }}).routerProxy(KoaRouter())

Router.get('/two', async (ctx, next) => {
  try {
    const userId = 1
    const result = await getUserInfo(userId, { span: ctx.traceCtx.span })
    ctx.traceCtx.span.log({'event': 'request_end'})
    ctx.body = { a: 1, b: 2, c: 3 }
  } catch(err) {
    ctx.traceCtx.span.setTag(Tracer.opentracing.Tags.ERROR, true)
    ctx.traceCtx.span.logEvent('error', { message: err.message })
  }

  return 
})

async function getUserInfo(id, ctx) {
  const span = tracer.startSpan("getUserInfo", { references: [Tracer.opentracing.childOf(ctx.span.context())] })
  
  let result
  try {
    result = await Redis.getRedisUser(id, { span })
  } catch(err) {
    span.setTag(Tracer.opentracing.Tags.ERROR, true)
    span.logEvent('error', { message: err.message })
  }

  span.finish()

  return result
}

app.use(Router.routes())

app.listen(8020)

```

在两个服务启动的时候，分别创建了一个`tracer`对象，写入当前服务的名称，以及一个`logger`对象用于追踪`jaeger-client`的行为。 `ServiceOne`提供了一个请求处理函数，该处理函数接收到请求之后向`ServiceTwo`发起请求，而`ServiceTwo`向`Redis`服务发起请求读取用户信息，并返回给客户端。


通过`POSTMAN`向`ServiceOne`发起一个请求：

![postman](http://owoeej96r.bkt.clouddn.com/o_1btt652ft10qb1c8t1csl1h0jovha)

打开`Jaeger-UI`页面：

![jaeger-ui](http://owoeej96r.bkt.clouddn.com/o_1btt65vo21ee34491b2mn0pa6sf)

在`Jaeger-UI`页面左侧可以看到所有的服务列表，以及服务的`endpoint`列表。可以通过我们给应用程序设置的`tag`来搜索指定的`trace`。在`POSTMAN`页面可以看到响应时间为`114ms`,在`Jaeger-UI`看到此次`trace`有三个服务，包含四个`span`, `trace`的持续时间是`78ms`比`POSTMAN`检测到的时间要小，这是因为从服务器到`POSTMAN`客户端有网络延迟的缘故。

点击`trace`条目：

![jaeger-trace](http://owoeej96r.bkt.clouddn.com/o_1btt66ieuur4fd2m591umb1r8ok)

可以看到整个调用链路：

1. `ServiceOne`收到一个`GET`请求，`endpoint`为`/one`  
2. `ServiceOne`向`ServiceTwo`发送一个请求，`endpoint`为`/two`  
3. `Servicetwo`调用`getUserInfo`函数
4. `getUserInfo`函数向`Redis`服务发送一个`get`请求获取用户信息, 用户id为`1`
5. 最终`Redis`服务返回用户信息,`ServiceTwo`将用户信息返回给`ServiceOne`,`ServiceOne`把数据返回给客户端

单击每个`span`条目，可以看到`tag`、`log`等信息。[opentracing](https://github.com/opentracing/specification/blob/master/semantic_conventions.md)对`span`内常使用的`tag`以及`log`字段有相应的推荐。


## 参考文献

1. [Google Dapper paper](https://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/36356.pdf)  
2. [OpenTracing Best Pratices](http://opentracing.io/documentation/pages/instrumentation/)  
3. [OpenTraing Specification](https://github.com/opentracing-contrib/opentracing-specification-zh/blob/master/specification.md)

4. [OpenTracing Semantic Conventions](https://github.com/opentracing-contrib/opentracing-specification-zh/blob/master/semantic_conventions.md)

5. [Jaeger, a distributed tracing system](http://jaeger.readthedocs.io/en/latest/)

6. [Jaeger Client Node](https://github.com/jaegertracing/jaeger-client-node)  

7. [OpenTracing API for Javascript](https://github.com/opentracing/opentracing-javascript)


*--EOF--*