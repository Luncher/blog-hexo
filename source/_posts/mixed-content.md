---
title: Mixed-Content-混合内容
date: 2019-01-28 21:07:43
tags: http, mixed-content
categories: web
---

### 项目背景

Linking项目里存在一项设备视频回放功能，回放的视频文件格式为`m3u8`。`m3u8`是一种基于[HTTP Live Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)协议的文件视频格式。对于该类型的视频文件解析步骤如下：

<!-- more -->

![hls.jpg](/img/hls.jpg)

HLS依赖浏览器提供的[Media Source Extensions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API)
来完成组合，使之能够使用`<audio>`和`<video>`来进行播放。所以第一步需要`Browser API Check`。可以通过[caniuse](https://caniuse.com/#feat=mediasource)来查询API的支持情况。

第二步加载视频文本文件`Load Mainfile`。文件内容大致如下：

```shell
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-TARGETDURATION:11
#EXTINF:10.000,
url_462/193039199_mp4_h264_aac_hd_7.ts
#EXTINF:10.000,
url_463/193039199_mp4_h264_aac_hd_7.ts
#EXTINF:10.000,
url_464/193039199_mp4_h264_aac_hd_7.ts
#EXTINF:10.000,
url_465/193039199_mp4_h264_aac_hd_7.ts
#EXTINF:10.000,
url_466/193039199_mp4_h264_aac_hd_7.ts
...
```
`ts`文件存放的是视频分片的二进制内容，通过浏览器的`XHR`加载`m3u8`和`ts`文件。

Linking项目设备视频的`ts`文件存放在客户的存储空间`bucket`，而客户存储空间的外网域名往往不会绑定`https`证书。这个时候在播放视频的时候，浏览器会报出一个`Mix-Content`错误。

---

### 定义
HTTPS网站中加载的HTTP资源被称之为Mixed Content。举个例子，如果你的网站地址是：`https://www.example.com`，该页面包含了一个图片资源：`<img src="http://external.com/resource.jpg"/>`那么这个图片资源被称之为Mixed Content。

---

### 分类
W3C标准组织按照混合内容被中间人篡改攻击时的损害程度分为两个类别：


#### 被动内容(Passive content)

指的是一些纯展示型的内容，这些内容往往不会修改网页的其他部分，危险比较小，即使被中间人攻击也无大碍，根据W3C的规定这类资源内容也被归类为`Optionally-Blockable`。主要包含以下几类：

+ 通过`img`标签加载的图片或者CSS的`backgrounng-image`、`border-image`加载的图片
+ 通过`video`、`source`标签加载的视频资源
+ 通过`audio`、`source`标签加载的音频资源
>目前由于改类型的资源使用过于广泛，浏览器默认允许加载该类型的资源。W3C希望尽可能缩小该类型资源的范围, 不过没有一个具体的`roadmap`。


#### 活跃的内容(Active content)
依据W3C的标准，任何不属于`Optionally-Blockable`的资源内容均归为此类型。这类资源也称之为`Blockable`。最典型的包含：脚本和CSS资源、通过`XHR`发送的数据请求等。

---

### 混合内容的`strict mode`
现代浏览器默认允许加载`Optionally-Blockable`的内容，而阻止加载`Blockable`的内容。为了确保呈现给用户界面的安全性。网页开发者可以启用更加严格的策略来控制混合内容。

#### 使用CSP开启严格模式
>CSP全称：`Content-Security-Policy`。它是一个而外的安全层，用于检测并削弱特定类型的攻击，如XSS和数据注入等。

使用CSP控制混合内容有两种形式：
+ HTTP 响应头方式
>Content-Security-Policy: block-all-mixed-content

+ meta标签
><meta http-equiv="Content-Security-Policy" content="block-all-mixed-content">

---

### 浏览器的行为
>以下测试基于chrome 71, 不同的浏览器可能会有差异 :)

#### 安全小锁
如果站点所有的资源都是通过安全的`https`请求加载，那么在地址栏将会看到一个小锁：
![mixed-content-http1.png](/img/http1.jpg)
反之会看到小锁变成一个类似惊叹号的图标：
![mixed-content-http2.png](/img/http2.jpg)

浏览器地址栏的小锁就像是一个指示器, 告知用户当前网页是否存在安全风险。
地址栏的指示器主要有三个状态：
+ 安全--小锁
>网页下所有资源都是通过https请求返回，即理想状态。
+ 信息或不安全--惊叹号
>网页下部分资源通过http请求返回，例如加载了某些`Optional-Blockable`的图片资源等。
+ 不安全或危险--红色警告
>主要因为chrome验证https网站提供的证书过期或者网站提供的证书不是由受信任组织发放等。

##### 修正安全指示: `惊叹号`
通过`upgrade-insecure-requests`这个 CSP 指令页面所有 HTTP 资源，会被替换为 HTTPS 地址再发起请求。这个时候可能会出现一些资源无法访问这个时候就需要通过一个支持https的域名做一次反向代理。

##### 修正安全指示: `不安全或危险`
对于证书出现过期，或者无法获取有效的https。可以考虑使用[letsencrypt](https://letsencrypt.org/)这个免费提供证书的服务。

#### 加载`Optionally-Blockable`资源
浏览器默认加载`Optionally-Blockable`的资源，但是会给出一些警告，例如把全站https的网页内的某个图片换成http请求：

![mixed-content-http3](/img/http3.jpg)

地址栏的小锁消失了。同时打开console，可以看到浏览器给出的一个警告：

![mixed-content-http4](/img/http4.jpg)


#### 加载`Blockable`资源
把网页的一个css资源链接从`https`换成`http`:

![mixed-content-http5](/img/http5.jpg)

可以看到，浏览器默认禁止加载此类资源。

#### 严格模式

编辑网页，加入启用严格模式的`meta`标签：
![mixed-content-http6](/img/http6.jpg)

修改图片链接地址：

![mixed-content-http7](/img/http7.jpg)

查看浏览器终端：
![mixed-content-http8](/img/http8.jpg)

在启用严格模式情况下，全站资源都被当作`Blockable`类型处理，浏览器默认报错，不允许加载这些资源。

---

### MixedContent vs SameOriginPolicy

`MixedContent`和`SameOriginPolicy`都是浏览器基于安全的设计, `MixedContent`可以被认为是更加严格的模式，限制的范围更广。`SameOriginPolicy`并没有阻止通过html的tag加载第三方资源。而`MixedContent`限制的更加严格。而对于`XHR`和`Fetch`发起的请求，`SameOriginPolicy`可以通过`CORS`来控制，`MixedContent`默认禁止，也没有相应的配置, `MixedContent`依托于浏览器自身的限制，而`SameOriginPolicy`浏览器需要依赖服务器的响应作出判定。
