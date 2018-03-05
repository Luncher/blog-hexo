---
title: SVG学习笔记
date: 2016-12-01 13:38:13
tags: SVG
categories: web
---

## SVG是什么

>SVG意为可缩放的矢量图形，采用`XML`语言格式来标记图像信息。最新版本为`1.1`。

---

## SVG基本作用

> 用于绘制图形以及文字，支持旋转、滤镜、裁剪、渐变等效果。

---

## 基本属性及语法

- `html`文档嵌入`svg`
  - 对于新的`html5`标准可以直接在`html`文档内嵌入
  - 使用其他元素嵌入：`<object data="image.svg" type="image/svg+xml" />`

- 语法规范
  - SVG元素属性区分大小写(和`html`不同)
  - SVG元素属性值必须用双引号引起来

---

## 基本使用

### 坐标系统

  类似于`canvas`，可以通过`viewBox`定义`用户坐标系统`, 达到缩放的结果。例如：

  ``` html
  <svg width="200" height="200" viewBox="0 0 100 100">
  ```
  这里定义了视口(`viewport`)大小为: `200*200`, `viewBox`属性定义了画布上可以显示区域，这个区域会放大到画布`200*200`上显示。这里可以类比`canvas`里面类似的概念，`canvas`里面通过`style`属性定义的宽高为显示区域，用户坐标系统，直接给`canvas`元素设置的宽高为视口大小。既然有缩放，就得控制缩放比例，以及对齐方式。
  `preserveAspectRatio`属性用于定义`viewBox`相对于`viewport`对齐方式以及缩放属性：
  >preserveAspectRatio="xMidYMid meet",意味着把`viewBox`的中心相对于`viewport`中心对齐，同时保持纵横比缩放`viewBox`适应`viewport`。其实这也就是默认值。
  
  preserveAspectRatio前半部分参数：
  - xMin|xMid|xMax
  - YMin|YMid|YMax

  preserveAspectRatio后半部分对齐方式：
  - meet:保持`viewBox`的纵横比，让`viewBox`在`viewport`内完全显示。
  - slice:保持`viewBox`的纵横比，用`viewBox`最大化填充`viewport`。
  - none: 水平和垂直都拉申填充`viewport`。

  [SVG-Demo](git@github.com:Luncher/svg-demo.git),下载后可以直接编辑并用`SVG`查看器打开查看。

### 绘制图形
  
  `SVG`包含[内值基本元素](https://developer.mozilla.org/en-US/docs/Web/SVG/Element),可以直接绘制基本图形例如：`rect`、`circle`等。还可以以类似于`canvas`路径的形式绘制图像：强大的路径支持绘制任意的元素。

### 着色

  着色类似于`canvas`分为填充与描边。通过设置`fill`于`stroke`属性控制颜色，`fill-opacity`和`stroke-opacity`控制透明度,以及一些其他属性控制描边的风格。

---

## 参考

[MDN-SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)
[MDN-SVG Tutorial](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Tutorial)
[理解SVG的viewport,viewBox](http://www.zhangxinxu.com/wordpress/2014/08/svg-viewport-viewbox-preserveaspectratio/)