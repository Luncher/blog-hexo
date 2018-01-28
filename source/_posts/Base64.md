---
title: Base64
categories: web
date: 2016-03-07 19:37:24
---
&nbsp;&nbsp;&nbsp;&nbsp;说到Base64相信大家都不陌生，在`web`开发过程中经常可以见到它的身影。Base64是一种编码方式，常用于表示、传输、与存储二进制数据。用64个可打印字符来表示二进制数据，从而解决一些二进制数据无法使用的场景。`Base64`最初主要用户多用途互联网邮件扩展(`MIME Email`), `MIME`规定了用于表示各式各样数据(非英文符号数据)的符号化方法，而`Base64`编码就作为内容传输编码方式之一(`charset`)。`http`协议就是采用了`MIME`的框架。

&nbsp;&nbsp;&nbsp;&nbsp;由于`2^6=64`所以最经济的方式就是把`6bit`作为一个编码单元，对应一个可打印字符来完成编码工作。来看看`Base64`编码表：

![Base64编码表](http://www.tangide.com/storage/read.php?path=qq/A/A84CE7A6466CC40FAC339261A8361B91/2015-12-19%2016:12:20%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE.png)

`Base64`编码规则：

> Base64编码的时候将三个byte的数据先后放入一个24bit的缓冲区中，先来的byte占高位。然后，每次取出6个bit参照编码码表得出编码。如果被编码字符的长度不能被3整除，那么就在编码输出的末尾补上`=`号。比如说，如果待编码的字符长度是4个字节，那么编码输出会有两个等号。如果待编码字符的长度是8个字节那么编码输出末尾会补上一个等号。如果待编码的比特位不足一个编码单元(`6bit`)的时候，则需要在低位补全。当最后剩余一个八位字节（一个byte）时，最后一个6位的base64字节块有四位是0值。

说到这里你可能已经想到编码后的数据比原始数据略长，为原来的4/3。下面来看看`Base64`编码的应用。

###Canvas

&nbsp;&nbsp;&nbsp;&nbsp;`canvas`有一个toDataURL接口用于把当前的`canvas`转换为`data url`数据格式的图片。
> canvas.toDataURL(type, encoderOptions);

+ `type`属性设置转换的图片格式，默认为`image/png`。
+ `encoderOptions`为一个数字范围从`0-1`，用于设置图片的质量。

`dataURL`格式定义：
>data:[mediatype][;base64],<data>

+ mediatype 为一个`MIME`格式定义的字符串，如`image/jpeg`表示jpeg图片。
+ base64字段表示后面的数据编码方式。

举个例子：
```javascript
<script type="text/javascript">
window.onload = function() {
	var canvas = document.getElementById('main-canvas');
	var context = canvas.getContext('2d');
	context.fillRect(0, 0, canvas.width, canvas.height);
	var dataURL = canvas.toDataURL();
	console.log(dataURL);
}
</script>
```

将会得到如下输出:
``` javascript
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAALQCAYAAABIRqOlAAAc9UlEQ…AAgUBAgAN0kwQIECBAQID9AAECBAgQCAQEOEA3SYAAAQIELrSX0B9Umz4MAAAAAElFTkSuQmCC
```

此外，`linux/mac`系统有一个命令行工具: `uuencode`可以把文件转换成`Base64`格式输出, 先把当前的`canvas`另存为一个图片，然后运行命令行程序可以得到如下结论，与toDataURL结果一致：

```
[luncher@localhost ~]$ uuencode -m 123.png 123-base 
begin-base64 640 123-base
iVBORw0KGgoAAAANSUhEUgAAAeAAAALQCAYAAABIRqOlAAAc9UlEQVR4Xu3V
wQkAMAzEsGT/oVvoEPVHWeBABLwzc8YRIECAAAECXwVWgL96GyNAgAABAk9A
gD0CAQIECBAIBAQ4QDdJgAABAgQE2A8QIECAAIFAQIADdJMECBAgQECA/QAB
AgQIEAgEBDhAN0mAAAECBATYDxAgQIAAgUBAgAN0kwQIECBAQID9AAECBAgQ
CAQEOEA3SYAAAQIEBNgPECBAgACBQECAA3STBAgQIEBAgP0AAQIECBAIBAQ4
QDdJgAABAgQE2A8QIECAAIFAQIADdJMECBAgQECA/QABAgQIEAgEBDhAN0mA

```



