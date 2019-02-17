---
title: MixedContent-混合内容
date: 2019-01-31 14:32:56
tags: mixed-content
categories: web
---



### 项目背景
​
Linking项目里存在一项设备视频回放功能，回放的视频文件格式为`m3u8`。`m3u8`是一种基于[HTTP Live Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)协议的文件视频格式。对于该类型的视频文件解析步骤如下：
​
cc677cb3e13d22ee536dba24e4747966.jpeg
​
HLS依赖浏览器提供的[Media Source Extensions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API)
来完成组合，使之能够使用`<audio>`和`<video>`来进行播放。所以第一步需要`Browser API Check`。可以通过[caniuse](https://caniuse.com/#feat=mediasource)来查询API的支持情况。
​
第二步加载视频文本文件`Load Mainfile`。文件内容大致如下：
​
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
​
Linking项目设备视频的`ts`文件存放在客户的存储空间`bucket`，而客户存储空间的外网域名往往不会绑定`https`证书。这个时候在播放视频的时候，浏览器会报出一个`Mix-Content`错误。
​
---
​
### 定义
HTTPS网站中加载的HTTP资源被称之为Mixed Content。举个例子，如果你的网站地址是：`https://www.example.com`，该页面包含了一个图片资源：`<img src="http://external.com/resource.jpg"/>`那么这个图片资源被称之为Mixed Content。
项目背景

Linking项目里存在一项设备视频回放功能，回放的视频文件格式为m3u8。m3u8是一种基于HTTP Live Streaming协议的文件视频格式。对于该类型的视频文件解析步骤如下：

cc677cb3e13d22ee536dba24e4747966.jpeg

HLS依赖浏览器提供的Media Source Extensions API
来完成组合，使之能够使用<audio>和<video>来进行播放。所以第一步需要Browser API Check。可以通过caniuse来查询API的支持情况。

第二步加载视频文本文件Load Mainfile。文件内容大致如下：

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
ts文件存放的是视频分片的二进制内容，通过浏览器的XHR加载m3u8和ts文件。

Linking项目设备视频的ts文件存放在客户的存储空间bucket，而客户存储空间的外网域名往往不会绑定https证书。这个时候在播放视频的时候，浏览器会报出一个Mix-Content错误。

定义

HTTPS网站中加载的HTTP资源被称之为Mixed Content。举个例子，如果你的网站地址是：https://www.example.com，该页面包含了一个图片资源：<img src="http://external.com/resource.jpg"/>那么这个图片资源被称之为Mixed Content。

分类

W3C标准组织按照混合内容被中间人篡改攻击时的损害程度分为两个类别：

被动内容(Passive content)

指的是一些纯展示型的内容，这些内容往往不会修改网页的其他部分，危险比较小，即使被中间人攻击也无大碍，根据W3C的规定这类资源内容也被归类为Optionally-Blockable。主要包含以下几类：

通过img标签加载的图片或者CSS的backgrounng-image、border-image加载的图片
通过video、source标签加载的视频资源
通过audio、source标签加载的音频资源
目前由于改类型的资源使用过于广泛，浏览器默认允许加载该类型的资源。W3C希望尽可能缩小该类型资源的范围, 不过没有一个具体的roadmap。
活跃的内容(Active content)

依据W3C的标准，任何不属于Optionally-Blockable的资源内容均归为此类型。这类资源也称之为Blockable。最典型的包含：脚本和CSS资源、通过XHR发送的数据请求等。

混合内容的strict mode

现代浏览器默认允许加载Optionally-Blockable的内容，而阻止加载Blockable的内容。为了确保呈现给用户界面的安全性。网页开发者可以启用更加严格的策略来控制混合内容。

使用CSP开启严格模式

CSP全称：Content-Security-Policy。它是一个而外的安全层，用于检测并削弱特定类型的攻击，如XSS和数据注入等。
使用CSP控制混合内容有两种形式：

HTTP 响应头方式
Content-Security-Policy: block-all-mixed-content
meta标签
<meta http-equiv="Content-Security-Policy" content="block-all-mixed-content">
浏览器的行为

以下测试基于chrome 71, 不同的浏览器可能会有差异 :)
安全小锁

如果站点所有的资源都是通过安全的https请求加载，那么在地址栏将会看到一个小锁：
e04bba7028c9aedbefff008066a1c6cc.png
反之会看到小锁变成一个类似惊叹号的图标：
05f8e0b5d690479a6420bd3d31447acc.png

浏览器地址栏的小锁就像是一个指示器, 告知用户当前网页是否存在安全风险。
地址栏的指示器主要有三个状态：

安全--小锁
网页下所有资源都是通过https请求返回，即理想状态。
信息或不安全--惊叹号
网页下部分资源通过http请求返回，例如加载了某些Optional-Blockable的图片资源等。
不安全或危险--红色警告
主要因为chrome验证https网站提供的证书过期或者网站提供的证书不是由受信任组织发放等。
修正安全指示: 惊叹号

通过upgrade-insecure-requests这个 CSP 指令页面所有 HTTP 资源，会被替换为 HTTPS 地址再发起请求。这个时候可能会出现一些资源无法访问这个时候就需要通过一个支持https的域名做一次反向代理。

修正安全指示: 不安全或危险

对于证书出现过期，或者无法获取有效的https。可以考虑使用letsencrypt这个免费提供证书的服务。

加载Optionally-Blockable资源

浏览器默认加载Optionally-Blockable的资源，但是会给出一些警告，例如把全站https的网页内的某个图片换成http请求：

9cae3c650c8bd557c8683f03f79fb430.png

地址栏的小锁消失了。同时打开console，可以看到浏览器给出的一个警告：

260a0908d9740d3fb07a53d2e785b6af.png

加载Blockable资源

把网页的一个css资源链接从https换成http:

afa277717afc827e78c4d3e1a382ca96.png

可以看到，浏览器默认禁止加载此类资源。

严格模式

编辑网页，加入启用严格模式的meta标签：
20b60361e042845fc6fc7abac62ce83d.png

修改图片链接地址：

d6b792a48a5f0e8e77b2a56216718cf3.png

查看浏览器终端：
76254f744e4de336607c00228d0516d5.png

在启用严格模式情况下，全站资源都被当作Blockable类型处理，浏览器默认报错，不允许加载这些资源。

MixedContent vs SameOriginPolicy

MixedContent和SameOriginPolicy都是浏览器基于安全的设计, MixedContent可以被认为是更加严格的模式，限制的范围更广。SameOriginPolicy并没有阻止通过html的tag加载第三方资源。而MixedContent限制的更加严格。而对于XHR和Fetch发起的请求，SameOriginPolicy可以通过CORS来控制，MixedContent默认禁止，也没有相应的配置, MixedContent依托于浏览器自身的限制，而SameOriginPolicy浏览器需要依赖服务器的响应作出判定。

Linking播放器现状

启用一个新的http弹窗页面来解决加载ts文件被浏览器Block的问题。
