---
title: 关于express下session的几个注意事项
categories: [server, nodejs]
date: 2016-10-07 19:30:20
---

使用nodejs开发web应用之所以快，其中一个重要原因是非常齐全的第三方模块，你几乎可以找到任何想要的`module`。`express-session`是`express`WEB框架常用的`session`管理包。其主要有如下几个配置选项：  
- cookie : 用于设置sessionID cookie选项，如过期时间，cookie适用的路径等。  
- name  : sessionID 对应的cookie名。  
- resave  :  强制把session写入存储，即使session在整个请求过程中都没有被修改。  
- saveUninitialized  : 保存新建的但没有被改动的session。  
- secret : 加密sessionID cookie的密钥。  

<!-- more -->


---  

###1、 session并发问题  
`resave`选项如果配置为`true`，而实际的运用场景有并发请求并且依赖`session`的情况下就得注意了。因为问题在于，一个请求设置得数据可能被另外一个请求重写覆盖了。 对于一些有并发的服务器，需要把该选项配置为`false`。当然这只能解决`session`信息覆盖的问题。 并不能很好解决`session`数据一致性问题，比如说：用户首先发送一个更新`session`的请求，该请求依赖于其他服务器的应答，而后续的其他请求依赖于最新得`session`信息否则必须给以错误得应答。这个时候我们必须手动更新`session`的信息，把依赖于更新`session`信息的并发请求串行化。  

``` javascript
    Promise.resolve()
    .then(function() {
        req.session.user.gameKey = null;
        req.session.user.companyId = null;
        return syncUserSession(req);
    })
    .then(function() {
      //....
    });

    function updateUserInfo(user) {
        return new Promise(function(resolve, reject) {
        user.gameKey = gameKey;
        user.companyId = user.companyIdSrc;
        user.save(function() {
            req.session.user = user;
        });
        });
    }

```  


###2、 合理搭配中间件得顺序  
`express-session`作为几个基础中间件，每次请求都有创建对象，分配内存，保存数据等一系列操作。实际上，服务器上一些资源得应答没有使用到`session`。所以我们可以把它提前。当然也可以把没有使用到`session`得用户中间件提前。  

``` javascript  
//静态资源
app.use('/public', express.static(staticDir));  
app.use(require('cookie-parser')(config.session_secret));
app.use(session({
	secret: config.session_secret,
	store: new RedisStore({
		port: config.redis_port,
		host: config.redis_host
	}),
    resave: false,
	saveUninitialized: true
}));

```  

`cookie-parser`模块解析`cookie`数据，随后得`session`模块根据`sessionID cookie`管理会话数据。 把静态资源服务提前避免不必要得`session`操作。





