---
title: 使用passport管理第三方授权认证
categories: server
date: 2016-01-07 10:37:03
---
`passport`是一个为`Nodejs`设计的，兼容`Express`的认证中间件。通过第三方插件的形式(以下称为`strategy`)，可以应对各式各样的认证请求。`passport`具有高度的灵活性，并不依赖于任何一个路由，或者指定的数据存储，这样给上层开发者提供的极大的便利性。`passport`提供的接口也相对简单，只需要给它一个认证请求，`passport`会提供一个钩子函数(`hook`)告诉你请求失败了或者成功了。

---

### 1. passport的设计思路
`passport`基于一个高度灵活的设计结构，主要由四个模块组成：`passport`插件(strategy)管理模块、`执行认证操作的授权模块`、`framewark适配模块`、`session管理模块`。其结构框图如下：

![系统框图](http://www.tangide.com/storage/read.php?path=wechat/o/oSjbMs7GPu-gH9dZ4tsoo52y4gmo/blog/passport%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B.png)


授权流程(引用`github oath2.0`来举例)

![授权流程](http://www.tangide.com/storage/read.php?path=wechat/o/oSjbMs7GPu-gH9dZ4tsoo52y4gmo/blog/passport-%E6%8E%88%E6%9D%83%E6%B5%81%E7%A8%8B.png)

+ 1.授权插件体系  
所有的`passport`插件都继承自`passport-strategy`，紧接着根据不同的授权流程又细分为OAuth2.0授权中间件、OPENID类的授权中间件、以及帐号密码类的授权中间件。这些基本的中间件官方已经有了标准的实现。开发者需要做的是去继承这些授权中间件，针对不同的业务需求，配置特定的部分参数。就可以完成一整个授权的流程。常见的OAth2.0标准的授权插件有：`passport-github`、`passport-twitter`。这些针对不同厂商的第三方`Strategy`体量都非常小，基本在100行代码内可以搞定，因为大部分工作都交给标准的`strategy`来做了。


+ 2.framework适配  
`passport`官方的实现基于标准的`Express`形式的风格，也就是说，中间件的函数风格类似于：
> function authenticate(req, res, next)
>//如果需要适配其他的框架需要实现特定风格的`authenticate`函数。 



+ 3.session管理  
`passport`提供session的功能，如果开启该功能，则需要提供序列化，以及反序列化接口。`express-session`是一个很好的session管理包，所以还是让`passport`专注于授权认证吧！

--- 

### 2. passport使用

+ 1. 注入第三方`strategy`

```javascript

function verifyProfile(accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
   done(null, profile);
}

passport.use(new GithubStrategy({
clientID: '123-456-789',
clientSecret: 'easdasjdklasjd',
callbackURL: 'http://www.example.com/auth/github/callback'
}), verifyProfile);

```  
passport提供`use`函数用于注入授权认证的插件、`unuse`用于注销认证插件。`verifyProfile`接口是一个`hook`，用来验证用户信息的有效性。


+ 2. 授权认证  
```javascript  

//请求授权码
app.get('/user/login/github', passport.authenricate('github', {scope: 'wl_scope'}));
//获取accessToken以及请求用户信息，关闭session功能
app.get('/auth/github/callback', passport.authenricate('github', {session: false, failureRedirect: '/'}));

```  
---

### 3. passport源码分析

+ 1. 授权认证入口函数  
``` javascript

Authenticator.prototype.authenticate = function(strategy, options, callback) {
  return this._framework.authenticate(this, strategy, options, callback);
};

```

+ 2. express 风格的认证函数
```javascript

module.exports = function authenticate(passport, name, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  return function authenticate(req, res, next) {

     function allFailed() {
      if (callback) {
        if (!multi) {
          return callback(null, false, failures[0].challenge, failures[0].status);
        } else {
          var challenges = failures.map(function(f) { return f.challenge; });
          var statuses = failures.map(function(f) { return f.status; });
          return callback(null, false, challenges, statuses);
        }
      }
      ....
    }
    (function attempt(i) {
      var layer = name[i];
      // If no more strategies exist in the chain, authentication has failed.
      if (!layer) { return allFailed(); }
      var prototype = passport._strategy(layer);
      if (!prototype) { return next(new Error('Unknown authentication strategy "' + layer + '"')); }
    
      var strategy = Object.create(prototype);
      strategy.success = function(user, info) {
        if (callback) {
          return callback(null, user, info);
        }
        ....
         req.logIn(user, options, function(err) {
          if (err) { return next(err); }
          
          function complete() {
            if (options.successReturnToOrRedirect) {
              var url = options.successReturnToOrRedirect;
              if (req.session && req.session.returnTo) {
                url = req.session.returnTo;
                delete req.session.returnTo;
              }
              return res.redirect(url);
            }
            if (options.successRedirect) {
              return res.redirect(options.successRedirect);
            }
            next();
          }
          complete();
      }
       ....
     //调用oauth2.0认证函数
     strategy.authenticate(req, options);
  })(0);


```

+ 3. Oauth2.0 认证函数

```javascript

OAuth2Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var self = this;
  
  if (req.query && req.query.error) {
    if (req.query.error == 'access_denied') {
      return this.fail({ message: req.query.error_description });
    } else {
      return this.error(new AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri));
    }
  }
  
  var callbackURL = options.callbackURL || this._callbackURL;
  if (callbackURL) {
    var parsed = url.parse(callbackURL);
    if (!parsed.protocol) {
      // The callback URL is relative, resolve a fully qualified URL from the
      // URL of the originating request.
      callbackURL = url.resolve(utils.originalURL(req, { proxy: this._trustProxy }), callbackURL);
    }
  }
  
  if (req.query && req.query.code) {
   //根据授权码获取accessToken以及用户信息
    var code = req.query.code;

    var params = this.tokenParams(options);
    params.grant_type = 'authorization_code';
    params.redirect_uri = callbackURL;

    this._oauth2.getOAuthAccessToken(code, params,
      function(err, accessToken, refreshToken, params) {
        if (err) { return self.error(self._createOAuthError('Failed to obtain access token', err)); }
        
        self._loadUserProfile(accessToken, function(err, profile) {
          if (err) { return self.error(err); }
          
          function verified(err, user, info) {
            if (err) { return self.error(err); }
            if (!user) { return self.fail(info); }
            self.success(user, info);
          }
          
          try {
            //_verify 就是注入插件的时候指定的用户信息校验函数只有通过该函数校验，认证才算完成，用户信息被`success`挂在req.user。
            if (self._passReqToCallback) {
              var arity = self._verify.length;
              if (arity == 6) {
                self._verify(req, accessToken, refreshToken, params, profile, verified);
              } else { // arity == 5
                self._verify(req, accessToken, refreshToken, profile, verified);
              }
            } else {
              var arity = self._verify.length;
              if (arity == 5) {
                self._verify(accessToken, refreshToken, params, profile, verified);
              } else { // arity == 4
                self._verify(accessToken, refreshToken, profile, verified);
              }
            }
          } catch (ex) {
            return self.error(ex);
          }
        });
      }
    );
  } else {
   //获取授权码
    var params = this.authorizationParams(options);
    params.response_type = 'code';
    params.redirect_uri = callbackURL;
    var scope = options.scope || this._scope;
    if (scope) {
      if (Array.isArray(scope)) { scope = scope.join(this._scopeSeparator); }
      params.scope = scope;
    }

    var location = this._oauth2.getAuthorizeUrl(params);
    this.redirect(location);
  }
};

```

+ 4. 获取用户信息
```javascript

OAuth2Strategy.prototype._loadUserProfile = function(accessToken, done) {
  var self = this;
  
  function loadIt() {
    return self.userProfile(accessToken, done);
  }
  function skipIt() {
    return done(null);
  }
  //通过_skipUserProfile参数跳过不需要获取用户信息的认证。
  if (typeof this._skipUserProfile == 'function' && this._skipUserProfile.length > 1) {
    // async
    this._skipUserProfile(accessToken, function(err, skip) {
      if (err) { return done(err); }
      if (!skip) { return loadIt(); }
      return skipIt();
    });
  } else {
    var skip = (typeof this._skipUserProfile == 'function') ? this._skipUserProfile() : this._skipUserProfile;
    if (!skip) { return loadIt(); }
    return skipIt();
  }
};

//第三方插件需要重载该接口实现用户信息的获取，`passport`把该接口完全开放给开发者。
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  return done(null, {});
};

```

--- 

### 4. 实现自己的`strategy`实现

实现自己的第三方`passport-strategy`主要有三个步骤：

+ 1. 继承`passport-oauth2`
``` javascript
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://github.com/login/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://github.com/login/oauth/access_token';
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};

  if (!options.customHeaders['User-Agent']) {
    options.customHeaders['User-Agent'] = options.userAgent || 'passport-github';
  }

  OAuth2Strategy.call(this, options, verify);
  this.name = 'github';
  this._userProfileURL = options.userProfileURL || 'https://api.github.com/user';
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);
```

+ 2. 实现获取用户信息接口
``` javascript  
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json;
    
    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }
    
    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }
    
    var profile = Profile.parse(json);
    profile.provider  = 'github';
    profile._raw = body;
    profile._json = json;
    
    done(null, profile);
  });
}
```

+ 3. 解析用户信息函数实现
``` javascript
var parse = function(json) {
  if ('string' == typeof json) {
    json = JSON.parse(json);
  }
  
  var profile = {};
  profile.id = String(json.id);
  profile.displayName = json.name;
  profile.username = json.login;
  profile.profileUrl = json.html_url;
  if (json.email) {
    profile.emails = [{ value: json.email }];
  }
  
  return profile;
};
```

---

**只需要三步骤，轻松实现授权认证！，`passport`官网已经有非常多的第三方认证实现，为了避免重复造轮子，请先查找是否有你要的插件: [Search Strategy](http://passportjs.org/)**

