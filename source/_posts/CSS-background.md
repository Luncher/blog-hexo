---
title: CSS-background
date: 2016-08-25 10:44:09
tags: css background
categories: web
---

# CSS`background`属性总结

## 基本属性

- background-color
- background-image
- background-size
- background-position
- background-origin
- background-attachment
- background-clip

<!-- more -->

---

## `background-color`

顾名思义`background-color`用于设置元素的背景颜色,这应该是最好理解的属性之一了。但是有几点需要注意：

>- 1、背景颜色涵盖了边框、padding、以及`content`区域(通过-background-clip属性控制,后面会看到) 
>- 2、背景颜色、边框、背景图片的层次从下到上顺序为：背景颜色=》背景图片=》边框，所以如果把边框样式设置伪`dashed`可以看到透过的背景颜色与图片.

---

## `background-image`

`image`属性用于指定元素背景图片，除了图片还可以用`radial-gradient`或者`linear-gradient`函数创建一个渐变的图像对象。还可以给一个元素设置多个图像，后设置的图像在上面一层。

---

## `background-position`

`position`属性用于控制背景图片的位置，有三种类型的值可以设置：

>- 1、直接设置关键字,水平方向：`left`、`center`、`right`,垂直方向：`top`、`center`、`bottom`.可以把背景图片看成相对于背景区域绝对定位，这样就比较好理解了。
>- 2、使用像素值控制位置, 使用像素值的时候可以想像把背景图片相对定位，即：默认状态图片的位置为背景区域的左上角，这个时候修改背景图片的位置实际上是相对于背景区域的左上角做偏移。
>- 3、使用百分比定位，这个属性不太好理解，简单说来一句话：`把背景图片百分比的位置放置到背景区域对应百分比的位置`.百分比定位的一个好处就在于，背景图片根据背景区域的放大而适配。

注意：
>如果只设置了一个值，另外一个值将会是`50%`。不管是何种方式都是如此。

---

## `background-origin`

`origin`属性指定了背景图片属性的原点相对位置，默认值：`padding-box`,可选值有：

- `content-box`,元素内容区域
- `border-box`,元素边框以内区域
- `padding-box`,元素内边距以内区域

注意：
>如果`background-attachment`设置为`fixed`则忽略该属性。

---

## `background-attachment`

`attachment`属性决定背景图片滚动或者固定。可选属性：

- `fixed`,固定，相对视口做定位，类似于position属性的`fixed`。
- `scroll`,**相对元素自身的位置固定**，不根据元素内容滚动。
- `local`,**相对元素内容的位置固定**，根据元素内容滚动。

在线demo:[scroll local fixed](http://jsfiddle.net/n88cZ/1/)

---

## `background-size`

`size`控制背景图片的显示区域大小，可以指定具体的宽高、也可以设置关键字、

### `background-size`关键字

- auto
  默认值，背景图片大小等与图片本身的大小。

- contain
  包含，背景区域确保能放下整个图片，这样有可能造成背景图片没有涵盖整个背景区域的效果，但是图片能得到完整显示。

- cover
  覆盖，用背景图片覆盖背景区域，这样会造成背景图片显示不全的情况，但是整个背景区域能被背景图片覆盖。

### `background-size`指定大小

- 指定一个值
  这个时候另外一个属性会按照元素宽高比例缩放

- 指定两个值
  这个时候背景图片会被缩放到指定大小。

---

## `background-clip`


`clip`属性用于控制，**背景图片和颜色**延伸的区域，可选属性：

- border-box
  默认值，允许背景图片和颜色延伸到边框

- padding-box
  允许背景图片和颜色延伸到内边距

- content-box
  允许背景图片和颜色延伸到内容区

- inherit
  继承
