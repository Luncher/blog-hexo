---
title: Sailsjs项目模板
date: 2017-12-10 20:30:39
categories: server
tags: 
  - sailsjs 
---

在微服务体系下, 随着新需求的不断迭代，需要不停分解(新建)一些服务，这个时候会有很多重复的工作。譬如说搭建项目基础框架，设置开发、生产环境的配置。经过一段时间对sailsjs的折腾之后，下定决心总结一个属于自己的项目模板，方便下次直接使用。

项目模板主要包含以下几个模块：

### 基础结构


#### 1. 创建项目

因为是一个纯后端项目，所以创建项目的时候指定基本选项：

> sails new project-name --no-linker --no-frontend


#### 2. 配置`response`

设置`response`:

`api/responses`目录下有多个`response`文件，配置好相应的返回选项，譬如`serverError.js`:

```javascript

module.exports = function serverError (data, options) {
  const res = this.res
  const req = this.req

  sails.log.error(`${req.method} ${req.url} Result: ${util.inspect(data)}`);

  if (data instanceof VError) {
    const info = VError.info(data)
    const cause = VError.cause(data)
    const message = info.message + ':' + (cause ? cause.message : "" )
    res.status(info.status)
    res.json({ code: info.code, message, data: info.data || {} })
  } else if (data instanceof Error) {
    res.status(500)
    res.json({ code: -1, message: data.message, data: {} })
  } else {
    res.status(data.status || 500)
    res.json({ code: -1, message: data.message, data: {} })
  }

  return
}

```

#### 3. 设置`rest`风格的接口

`config/blueprint.js`用于配置服务器支持的接口类型,关闭一些默认配置，只打开一些必要选项:

```javascript
  {
    actions: false,
    rest: true,
    shortcuts: false,
    restPrefix: '/api',
    pluralize: true,
  }

```

### 设置必要的`hooks`

#### 1. 捕获错误`hook`

*api/hooks/asyncWrapper.js*

```javascript

const _ = require('lodash')

module.exports = (sails) => {
  return {
    initialize: (callback) => {
      _.each(sails.controllers, (controller, controllerId) => {
        _.each(controller, (_, actionId) => {
          actionId = actionId.toLowerCase()
          const action = sails.hooks.controllers.middleware[controllerId][actionId]
          sails.hooks.controllers.middleware[controllerId][actionId] = handleAction(action)
        })
      })

      callback()
    }
  }

  function handleAction (action) {
    return (req, res) => {
      try {
        Promise.resolve(action(req, res))
          .then(result => {
            return handleResult(result, req, res)
          })
          .catch(err => {
            return handleError(err, req, res)
          })
      } catch (err) {
        return handleError(err, req, res)
      }
    }
  }

  function handleResult (result, req, res) {
    if (res.headersSent || res.isHandled) return
    return res.ok(result)
  }

  function handleError (error, req, res) {
    if (res.headersSent || res.isHandled) return
    return res.negotiate(error)
  }
}

```

#### 2. 参数校验`hook`

*api/hooks/validator.js*
```javascript

const Joi = require('joi')
const schemas = require('../schemas')

module.exports = (sails) => ({
  initialize: callback => {
    Object.keys(sails.controllers).forEach(key => {
      wrapAction(sails.controllers[key])
    })
    callback()
  }
})

function wrapAction (controller) {
  const id = controller.identity
  Object.keys(controller).forEach(key => {
    if (schemas && schemas[id] && schemas[id][key]) {
      const action = sails.hooks.controllers.middleware[id][key.toLowerCase()]
      sails.hooks.controllers.middleware[id][key.toLowerCase()] =
        validateAction(action, schemas[id][key])
    }
  })
}

function validateAction (action, schema) {
  return (req, res) => {
    const params = req.allParams()
    const { error } = Joi.validate(params, schema, { allowUnknown: true })
    if (error != null) {
      return res.negotiate(sails.Error(ERROR_CODES.ERR_INVALID_PARAMS, error))
    }
    return action(req, res)
  }
}

```

### 错误处理

#### 1. 设置错误码

再项目启动的时候设置错误代码：

```javascript

module.exports.bootstrap = function(cb) {
  global.VError = require('verror')
  global.ERROR_CODES = sails.config.app.ERROR_CODES
  global.ERROR_PAYLOADS = sails.config.app.ERROR_PAYLOADS
  sails.Error = UtilService.createError
  cb()
}

```

#### 2. 创建自定义错误

UtilService.createError提供一个函数创建自定义错误:

```javascript

  createError: function (code, cause) {
    const payload = ERROR_PAYLOADS[code]
    const name = payload.name
    const info = payload
    info.code = code
    return new VError({ name, info, cause })
  }

```

#### 3. 错误冒泡

项目启动的时候引入了`VError`, 项目代码在抛出错误的时候传递上一次错误的原因，在`response`函数内返回内嵌错误：

```javascript

if (data instanceof VError) {
  const info = VError.info(data)
  const cause = VError.cause(data)
  const message = info.message + ':' + (cause ? cause.message : "" )
  res.status(info.status)
  res.json({ code: info.code, message, data: info.data || {} })
}

```

### 测试

目录结构：

*sails-boilerplate/test*

```shell

├── bootstrap.test.js
├── fixtures
│   └── article.js
├── integration
│   ├── controllers
│   └── services
└── mocha.opts

```

`mocha.opts`放置mocha测试框架基本配置：

```javascript

--timeout 10s
--exit
--bail

```

`bootstrap.test.js`是sails启动测试的入口：

```javascript

before(function(done) {
  sails.lift({
    // configuration for testing purposes
  }, function(err) {
    if (err) return done(err);
    // here you can load fixtures, etc.
    setupFixtures(function (err) {
      done(err, sails);      
    })
  });

  after(function(done) {
    // here you can clear fixtures, etc.
    teardownFixtures(function (err) {
      sails.lower(done);      
    })
  });
})

```

> `setupFixtures`设置一些项目测试过程会使用的数据，`teardownFixtures`清除这些设置的数据。

`integration`文件夹方式一些测试用例。`fixtures`文件夹方式设置一些创建各种测试数据的代码文件。

项目地址：[sails-boilerplate](https://github.com/Luncher/sails-boilerplate)。