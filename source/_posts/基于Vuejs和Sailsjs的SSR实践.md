---
title: 基于Vuejs和Sailsjs的SSR实践
date: 2017-11-12 18:21:03
tags: 
  - vuejs
  - ssr
  - sailsjs
categories: web
---


Sails作为老牌Node.js框架,师从ROR,在Node.js社区也有一定的影响力。我们团队在微服务化之后选中其作为web开发基础框架。最近在做代码下发服务的时候需要一个后台管理页面，所以去了解了一下怎么利用sailsjs做服务器端渲染。


服务器端渲染依赖于`webpack`编译出的`server-bundle`文件。为了保证renderer的单例，所以在sailsjs启动的时候创建：

```javascript

module.exports.bootstrap = function (cb) {
  if (isTest) {
    return cb()
  }
  const bundle = require('../assets/vue-ssr-server-bundle.json')
  const clientManifest = require('../assets/vue-ssr-client-manifest.json')
  const renderer = createRenderer(bundle, {
    clientManifest
  })

  if (sails.config.setupDevServer) {
    console.log('setup-dev-server')
    require('../build/setup-dev-server')
  }

  global.renderer = renderer
  global.serialize = serialize
  global.createRenderer = createRenderer

  cb()
}

```

为了方便本地开发实现`hot reload`功能，所以判断是本地开发环境的时候启动一个服务器，检测bundle文件变化并自动编译更新renderer：

```javascript

//...

let bundle = fs.readFileSync(serverBundlePath, 'utf8')
let clientManifest = fs.readFileSync(clientManifestPath, 'utf8')

function update () {
  if (bundle && clientManifest) {
    console.log('renderer updated.')
    global.renderer = createRenderer(JSON.parse(bundle), { clientManifest: JSON.parse(clientManifest) })
  }
}

chokidar.watch(clientManifestPath).on('change', () => {
  clientManifest = fs.readFileSync(clientManifestPath, 'utf8')
  console.log('clientManifest updated.')
  update()
})

chokidar.watch(serverBundlePath).on('change', () => {
  bundle = fs.readFileSync(serverBundlePath, 'utf8')
  console.log('serverBundle updated.')
  update()
})

```

注意的是，这里只是监测bundle文件的变更，至于其他文件例如`.vue`文件或者前端`js`文件的更新没有能够监测，这可以利用`webpack`的watch功能来实现:

```javascript

  "scripts": {
    //...
    "dev": "rimraf assets && npm run dev:server && npm run dev:client",
    "dev:client": "cross-env NODE_ENV=development webpack --config ./build/webpack.client.config.js --progress --hide-modules --watch &",
    "dev:server": "cross-env NODE_ENV=development webpack --config ./build/webpack.server.config.js --progress --hide-modules --watch &"
  },

```

在基本配置写完之后，需要写一个视图渲染中间件，因为sailsjs本身是基于express来封装的，所以可以在中间件列表的末尾注入一个`serverRenderer`中间件，作用类似于[connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback)：

>config/http.js

```javascript

order: [
  //...
  'serverRenderer',
  '500'
],

```

>serverRenderer实现：

```javascript

function serverRenderer (req, res, next) {
  if (!global.renderer) {
    return res.end('waiting for compilation... refresh wait in a moment')
  }

  res.header('Content-Type', 'text/html')

  const s = Date.now()
  const context = {
    url: req.url,
    cookies: req.headers.cookie
  }
  sails.log.info('render context:', context)

  const renderStream = global.renderer.renderToStream(context)

  renderStream.on('data', chunk => {
    res.write(chunk)
  })

  renderStream.on('end', () => {
    sails.log.info(`whole request: ${Date.now() - s}ms`)
    res.end()
  })

  renderStream.on('error', err => {
    if (err && err.code === 404) {
      return res.status(404).end('404 | Page Not Found')
    }
    res.status(500).end('Internal Error 500')
    sails.log.error(`error during render : ${req.url}`)
    sails.log.error(err)
  })

  return
}

```

在请求进来的时候判断渲染器是否准备好。如果准备好了，则调用渲染器传入请求的url，匹配相应的控件做数据的预加载。在这里我们还把请求的cookies传递过去，这是因为服务器的一些api请求需要鉴权，这样在数据预加载的时候才能成功取到数据：

>axios 请求传入cookies

```javascript
//...
const request = axios.create({
  baseURL,
  timeout
})

const createAPI = (method, url, config = {}) => {
  return request({
    url,
    method,
    ...config
  })
}

request.interceptors.request.use(config => {
  if (!isClient) {
    config.headers.Cookie = serverCookies
  }
  return config
}, error => Promise.reject(error))

```

>api/polices/isLogined.js

```javascript

function isLogined (req, res, next) {
  if (!req.session.uid && req.url !== '/signin') {
    if (req.wantsJSON) {
      res.serverError(sails.Error(ERROR_CODES.ERR_NEED_LOGIN))
    } else {
      res.redirect(sails.config.app.redirectUrls.signin)
    }
  } else {
    next()
  }
}

```

对于服务器和客户端的数据预加载的基本写法可以参考`vuejs`的[官方文档](https://ssr.vuejs.org/zh/data.html)。

另外一点需要注意的是，我使用的`iview`框架，而它本身没有针对`ssr`适配所以在渲染的时候，或者数据预加载的时候最好加一个判断: 

```javascript
request.interceptors.response.use(res => {
  const body = res.data
  const messageDefault = res.config.messageDefault
  if (body.code !== 0) {
    if (isClient) {
      iView.Notice.error({
        title: 'Error',
        desc: messageDefault || body.message || '操作失败'
      })
    }
    return Promise.reject(res)
  }

  return res
}, ...

```

`isClient`变量依赖于`webpack`编译的时候注入的环境变量`process.env.VUE_ENV`。