---
title: position
date: 2016-08-02 23:04:37
tags: position layout
categories: web
---

提到`web`控件的布局(`layout`)，`position`的概念必须理清楚。简单对`position`属性的基本概念做一个总结吧！
以下文档参考了：[CSS-tricks](https://css-tricks.com/almanac/properties/p/position/)、[W3School](http://www.w3schools.com/css/css_positioning.asp)。

---

# `position`基本属性：

- static
- relative
- absolute
- fixed
- inherits

## static

所有web element默认的`position`属性都为`static`。在`static`模式下，元素的`left`、`top`、`right`、`bottom`、`z-index`。**属性都不起作用**。
也就是说，默认情况下，所有元素的这些属性都不能用！


## relative

`relative`顾名思义表示相对定位，相对元素在正常流中的位置做偏移。注意：**`relative`定位的元素参考的是该元素正常流氏布局的位置**。


## absolute

`absolute`又名绝对定位，该属性的元素在计算位置的时候参考的是最近的非`static`属性的祖先元素。如果不存在相应元素，则参考`body`定位。
注意：`absolute`定位的元素会随着屏幕滚动。


## fixed

`fixed`意为固定，参考浏览器视口来定位(`viewport`)。不随屏幕滚动,所以在调出调式工具的时候依然可见。


## inherits

`position`属性非继承。所以可以显示的把父元素的属性强制继承过来。



## 再所说`z-index`

`z-index`表示元素元素所在的层级，默认为`0`，数字越大越贴近用户，当然也可以为负数。