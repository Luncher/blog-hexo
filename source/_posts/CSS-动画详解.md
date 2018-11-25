---
title: CSS-动画详解
date: 2016-09-30 10:16:04
tags: 
 - transition 
 - animation
categories: web
---


# `CSS`动画详解

`CSS animation`使用十分广泛，特此来做一个详细的总结。

---

## 通过`transiton`属性控制动画

基本语法：

`transition: width 2s 1s ease;` `width`属性受到动画影响，动画持续时间为`2s`，动画延迟`1s`播出，动画插值算法采用`ease`。多个属性可以用逗号分隔。例如：`transition: width 2s, height 1s;`。


`transiton`控制动画应该是最简单的方式之一了，和其他属性类似`transiton`也是一个复合属性由以下几个属性组成：

- transiton-delay: 动画延时播放，默认为0
- transiton-timing-function: 动画插值函数,默认为`ease`
- transiton-property: 指明要发生变化的属性
- transiton-duration: 指明动画周期(持续时间),默认为0

### 动画延时

  看一个`demo`,子元素宽度从0到填充父控件，延时`1s`。
{% jsfiddle fnao3q2t css,result light 100% 400px %}

鼠标进入和离开控件的时候都有`1s`延迟,这就是`transiton-delay`的效果。

### 动画速度变更函数(插值函数)

  `transiton-timing-function`属性用于改变动画的速度曲线。可选值有：

- ease：默认参数
- linear
- ease-in
- ease-out
- ease-in-out
- cubic-bezier

关于插值函数对应的效果可以[看这里](http://easings.net/zh-cn)。

说说`cubic-bezier`,由于`css`内值动画曲线比较有限，所以可以根据`cubic-bezier`规划一条贝赛尔曲线。
{% jsfiddle k3jtsn9v css,result light 100% 400px %}

推荐一个贝塞尔曲线在线编辑器：[`cubic-bezier`](http://cubic-bezier.com)。

### 动画属性

顾名思义，设置受到动画影响的属性。如果所有属性都受到影响，可以指定一个`all`参数。需要注意的是，`css`规定一些属性不受`transiton`影响，例如：`display`等。具体看`W3C`上[一个对应表](https://www.w3.org/TR/css3-transitions/#animatable-properties)。值得一提的是，`display`属性虽然不受影响，但是`visibility`属性会受影响。


### 动画持续时间

设置动画延迟播放时间，*注意默认为0*，除了以`s`为单位，也可以以`ms`为单位。


>`transition`属性虽然使用方便，但是也有它的局限性:

- 动画需要事件触发，无法自动播放
- 无法重复播放，除非一直触发
- 无法为多个属性指定同样的变化规则(写起来比较麻烦)
- 只能控制开始和结束状态、无法定义中间态

---


## 通过`animation`属性控制动画

和`transition`类似，`animation`也是一个复合属性。它提供了比较多的属性来控制动画，从而实现更加细致的控制。

基本格式：

`@keyframes`关键字用于定义动画的细节，比例动画名称，动画在某一时刻的状态属性值等。

```css
@keyframes anim {
  from: {background: red;}
  to: {background: blue;}
}
```

上面一段`css`定义了一个动画，名称为`anim`,动画从背景红色过渡到背景蓝色，`from`表示起始时刻动画状态，`to`表示结束时刻动画状态。还可以换成百分比的形式从`0%`到`100%`。
从而实现了在不同时刻控制动画状态的目的。

{% jsfiddle Lhpfxbrm css,result light 100% 400px %}

---

基本属性：

- animation-duration
- animation-direction
- animation-delay
- animation-name
- animation-iteration-count
- animation-timing-function
- animation-play-state
- animation-fill-mode

### 动画时长

`animation-duration`和`transition-duration`类似，不做过多介绍，用于控制动画的时间长度。

### 动画播放延时

`animation-delay`和`transition-delay`类似控制动画首次播放的延时。

### 动画名称

`animation-name`指定元素引用哪个动画，名称通过`@keyframes`指定。

### 动画方向

`animation-direction`控制动画循环播放的时候状态的变更次序。看个`demo`:

{% jsfiddle Lhpfxbrm css,result light 100% 400px %}

可选的属性：

- normal: 每次都从起始状态变更到终止状态
- reverse: 每次都从终止状态变更到起始状态
- alternate: 奇数次从起始状态变更到结束状态、偶数次从结束状态变更到起始状态
- alternate-reverse: 与`alternate`相反

### 动画结束的状态

`animation-fill-mode`属性控制动画结束播放时候的状态，看个`demo`：

{% jsfiddle geLw2de5 css,result light 100% 400px %}

- forwards: 让动画停留在最后一帧
- backwards: 让动画停留在第一帧
- both: 根据`animation-direction`控制使用`forwards`或者`backwards`。

### 动画播放次数

`animation-iteration-count`属性控制动画播放次数，默认为`1次`, 设置`infinite`表示无限循环播放。


### 动画插值函数

`animation-timing-function`控制动画插值函数，和`transition-timing-function`类似。

### 控制动画状态

`animation-play-state`属性用于控制动画播放的状态，默认情况，自动开始播放，通过设置该属性，可以控制动画播放。

看一个`demo`

{% jsfiddle 2Law411w css,result light 100% 400px %}

只有鼠标移动到方块上的时候动画才会继续播放。

---

参考文献：

- [CSS动画简介](http://www.ruanyifeng.com/blog/2014/02/css_transition_and_animation.html)
- [W3C css animation](https://www.w3.org/TR/css3-animations/)