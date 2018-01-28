---
title: URL编解码
categories: web
date: 2016-04-17 10:37:03
---
&nbsp;&nbsp;&nbsp;&nbsp;URI(统一资源定为标志)，用于指定想要访问的资源，URI可以有各种形式，如：日常在用的URL、每本书背面的ISBN码都是URI的一种形式, 日常过程中，如果不加区分，一般说的`URI`都指的是`URL`。拿我们熟悉的URL来说：

一个普通的URL：
>https://www.baidu.com/fuck.php?action=run#hash=1

URL一般包括以下几个部分：

+ 1. Scheme
指定URL协议：http/https
+ 2. hostname
指定域名，如上面的`www.baidu.com`
+ 3. port
指定目标主机端口号，`http`协议默认为80端口，`https`默认为433端口。
+ 4. path
指定要访问的资源路径，以上为`fuck.php`
+ 5. query
以`?`开头，传递给目标主机的参数，`key/value`的形式来表示参数，参数之间通过`&`符号间隔开来。在`Nodejs`服务器，上面的`URL`最终解析得到`query`对象:
> req.query = {action: run}
+ 6. hash
`hash`参数用于给浏览器渲染出来的`HTML`界面指定锚点，服务器在解析`URL`的时候会把`#`后面的字符丢弃。

如果在实际运用过程中我们仅仅只需要知道这些概念就好了，可惜事情的复杂度往往比现象的要大。

- 如果要给`URL`放其他字符怎么处理，如果我想放一些二进制数据呢？
- 数据量一大，URL会不会出现过长的问题？

####URL编解码
&nbsp;&nbsp;&nbsp;&nbsp;在编写`js`代码过程中有几个常用的`URL`编码函数：`encodeURI`, `encodeURIComponent`, `atob`。以及对应的解码函数：`decodeURI`, `decodeURIComponent`, `btoa`。关于编解码，官方也有明确的规定(RFC 3986文档)，以下字符为保留字符，如果开发者需要使用它，就需要对其编码：
> ; , / ? : @ & = + $

同时也规定了一些非保留字符：
>字母/数字/- _ . ! ~ * ' ( )	

**对URL特殊字符的编码称之为`百分号编码`**。即：
> 对于特殊字符序，需要转换为`UTF-8`编码方式，然后取每个字节的16进制值，在其前面加上`%`号，完成编码。由于`UTF-8`编码兼容`ASCII`码，所以对于**特殊字符**只需要取其`ASCII`码的16进制值，在前面加上`%`即可。由于`%`号(ASCII HEX = 25)在`URL`编码有特殊的含义，所以也需要对它编码：`%25`。最终得到的`url`仅仅由定义`URL schema`需要的字符，加上非保留字符组成。


来看看几个编解码函数的具体功能：
+ encodeURI/decodeURI
用于对整个`URL`编解码，但是其不会对**保留字符与上面定义的非保留字符**进行编码。举个例子：
普通的编码：
```javascript

> var url1 = 'http://www.baidu.com/fuck.php?action=run';
undefined

> encodeURI(url1)
'http://www.baidu.com/fuck.php?action=run'
> 

```

加上几个保留字符试一试：
``` javascript

> var url1 = 'http:/$/@;www.baidu.com/fuck.php?action=run';

> encodeURI(url1)
'http:/$/@;www.baidu.com/fuck.php?action=run'
> 

```
**可以看到并没有对保留字符编码。**

再加入几个其他字符，如中文，试一试：
```javascript
> var url1 = 'http:/$/@;www.baidu.com/你好fuck.php?action=run';

> encodeURI(url1)
'http:/$/@;www.baidu.com/%E4%BD%A0%E5%A5%BDfuck.php?action=run'

```
`你好`对应的`Unicode`码为：`4F60`、`597D`。`UTF-8`编码之后分别为：`E4BDA0`与`E5A5BD`正好匹配`encodeURI`的输出。
**可以看到对encodeURI除保留字符与特殊字符外的字符进行了编码。**

>由于`encodeURI`不会对一些特殊字符编码，但是`URL`规范使用中必须对一些特殊字符譬如说：`&`, `=`,`+`进行编码。所以我们要用到的另一个函数是`encodeURIComponent`。

**encodeURIComponent会把除非保留字符外的字符，通过百分号编码，转化为非保留字符的形式，这其中就包括了特殊字符。**
看几个例子：
``` javascript
> var component = 'http://www.baidu.com'; 

> encodeURIComponent(component);
'http%3A%2F%2Fwww.baidu.com'
> 

```
`:`, `/`都是保留字符，而`.`以及字母是非保留字符，验证了我们的想法。

如果我们要在`URL`传入一些二进制数据怎么办呢？首先想到的是：**`Base64`编码的出现主要就是为了解决二进制数据的传输问题**。`btoa`就是我们想要的接口。
举个例子：
```javascript
var atob = require('atob');
var btoa = require('btoa');

var u1 = 'http://www.baidu.com';

console.log(btoa(u1));

```
输出：
> aHR0cDovL3d3dy5iYWlkdS5jb20=

由于`Base64`在被编码字符长度不为`3`的倍数情况下会出现`=`号，**而`=`是保留字符**，由于它在这里有特殊的含义(表示传输数据的一部分)，所以需要调用`encodeURIComponent`对其进行编码。


####URL的一些数据长度限制规定
`web 浏览器`对整个 URI 长度有一定的限制。传统的IE浏览器是2048个字节，而现代各种浏览器和 web 服务器的设定均不一样，这依赖于各个浏览器厂家的规定或者可以根据 web 服务器的处理能力来设定。



