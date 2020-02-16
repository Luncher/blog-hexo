---
title: Kong网关集成到Prometheus监控
categories: 系统监控
keywords: 
  - prometheus
  - kong
  - gateway
date: 2017-08-01 14:10:30
---

Prometheus作为目前云生态环境下炙手可热的监控报警平台，目前已经得到社区开发者和厂商的广大认可。其灵活的组件设计为编写第三方扩展提供了很大方便。针对不同的应用场景，prometheus包含了大量了`exporter`。如: 各种数据库exporter，硬件信息的exporter，消息系统如`kafka`的exporter等。

在公司项目引入`kong`之后，发现没有一个合适的`exporter`可以用，所以动手实现了一个。


首先在Kong后台配置一个[HttpLogPlugin](https://getkong.org/plugins/http-log/?_ga=2.105865475.1226178032.1511256708-1617277625.1509955587)插件。

![kong插件列表](/images/kong-plugin.jpg)

Prometheus要求exporter提供一个`/metrics`的`endPoint`供给Prometheus Main Server调用，定时拉取当前网关的各项指标。而kong网关一端利用一个`HttpLogPlugin`插件定时把数据抛到`exporter`:

```go
func main() {
	http.Handle("/metrics", promhttp.Handler())
	http.Handle("/kong", http.HandlerFunc(handleKong))
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

初始化的时候注入各项`metrics label`:

```go

import (
	"encoding/json"
	"fmt"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"log"
	"net/http"
)

var (
	totalRequest = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_total_request_size",
			Help: "total http request size",
		}, []string{"status", "module"})

	responseTimeInMs = prometheus.NewSummaryVec(
		prometheus.SummaryOpts{
			Name: "http_response_time_milliseconds",
			Help: "Request completed time in milliseconds",
		}, []string{"method", "module", "status", "method_type"})
)

func init() {
	prometheus.MustRegister(totalRequest)
	prometheus.MustRegister(responseTimeInMs)
}

```

kong抛过来的log主要包含请求的客户端ip、请求基本数据、请求延迟、请求的消费方、以及响应数据等：

```go
type KongLog struct {
	Request   Request   `json:"request"`
	Response  Response  `json:"response"`
	Api       API       `json:"api"`
	Consumer  Consumer  `json:"consumer"`
	Latencies Latencies `json:"latencies"`
	ClientIp  string    `json:"client_ip"`
}
```

接收到kong抛过来的数据之后，写入`prometheus`缓存：

```go
func handleKong(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var kongLog KongLog
	err := decoder.Decode(&kongLog)
	if err != nil {
		log.Println(err)
		log.Printf("handleKong Decode error\n")
		return
	}
	defer req.Body.Close()

	log.Printf("%#v\n", kongLog.Request)
	log.Printf("%#v\n", kongLog.Response)
	log.Printf("%#v\n", kongLog.Api)
	log.Printf("%#v\n", kongLog.Consumer)
	log.Printf("%#v\n", kongLog.Latencies)
	log.Printf("%#v\n", kongLog.ClientIp)

	method := kongLog.Request.Uri
	module := kongLog.Api.Name
	status := fmt.Sprint(kongLog.Response.Status)
	methodType := kongLog.Request.Method
	responseTimeInMs.With(prometheus.Labels{"method": method, "module": module, "status": status, "method_type": methodType}).Observe(float64(kongLog.Latencies.Request))
	totalRequest.With(prometheus.Labels{"status": status, "module": module})

	return
}
```

项目代码地址：[kong-prometheus-exporter](https://github.com/Luncher/kong-prometheus-exporter)