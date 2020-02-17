---
title: vscode编辑器进阶
categories: vscode
date: 2016-04-07 10:37:03
---

## 前言
假定你已经阅读完成了`EDITOR`一章。现在开始来定制`vscode`。

<!-- more -->
两个目的：  
- 减少重复工作，把时间花费在有意义的事情上  
- 可定制、可扩展、可积累  

## 主题颜色字体
`File>>Perfences=>corlor theme`选择一个舒服的主题，当然也可以按下`ctril+p`输入
`ext install `安装喜欢的主题。字体通过用户配置文件来设置：按下`F1`输入`user`选择第一个条目按下回车。
左边是默认配置，右边写入自定义配置。


颜色字体这类属于无关紧要的细节，不需要在这方面浪费过多的时间，接下来说说`snippets`。

## vscode snippets

`vscode`针对不同的语言有不同的`snippets`。举个例子,新建一个`test.html`,输入：
> html

按下`ctrl+space`触发`snippets`。有两个选项可供选择，`html`标签以及`html`模板。
选择`html模板`按下回车你会看到一下子多了很多东西：

``` html
<!DOCTYPE html>
<html lang="en">
    <head>
        <title></title>
        <meta charset="UTF-8">
        <link href="css/style.css" rel="stylesheet">
    </head>
    <body>
    
    </body>
</html>

```
光标默认停留在`en`的位置，按下`TAB`会在en、title、以及body之间切换，能这么做归功于`vscode`的`html snippets`扩展。
项目地址：  
>
https://github.com/abusaidm/html-snippets/blob/master/snippets/snippets.json

看看`snippets.json`的实现：  
```
"html5": {
    "prefix": "html5",
    "body": [
        "<!DOCTYPE html>",
        "<html lang=\"$1en\">",
        "\t<head>",
        "\t\t<title>$2</title>",
        "\t\t<meta charset=\"UTF-8\">",
        "\t\t<link href=\"$3css/style.css\" rel=\"stylesheet\">",
        "\t</head>",
        "\t<body>",
        "\t$4",
        "\t</body>",
        "</html>"
        ],
    "description": "HTML - Defines a template for a html5 document",
    "scope": "text.html"
    }
```

解释一下这个`snippets`:  
- "html5"表示该`snippets`的名称，`prefix`后面的`html5`表示触发条件  
- `body`表示`snippets`内容，是一个数组，数组元素最终会用换行符号链接起来  
- `\t`表示缩进  
- `$数字`表示光标停留的次序，`$1`表示第一次停留位置，按下`Tab`键移到下一个位置  


实在太方便了，工程师们就应该多动动脑子！！！  

当然也可以定义自己的`snippets`，在`File=>Perfences=>User Snippets`选择语言然后会出现以下代码：  

```
/*
	 // Place your snippets for Markdown here. Each snippet is defined under a snippet name and has a prefix, body and 
	 // description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:
	 // $1, $2 for tab stops, ${id} and ${id:label} and ${1:label} for variables. Variables with the same id are connected.
	 // Example:
	 "Print to console": {
		"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
		"description": "Log output to console"
	}
*/
```  

以后你可以把自己的`snippet`放到这里。顺便说一句`vscode``snippet`格式遵循`textmate`,除了：   
> 
 'regular expression replacements', 'interpolated shell code' and 'transformations'  
> 
https://manual.macromates.com/en/snippets  

你可以按下`ctrl+p`(快速打开)输入`ext install sni`,会列出一系列`snippet`。  
`enjoy it :) `  


## 任务：  
- 到https://marketplace.visualstudio.com/vscode找最常用的包试一试
- 学习`snippet`基本语法，学会自己编写 snippet    
