---
title: Sailsjs参数校验
date: 2017-12-02 21:06:37
categories: server
tags: 
  - sailsjs 
---

参数校验模块是所有`web server`必不可少的一环，而实现的思路无外乎：

* 针对不同的`action`定义一个`schema`
* 编写一个中间件根据`schema`校验对应的`action`请求参数是否合法

之前针对`swagger`配合`koa2`编写过一套。因为通过`swagger`编写`API`规范的时候可以很容易的指定数据类型、数据长度、是否必传等信息。现在使用`sailsjs`框架实现思路也是类似，不过这次使用的不是`swagger`：

首先利用`hapijs`团队开源的[joi](https://github.com/hapijs/joi)模块，编写action schema:

<!-- more -->

```javascript
const Joi = require('joi')

module.exports = {
  putLogs: Joi.object().keys({
    topic: Joi.string().required(),
    source: Joi.string().optional().allow(''),
    payload: Joi.array().items(Joi.object().keys({
      time: Joi.string().required(),
      level: Joi.string().required(),
      message: Joi.string().required()
    }))
  })
}

```

这是一个上传日志的action, 有两个参数是必传，一个参数是可选且允许传空。`payload`的三个字段也是必传。

为了对现有的代码保持最小的侵入性，我希望在无需改变现有代码的前提下使用这个参数校验模块。sailsjs的hook机制是一个不错的选择：

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
    if (schemas[id] && schemas[id][key]) {
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

sailsjs允许用户自定义hook,并且在启动应用启动之前初始化它。所以我在hook启动初始化的时候对所有的action做一层包装，这样就做到了用户层代码无感知。

在校验错误的时候对客户端抛出一个参数错误字段。这里有一点需要注意的是，看到校验函数：

```javascript

const { error } = Joi.validate(params, schema, { allowUnknown: true })

```

这里传了一个`allowUnknown`选项，该选项允许客户端传递schema以外的字段，这样也是为了向后兼容，因为一些客户端会默认传递一些额外的字段信息。