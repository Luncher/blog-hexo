---
title: Quill编辑器添加自定义插件
categories: web
date: 2018-06-02 14:03:30
tags:
  - Quill
  - 富文本编辑器
---

在前端领域，富文本编辑器一直是一个比较复杂的模块。技术选型的时候，如果没有擦亮眼睛看清楚，一不小心就掉入的坑中。之前用过[summernote](https://github.com/summernote/summernote)最后因为业务需求逐渐复杂，一些关键特性没法支持，自己拓展起来非常痛苦。这次新项目开发的时候仔细调研了下当下比较好的web富文本编辑器主要有：[Quill](https://github.com/quilljs)，以及国内百度前端团队推出的[ueditor](https://github.com/fex-team/ueditor)。经过一番对比之后，选择了`Quill`作为最终方案。

`Quill`实现了一套类似的DOM Tree。通过[parchment](https://github.com/quilljs/parchment)来实现。一颗`parchment` Tree包含了多个`Blot`，可以类比为DOM节点的概念。`parchment`提供了三种类型的`Blot`: `Inline Blot`、 `Block Blot`、`Embed Blot`。前两种分别对应`html`的行内元素、块元素，第三种类型是一个封装类型，`Quill`内置类型如：`Video`通过继承这个类型来实现。

`Quill`默认没有提供`audio`类型的实现。所以通过扩展`Embed Blot`来实现一个。

**导入模块**
```javascript

import { Quill } from 'vue-quill-editor'

const BlockEmbed = Quill.import('blots/block/embed')
const Link = Quill.import('formats/link')

```
> `Quill`内置的模块只能通过`Quill.import`函数导入。


**创建对象**
```javascript

export default class Audio extends BlockEmbed {
  static create (value) {
    let node = super.create(value)
    node.setAttribute('controls', 'controls')
    node.setAttribute('src', this.sanitize(value))
    return node
  }

  static sanitize (url) {
    return Link.sanitize(url)
  }
  ...
```
> `create`由`Quill`负责调用`value`表示创建的对象的参数。这里`audio`只需要一个音频文件`url`参数。默认给音频文件添加控制按钮，如果有其他属性需要设置的可以在这里添加。


**获取节点值**

```javascript
  static value (domNode) {
    return domNode.getAttribute('src')
  }
```

**节点属性变更**

```javascript
const ATTRIBUTES = [
  'height',
  'width'
]
//...
  //获取属性列表
  static formats (domNode) {
    return ATTRIBUTES.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute)
      }
      return formats
    }, {})
  }
//...
  //设置属性
  format (name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value)
      } else {
        this.domNode.removeAttribute(name)
      }
    } else {
      super.format(name, value)
    }
  }

```

**标示节点并注册**

```javascript

Audio.blotName = 'audio'
Audio.tagName = 'audio'

Quill.register(Audio)

```
>`blotName`必须唯一，`tagName`指定该`Blot`对应的DOM节点类型。如果该节点已经被其他`Blot`使用了，则比较添加一个`className`加以区分。

**自定义Blot使用**

```html

  <span class="ql-formats">
    <qiniu-uploader @input="getQiniuUrl" iconType="audio"></qiniu-uploader>
  </span>

  <!-- qiniu-uploader 组件实现-->
  <template>
    <!-- ... -->
      <div>
        <svg viewbox="0 0 18 18" v-if="iconType === 'audio'">
        <ellipse class="ql-fill" cx="10.5" cy="14" rx="2.5" ry="2"/>
        <path class="ql-stroke" d="M12,14V3c0,1.5,3,2.021,3,5"/>
        <path class="ql-fill" d="M7,4A5,5,0,0,0,7,14a3.191,3.191,0,0,1,3-2.957V5.023A4.955,4.955,0,0,0,7,4ZM4.06,8.412a0.5,0.5,0,0,1-.49.4,0.485,0.485,0,0,1-.1-0.01,0.5,0.5,0,0,1-.393-0.588A3.98,3.98,0,0,1,6.216,5.079a0.5,0.5,0,0,1,.2.98A2.985,2.985,0,0,0,4.06,8.412ZM7,10A1,1,0,1,1,8,9,1,1,0,0,1,7,10Z"/>
      </svg>
    </div>
    <!-- ... -->
```

>因为使用的是`Vue`框架，在toolbar注入控制按钮，当然也可以通过formats选项，在创建`quill`的时候指定需要在工具栏出现哪些控制按钮。组件内提供一个`iconType`控制上传文件类型。这里使用`svg`方式绘制图标，这个图标可以通过[Quill](https://github.com/quilljs/quill/tree/develop/assets/icons)官方找到。

**注入节点**

```javascript

getQiniuUrl ({ url, type }) {
  this.editor.focus()
  this.editor.insertEmbed(this.editor.getSelection().index, type, url)
}

```
>this.editor 表示`quill`实例对象，`type`这里传的是`audio`，和`blotName`一一对应。这段代码的含义表示：在当前编辑器光标位置插入一个音频文件节点。

参考文档:  
https://quilljs.com/guides/cloning-medium-with-parchment/  
https://dev.to/charrondev/getting-to-know-quilljs---part-1-parchment-blots-and-lifecycle--3e76