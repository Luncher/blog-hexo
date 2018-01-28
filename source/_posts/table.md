---
title: table
date: 2016-08-07 19:09:38
tags: 
  - css 
  - html 
  - table
categories: web
---

表格大概是`html`里面最常用的元素之一。看书上介绍说，在`css`出现之前，前端工程师一直采用`table`来布局页面，
不过我没有尝试过，相比于那些早些年的前端工程师，现在的前端工程师应该算比较幸运吧！`IE`系列老旧浏览器逐渐`死去`，
`HTML5`标准颁布，一切都在往好的方向走～

# 表格的基本属性以及实践

## 表格相关的基本元素

- table
  定义表格的根元素
- thead
  定义表头(页眉)
- tbody
  定义表体
- tfoot
  定义表脚(页脚)
- tr
  定义一行
- th
  定义表头内单元格
- td
  定义普通数据单元格
- caption
  定义表格标题
- col
  定义表格列
- colgroup
  定义表格列组
---

**注意事项**：

- `thead`、`tbody`、`tfoot`主要方便对表格不同区域进行分组，以及在打印表格的时候提供不同信息。
- `td`、`th`单元格必须包含在`tr`属性里面
- `col`、`colgroup`元素主要方便对表格不同列进行样式设置,需要注意的是列元素可以控制的属性[比较有限](http://www.w3.org/TR/CSS21/tables.html#columns).基本的`color`、`text-align`都不被支持

比较合理的解释看这里：
>The colour of text is dependent on the 'color' property of its element. Unless specified, the 'color' property (basically) defaults to 'inherit', which means "take the value of the parent element".

So for some text in a cell, the colour is determined by the 'color' property of the cell, which is taken from the row, which is taken from the table, which is taken from the table's parent, and so on.

What about the column? Well, the column isn't one of the cell's ancestors, so it never gets a look-in! And therein lies the problem.



## 表格样式布局

- caption-side
  控制表格标题位置
- border-collapse
  控制表格边框模型
- table-layout
  控制表格布局，是否根据单元格内容缩放
- border-spacing
  控制相邻单元格边框之间的距离，仅用于边框模型为分离模式
- empty-cells
  控制隐藏表格中空单元格的背景与边框
- rowspan
  控制单元格所跨行数
- colspan
  控制单元格所跨列数

---

## 实践问题

### 奇偶行设置不同背景色

1、css 奇偶行伪类选择器

`nth-child(n)`选择器匹配其父元素的第`n`个子元素，odd 和 even 是可用于匹配下标是奇数或偶数的子元素的关键词。

``` css
table tr:nth-child(even) {
  background-color: red;
}
```

> 为`tr`相对父元素为偶数索引(从1开始)的行设置背景为红色


### 设置第一列为不同背景

1、使用`first-child`伪类选择器

``` css
table td:first-child {
  background-color: red;
}
```


2、使用`col`元素控制样式

``` html

<table>
  <caption>hahah</caption>
  <col class="col1"\>
  <tr>
    <th>th1</th>
    <th>th2</th>
    /...

```

``` css

table .col1 {
  background-color: gray;
}

```

### 设置单元格边框并合并单元格

控制单元格的显示除了`盒模型`基本属性外还有`rowspan` `colspan` `empty-cells`三个属性。

需要注意的是`rowspan`与`colspan`只能通过`html`属性设置，而不能通过`css`样式引用。

