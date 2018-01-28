---
title: 你不知道的box-shadow
date: 2016-09-03 16:34:18
tags: box-shadow
categories: web
---

# box-shadow

`box-shadow`是`CSS3`提出的一个重要属性用于给元素附加一层阴影。基本格式书写：

>box-shadow: h-offset v-offset blur-radius spread

- h-offset: 阴影距离元素水平方向的偏移,允许为负数
- v-offset: 阴影距离元素垂直方向的偏移,允许为负数
- blur-radius: 模糊半径
- spared: 延展半径,允许为负数

---

## 基本使用

{% jsfiddle nkr9vmzL css,result light 100% 400px %}

>在`div`元素周围生成了黑色的阴影，这里我们只用到了三个参数，水平和垂直方向的偏移以及模糊半径。在这个例子中，四个方向的阴影长度大致为`5px`。

### 加上偏移量

{% jsfiddle yzbzvm15 css,result light 100% 400px %}

>水平偏移`2px`垂直偏移`3px`，模糊半径`10px`，这个时候元素在四周依然有阴影存在，我们如何计算阴影的长度呢？答案在于：

- 在顶部看到`7px`的投影(10px - 3px)
- 在底部看到`13px`的投影(10px + 3px)
- 在左边看到`8px`的投影(10px - 2px)
- 在右边看到`12px`的投影(10px + 2px)

---

## 单个方向的投影

知道了阴影半径的计算，那么如何设计一个单个方向的投影呢？这个时候就需要`spared`属性，`spared`属性用于扩大或者缩小投影的尺寸。
{% jsfiddle uowdjmfe css,result light 100% 400px %}

利用`spread`，可以把需要隐藏的投影缩小，实现呢单边投影的效果。

---

## 邻边投影

把上面的例子稍微修改一下得到右边和下边都为`5px`的投影。

{% jsfiddle 880t7xs3 css,result light 100% 400px %}

---

## 对边投影

`box-shadow`属性允许指定多个阴影，越往后`z-order`越小。我们利用单边投影的方式轻松实现对边投影的效果。
{% jsfiddle 2e3rqnL7 css,result light 100% 400px %}

---

## 总结

投影实现步骤：

- 在元素的上面，以元素原大小和指定颜色绘制一个矩形
- 根据`h-offset`、`v-offset`偏移矩形
- 根据`blur-radius`对元素模糊处理,在元素两边模糊的大小近似于模糊半径的两倍
- 根据`spread`裁剪投影
- 把投影和元素叠加的部分切除掉，完成了投影的过程