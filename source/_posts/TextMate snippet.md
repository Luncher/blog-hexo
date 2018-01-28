---
title: textMate snippet说明
categories: vscode
---

textMate一直是`mac`下常用的编辑器不过现在好像被`sublime`、`atom`、`vscode`等一系列新生带编辑器取代。为了学习`vscode`的编写，打算系统学学`snippet`语法。

以下译自：
> https://manual.macromates.com/en/snippets

snippet是一小段的文本，你可以插入到你的文档里面。它可以包含代码，变量，`tab`键，占位符，以及转换。

# 普通文本

在最简单的情况下，你可以使用 snippet插入一些文本，避免一遍又一遍的重复输入。这样不仅减少输入次数，而且减少出错。  

在你使用 snippet的时候唯一一件事情需要注意的是：`$`和\`是保留字符，如果你想要使用这两个字符，你需要在字符前面加入一个转译符号：`\`。

# 变量

你可以通过在变量名称前面加入`$`的形式插入变量。所有的正常变量都被支持，最有用的大概是：`TM_SELECTED_TEXT`变量。例如我们想要创建一个 snippet,用于包装`LaTeX \textbf`命令的选择，我们可以这样写：

> \textbf{$TM_SELECTED_TEXT}

如果没有文本被选中，变量不会被设置，也就不会插入任何文本。我们可以通过以下语法插入一个默认值： 

>\textbf{${TM_SELECTED_TEXT:no text was selected}}

默认值也可以包含变量，或者`shell code`。如果默认文本必须包含`}`，则需要转译。

# `Tab`键

在输入完成后，光标会停留在`snippet`最后的位置，又时候这不是我们要的结果。我们可以通过使用`$0`的形式指定光标停留的位置。例如，如果我们给`html`文件定义一个名为`div`的`snippet`，并且希望光标停留在开始和结束标签中间。我们可以这样写：

``` html
<div>
    $0
<div>
```

我们还可以在$后面指定更多的数字，按下`tab`键的时候控制光标在这些位置移动。例如：

``` html
<div$1>
    $0
<div>
```

第一次光标出现在$0位置，按下`tab`光标移动到$1位置。

# 占位符

和变量一样，`tab`也可以有占位符，语法类似：
>${«tab stop»:«default value»}

默认值可以包含文本、`shell code`、以及其他占位符：

``` html
<div${1: id="${2:some_id}"}>
    $0
</div>
```

插入该`snippet`将会插入一个`div`标签，`id`参数被选中，我们可以直接编辑它或者按下`tab`键切换光标位置。当你编辑占位符文本，内嵌的`tab`停止位会被删除。

# 镜像

有时候我们想要同时修改多个位置，即编辑一个文本的时候能够影响到多个位置。例如，我们新建一个`laTex`的`snippet`：

``` html
\begin{${1:enumerate}}
    $0
\end{$1}
```

在插入完成该`snippet`，`enumerate`会被选中，修改它会影响到`\end`位置部分。

*vscode*没有支持的格式没有做翻译，有兴趣的自己研究：）