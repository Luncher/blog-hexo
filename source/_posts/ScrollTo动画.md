---
title: ScrollTo动画
date: 2016-08-26 10:05:18
tags: css scrollTo
categories: web
---


# 简单的ScrollTo动画实现

在页面导航栏目设置几个标题按钮，按下的时候调转到对应的位置，这大概是浏览器页面开发最基本的动效之一了。看了一下很多页面都是基于`jquery`来实现，我不想用它，所以要自己造一个轮子。我们知道浏览器页面滚动都是基于`window.scrollTo`函数来实现的，还有一个函数叫`window.scrollBy`,用于滚动到某个相对坐标位置。

<!-- more -->
---

## 锚元素点击事件

``` javascript

 let anchors = document.querySelectorAll('nav > a');
  anchors.forEach(function(element) {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      scrollTo(this, document.getElementById(this.href.split('#')[1]), 2000);
    });
  }, this);

```

滚动时长设置为`2s`固定值。

---

## 滚动函数实现

``` javascript

function scrollTo(element, to, delay) {
    var difference = to.getBoundingClientRect().top - element.getBoundingClientRect().top - 80;
    var stepTime = 8;
    var stepDis = difference*stepTime / delay ;
    var count = Math.ceil(difference/stepDis);
    var index = 0;

    var outQuart = function(n){
      return 1 - (--n * n * n * n);
    };

    function stepFunc() {
      index++;
      setTimeout(function() {
        var diff = outQuart(index/count)*difference;
        if(count >= index) {
          window.scrollTo(0, diff);
          stepFunc();
        }
      }, stepTime);
    }

    stepFunc();
}

```

`getBoundingClientRect`函数用于获取元素大小和相对视口的位置。为了让屏幕滚动更加平滑一些，这里借助了`outQuart`插值算法，如果想要其他效果可以看[插值算法对照表](http://easings.net/zh-cn),
赠送一个[插值算法库](https://github.com/component/ease)。