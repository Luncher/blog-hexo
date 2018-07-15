---
title: Vue数据绑定(一)
categories: Vue源码分析系列文章
date: 2018-07-09 19:30:03
---

Vue作为当下炙手可热的前端三大框架之一，一直都想深入研究一下其内部的实现原理，去学习`MVVM`模式的精髓。如果说`MVVM`是当下最流行的图形用户界面开发模式，那么数据绑定则是这一模式的根基。这也是我为什么要从数据绑定开始了解Vue的原因。

本篇文章首先从Vue构建开始，后面主要了解`methods`、`data`的执行过程以及原理，结合Vue文档来分析，做到知其然且知其所以然。对于计算属性、组件系统、指令等将在后续文章中分析。

>源代码基于vue1.0，最新版本为2.x，其中的差异我会在文章尽量列出来。

### Vue构造过程

```javascript

function Vue (options) {
  this._init(options)
}

```

Vue构造函数调用了一个`_init`函数，Vue所有的内置属性和方法都以_或者$开头：

```javascript
//util/lang.js
exports.isReserved = function (str) {
  var c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

```

`_init`函数调用了若干个初始化函数其中就包含了一个初始化状态属性相关的函数：

```javascript
//instance/state.js
exports._initState = function () {
  this._initProps()
  this._initMeta()
  this._initMethods()
  this._initData()
  this._initComputed()
}
```

看到调用函数的名称都知道是什么意思，这里主要研究一下`_initMethods`和`_initData`两个函数的实现原理。其余的会在后续文章分析。

`_initMethods`:

```javascript
exports._initMethods = function () {
  var methods = this.$options.methods
  if (methods) {
    for (var key in methods) {
      this[key] = _.bind(methods[key], this)
    }
  }
}
```

对于`methods`的初始化相对比较简单，这个函数的主要作用就是把用户定义在methods属性内的一些方法绑定到当前的Vue实例中。由于ES6的箭头函数会导致`bind`失败，这也是为什么Vue在文档中提示：
>不要在选项属性或回调上使用箭头函数，比如 created: () => console.log(this.a) 或 vm.$watch('a', newValue => this.myMethod())。因为箭头函数是和父级上下文绑定在一起的，this 不会是如你所预期的 Vue 实例，经常导致 Uncaught TypeError: Cannot read property of undefined 或 Uncaught TypeError: this.myMethod is not a function 之类的错误。

`_initData`:
```javascript
exports._initData = function () {
  var propsData = this._data
  var optionsDataFn = this.$options.data
  var optionsData = optionsDataFn && optionsDataFn()
  if (optionsData) {
    this._data = optionsData
    for (var prop in propsData) {
      if (process.env.NODE_ENV !== 'production' &&
          optionsData.hasOwnProperty(prop)) {
        _.warn(
          'Data field "' + prop + '" is already defined ' +
          'as a prop. Use prop default value instead.'
        )
      }
      if (this._props[prop].raw !== null ||
          !optionsData.hasOwnProperty(prop)) {
        _.set(optionsData, prop, propsData[prop])
      }
    }
  }
  //...
}
```

对于子组件而言，`propsData`表示父组件传递过来的数据，因为initProp先执行`_data`填充的是父组件传递过来的数据。`optionsDataFn`表示组件自身的数据。 为什么这里看到的是一个函数呢？这是因为在Vue的初始化函数`_init`内调用了`util/option.js`下的`mergeOptions`这个方法，为了方便合并父组件和子组件的数据，它定义了一系列策略把组件传入的参数替换了。为了避免父组件的数据被子组件原生的数据覆盖需要做一次判定，发现有数据覆盖就警告用户。需要注意的是属性值为null且子组件原生就有的数据字段是不会被覆盖的。


在把数据合并之后，接下来要对组件数据做一个代理： 

```javascript
//...
var data = this._data
// proxy data on instance
var keys = Object.keys(data)
var i, key
i = keys.length
while (i--) {
  key = keys[i]
  this._proxy(key)
}
//...
```

数据代理的作用就是为了实现：`vm.prop === vm._data.prop`的效果。代码位置在`instance/state.js`下的`_proxy`函数:

```javascript
exports._proxy = function (key) {
  if (!_.isReserved(key)) {
    // need to store ref to self here
    // because these getter/setters might
    // be called by child scopes via
    // prototype inheritance.
    var self = this
    Object.defineProperty(self, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter () {
        return self._data[key]
      },
      set: function proxySetter (val) {
        self._data[key] = val
      }
    })
  }
}
```

为了避免覆盖Vue内置的属性所以做一次判定，接下来就是对数据的访问做一个代理。

仅仅代理数据是不够的，接下来要看到的是监控数据的变化：

```javascript
exports._initData = function () {
  //...
  // observe data
  Observer.create(data, this)
}
```

`Observer.create`是Vue响应式数据绑定的核心:

```javascript

Observer.create = function (value, vm) {
  if (!value || typeof value !== 'object') {
    return
  }
  var ob
  if (
    value.hasOwnProperty('__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    ob = value.__ob__
  } else if (
    (_.isArray(value) || _.isPlainObject(value)) &&
    !Object.isFrozen(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (ob && vm) {
    ob.addVm(vm)
  }
  return ob
}

```

数据监听只针对对象类型，监听对象会内嵌到被监听的对象，这样可以避免重复监听数据对象：

```javascript
function Observer (value) {
//...
  _.define(value, '__ob__', this)
//...
}
```

需要注意的是,Vue对象实例不会被监听，通过`_isVue`属性来辨别。对于被冻结的对象也是不能监听的,Vue通过接口`Object.isFrozen`来判定，官方文档也有说明：

>这里唯一的例外是使用 Object.freeze()，这会阻止修改现有的属性，也意味着响应系统无法再追踪变化。

Observer对象会反向引用Vue实例对象，这是为了在用户调用`$delete`的时候能够反向通知到Vue实例对象, 把挂在实例上的被删除属性去除：

```javascript
exports.delete = function (obj, key) {
  if (!obj.hasOwnProperty(key)) {
    return
  }
  delete obj[key]
  var ob = obj.__ob__
  if (!ob) {
    return
  }
  ob.notify()
  if (ob.vms) {
    var i = ob.vms.length
    while (i--) {
      var vm = ob.vms[i]
      vm._unproxy(key)
      vm._digest()
    }
  }
}
```

数据的变化追踪分为两类：对象和数组类型。对象类型遍历属性监听每个属性的变化：

```javascript
Observer.prototype.walk = function (obj) {
  var keys = Object.keys(obj)
  var i = keys.length
  while (i--) {
    this.convert(keys[i], obj[keys[i]])
  }
}
```

`convert`函数调用了数据追踪最关键的一个函数：
```javascript
function defineReactive (obj, key, val) {
  var dep = new Dep()
  var childOb = Observer.create(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function metaGetter () {
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
      }
      return val
    },
    set: function metaSetter (newVal) {
      if (newVal === val) return
      val = newVal
      childOb = Observer.create(newVal)
      dep.notify()
    }
  })
}
```
由于对象的属性可能还是一个对象或者数组。所以需要递归的追踪内嵌数据的变化。数据的监听者存放在`Dep`模块内。每次设置新的对象需要重新监听数据属性。

---


数组类型的数据监听追踪比较特殊，Vue通过拦截几个数组方法来追踪数组的变化

```javascript
function Observer (value) {
  //...
  if (_.isArray(value)) {
    var augment = _.hasProto
      ? protoAugment
      : copyAugment
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
  } else {
    this.walk(value)
  }
}
```

arrayMethods是一个以`Array.prototype`为原型的对象：//`observer/array.js`
```javascript
var arrayProto = Array.prototype
var arrayMethods = Object.create(arrayProto)
```

通过`_.hasProto`方法判定代理数组对象的若干个方法：
```javascript
function protoAugment (target, src) {
  target.__proto__ = src
}
```

至此Vue的数据追踪流程执行完毕。Vue提供了两个全局方法`Vue.set`和`Vue.delete`。下面来研究一下两个函数的实现，`Vue.set`最终会调用到`util/lang.js`下的`set`方法：

```javascript
exports.set = function set (obj, key, val) {
  if (obj.hasOwnProperty(key)) {
    obj[key] = val
    return
  }
  if (obj._isVue) {
    set(obj._data, key, val)
    return
  }
  var ob = obj.__ob__
  if (!ob) {
    obj[key] = val
    return
  }
  ob.convert(key, val)
  ob.notify()
  if (ob.vms) {
    var i = ob.vms.length
    while (i--) {
      var vm = ob.vms[i]
      vm._proxy(key)
      vm._digest()
    }
  }
}
```

如果设置的属性之前已经有了，这个时候直接设置就行，会促发相应的更新逻辑。如果是Vue对象则设置到`_data`属性内。如果数据对象不是响应式的则直接新增数据属性。这个时候不会触发视图更新等操作。反之通知相应的监听方，并且递归追踪新增的数据值。Vue官方文档有如下提示：
>向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。它必须用于向响应式对象上添加新属性，因为 Vue 无法探测普通的新增属性。

`Vue.delete`最终调用`util/lang.js`下的`delete`方法。

```javascript
exports.delete = function (obj, key) {
  if (!obj.hasOwnProperty(key)) {
    return
  }
  delete obj[key]
  var ob = obj.__ob__
  if (!ob) {
    return
  }
  ob.notify()
  if (ob.vms) {
    var i = ob.vms.length
    while (i--) {
      var vm = ob.vms[i]
      vm._unproxy(key)
      vm._digest()
    }
  }
}
```

被删除的属性如果不是响应式的，则直接删除然后退出函数。反之，通知各个监听对象，并且通过`_unproxy`方法把挂在`Vue`实例上的属性删除。