---
title: Session-&-Cookie
categories: server
date: 2015-09-07 09:37:03
---
### Session

&nbsp;&nbsp;&nbsp;&nbsp;web网站基于`HTTP`协议来做业务交互，`HTTP`协议本身是一个无状态的协议，但实际情况是日常很多业务逻辑都需要记录用户的行为信息。举个例子：

<!-- more -->

> 一个购物网站，顾客会在商品浏览页面选取需要的各类商品，放置到虚拟的购物车内。下单的时候需要跳转到结算页面，在这一串连续的用户行为中，至关重要的一点是记录当前的购物车信息，而session机制可以恰当的处理此类问题。

&nbsp;&nbsp;&nbsp;&nbsp;网站通常会在用户第一次登录的时候生成一个`Session ID`, `Session ID`不同于用户ID, 用户ID始终唯一，但是同一个用户每次登录获取的`Session ID`可能不一致。`Session ID`由服务器端生成，通过`HTTP`协议头返回给客户端，这样可以极大的降低可能导致的安全问题(其他劫持暂且不说)。因为浏览器拿到的只是一个`token`，而与此相关的数据存储都在服务器端完成。服务端在设置`session ID`的同时会指定改`session id`的过期时间，以及该`session id`试用的请求路径(path)。了解了`session`的大致原理，下面结合代码来了解大致的使用过程。

#### 从cookie说起

上述使用案例得益于`cookie`这一伟大发明，一般来说cookie的处理分为如下几个步骤：
+ 1. 用户打开网页
+ 2. 服务端生成cookie数据返回给浏览器
+ 3. 浏览器将cookie保存
+ 4. 之后每次加载该页面，浏览器都把cookie数据发送给服务器


#### cookies的基本数据格式
标准的 `HTTP`协议有一个字段`Set-Cookie`用于标示cookie数据。服务器通过该字段告知客户端cookie数据。设置`cookie`数据的同时支持给该数据指定一些配置信息：
- Path: 表示该cookie数据影响到的路径，当前访问的url不满足该匹配时，不发送该cookie数据。
- Expires: 该`cookies`数据的过期时间(具体的时间点)，如果不设置该选项，在浏览器关闭时该`cookie`丢失。该字段是一个UTC格式的字符串。
- Max-Age: 告知浏览器`cookie`多久之后过期，可以解决客户端与服务器时间不一致导致过期时间不准确的问题, 在express里时间单位是毫秒。
- HttpOnly: 告知浏览器该`cookie`不允许通过浏览器API的形式去修改，比如说通过`document.cookie`修改。在`document.cookie`不可见。
- Secure: 当设置该值为`true`时，`cookie`数据在`HTTP`协议下无效，只有在`HTTPS`协议下才有效。
- domain: `domain`属性指定了该`cookie`所属的域名(`Domain`), 比如说设置`domain=example.com`,那么浏览器在给`www.example.com`, `www.abc.example.com`发送`HTTP`请求时都会带上该`cookie`。如果服务器没有设置该属性那么浏览器默认该`cookie`从属于`www.example.com`域名。说到这里，一定会想，要是我把domain设置为其他网站,这样我是不是可以轻易更改其他网站的`cookie`数据了？浏览器有个策略，允许`foo.example.com`的服务器设置`domain`为`example.com`或者`foo.example.com`。但是不允许设置`domain`为`bar.example.com` ETC。同时考虑到安全方面的因素，浏览器拒绝只给`domain`设置公共(public suffixes)，比如说设置为`com`, `co.uk`是不被允许的。

---

**Set-Cookie格式定义**
>
*Set-Cookie: name=value; Path:/; Domin=.domin.com;Secure=true*

第一部分表示设置的`cookie`键/值，后面跟着几个配置参数。


###Cookie 解析
`Express/Connect`有一个`cookieParser`中间件专门负责`cookieParser`的解析。其实现原理如下：
``` javascript


function parserCookie(cookie, options) {
   var obj = {};
   var pairs = cookies.split(/; /);
   var decode = opt.decode || decodeURIComponent;
   
   pairs.forEach(function(pair) {
      var eq_idx = pair.indexOf('=');
      var key = pair.substr(0, eq_idx).trim();
      var val = pair.substr(eq_idx, pair.length).trim();
       try {
           obj[key] = decode(val);
        }
        catch(err) {
           obj[key] = val;
        }
   });
   
   return obj;
}

function parseSignCookie(cookies, secret) {
  var keys = Object.keys(cookies);
  var dec = null;
  var ret = Object.create(null);
  var val = null

  for(var i = 0; i < keys.length; i++) {
     var k = keys[i];
     var v = cookies[k];
     dec = unsign(v, secret);
    ret[k] = dec;
  }
  return ret;
}

function parseJSONCookie(cookie) {
   var keys = Object.keys(cookie);
   var key;
   var val;

   for(var i = 0; i < cookie.length; i++) {
      val = cookie[i];
      key = keys[i];
      obj[key] = JSON.parse(val);
   }
}


var cookieParser = function(secret, opts) {
function(req, res, next) {
    if(req.cookies) return;
    
    var cookies = req.headers.cookies;
    req.cookies = {};
    req.signCookies = {};

   //把name=value格式的字符串解析为一个json对象
    req.cookies = parserCookie(cookies, options);

    if(secret) {
      //解析加密过的cookie字段
      req.signCookies = parseSignCookie(req.cookies, secret);
      //解析stringify过的JSON对象
      req.signCookies = parseJSONCookie(req.signCookies);
    }
    
    req.cookies = parseJSONCookies(req.cookies);
}
}
```

> Express 给不一样的cookie字段值打上不一样的标签，如`j: `表示该值是一个JSON对象stringify后的值，`s: `表示该字段是经过加密的。默认把加密与未加密的字段分别放在`req.signCookies`, `req.cookies`。

---

### 设置 Cookie 

`Express`提供了一个`res.cookie`接口来设置`Cookie`数据。来看看`Express`的处理代码：

``` javascript

res.cookie = function (name, value, options) {
  var opts = merge({}, options);
  var secret = this.req.secret;
  var signed = opts.signed;

  if (signed && !secret) {
    throw new Error('cookieParser("secret") required for signed cookies');
  }

  var val = typeof value === 'object'
    ? 'j:' + JSON.stringify(value)
    : String(value);

  if (signed) {
    val = 's:' + sign(val, secret);
  }

  if ('maxAge' in opts) {
    opts.expires = new Date(Date.now() + opts.maxAge);
    opts.maxAge /= 1000;
  }

  if (opts.path == null) {
    opts.path = '/';
  }

  this.append('Set-Cookie', cookie.serialize(name, String(val), opts));

  return this;
};

//序列化cookie以及配置信息
function serialize(name, val, options) {  
  var enc = opt.encode || encode;  
  var pairs = [name + '=' + enc(val)];  
  if (null != opt.maxAge) {    
    var maxAge = opt.maxAge - 0;    
    if (isNaN(maxAge)) 
      throw new Error('maxAge should be a Number');    
    pairs.push('Max-Age=' + maxAge);  
  }  
  if (opt.domain) pairs.push('Domain=' + opt.domain);  
  if (opt.path) pairs.push('Path=' + opt.path);  
  if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());  
  if (opt.httpOnly) pairs.push('HttpOnly');  
  if (opt.secure) pairs.push('Secure');  return pairs.join('; ');
}

//设置到HTTP应答协议头
res.append = function append(field, val) {
  var prev = this.get(field);
  var value = val;

  if (prev) {
    // concat the new and prev vals
    value = Array.isArray(prev) ? prev.concat(val)
      : Array.isArray(val) ? [prev].concat(val)
      : [prev, val];
  }

  return this.set(field, value);
};

```

---
