---
title: Blob
categories: web
date: 2016-10-02 10:30:03
---

&nbsp;&nbsp;&nbsp;&nbsp;`Blob`(Binary Large Object)术语最初来自数据库，早期数据库因为要存储声音、图片、以及可执行程序等二进制数据对象所以给该类对象取名为`Blob`。
&nbsp;&nbsp;&nbsp;&nbsp;在`Web`领域，`Blob`被定义为包含只读数据的类文件对象。`Blob`中的数据不一定是`js`原生数据形式。常见的`File`接口就继承自`Blob`，并扩展它用于支持用户系统的本地文件。

<!-- more -->

&nbsp;&nbsp;&nbsp;&nbsp;构建一个`Blob`对象通常有三种方式：1、通过`Blob`对象的构造函数来构建。2、从已有的`Blob`对象调用`slice`接口切出一个新的`Blob`对象。3、`canvas` API toBlob方法，把当前绘制信息转为一个`Blob`对象。下面分别看看3种方式的实现：

--
构造函数：
var blob = new Blob(array[optional], options[optional]);
>
array(可选): 一个数组。数组元素可以是：`ArrayBuffer`、`ArrayBufferView`、`Blob`、`DOMString`.或者他们的组合。
options(可选): 一个对象。用于指定`Blob`对象的属性，可选的参数有：
+ type: Content-Type,用于指定将要放入`Blob`中的数据的类型(`MIME`)。

<br>
`Blob`对象的基本属性：
>
size : `Blob`对象包含的字节数。(只读)<br>
type : `Blob`对象包含的数据类型`MIME`，如果类型未知则返回空字符串。

<br>
`Blob`对象的基本方法：
`Blob.slice([start, [end, [content-type]]])`
>
`slice`方法与数组的`slice`类似。

--

**原生对象构建`Blob`**

```javascript

<script type="text/javascript">
window.onload = function() {
    var blob = new Blob(1234);
}
</script>

```
**提示出错：**
>Uncaught TypeError: Failed to construct 'Blob': The 1st argument is neither an array, nor does it have indexed properties.

原因在于`Blob`构造函数要求第一个参数必须是数组，而这里第一个参数既不是一个数组，也没有可索引的属性。既然这里提到了对象的可索引属性，让我联想到了类数组的概念，而`Arguments`就是一个很好的例子。来试一试：
``` javascript
<script type="text/javascript">
function testArgumentsBlob() {
    var blob = new Blob(arguments);
    console.log(blob.size);//3
    console.log(blob.type);//""
}
window.onload = function() {
    testArgumentsBlob(1, 2, 3);
}
</script>

```
可以看到即使是类数组对象，而数组元素类型是`Number`也能得出正确的结论，猜想大概是由于构造函数内部把`Number`转化为`String`的缘故吧！

再来试一试其他的参数类型：
```javascript
window.onload = function() {
  var arg = {hello: "2016"};
  var blob = new Blob([JSON.stringify(arg, null, "\t")], {type: "application/json"});
  console.log(blob.type);//application/json
  console.log(blob.size);//20
}
```
blob.type等于application/json没问题。`arg`转为字符串后的长度为16加上制表符`\t`的宽度4个字节等于20。

--

**用`slice`切出一个`Blob`对象**
``` javascript
window.onload = function() {
    var arg = {hello: "2016"};
    var str = JSON.stringify(arg, null, "\t");
    var blob = new Blob([str], {type: "application/json"});
    var blob2 = blob.slice();
            
    console.log(blob2.size);//20
    console.log(blob2.type);//""
}
```
可以看到，原始的`Blob`对象的`type`属性并不能传递给新的`Blob`对象，所以还是要自己指定。

``` javascript
window.onload = function() {
    var arg = {hello: "2016"};
    var str = JSON.stringify(arg, null, "\t");
    var blob = new Blob([str], {type: "application/json"});
    var blob2 = blob.slice(0, blob.size, "application/json");
    console.log(blob2.size);//20
    console.log(blob2.type);//application/json
}
```
--

**`canvas` toBlob接口**

函数原型：
>void canvas.toBlob(callback, type, encoderOptions);

+ callback: 一个回调函数，新建的`blob`对象是唯一的参数`
+ type: 图片格式，默认为`image/png`，默认`dpi`: 96
+ encoderOptions: 0~1之间的数值。当`type`为image/jpeg 或 image/webp的时候，用于指定图片质量

来个`DEMO`:
```javascript
window.onload = function() {
    var canvas = document.getElementById("main");
    canvas.toBlob(function(blob) {
        var img = document.createElement("img");         
        var url = URL.createObjectURL(blob);
        img.onload = function() {
            URL.revokeObjectURL(url);
        }
        img.src = url;
        document.body.appendChild(img);
    });
}
</script>
```
得出错误：
>Uncaught TypeError: canvas.toBlob is not a function.

一开始觉得自己写错了，`Google`了下才发现`Chrome`居然不支持这个接口。给个`polyfill`[Canvas toBlob](https://github.com/X-Builder/JavaScript-Canvas-to-Blob/blob/master/js/canvas-to-blob.js)。

--

**Blob基本运用**

知道了`Blob`对象的基本属性，以及构建的方法，来看几个具体的运用。

--

**利用`Blob`显示对象`**
```javascript

var blob = new Blob([1, 2, 3]);
var src = URL.createObjectURL(blob);
console.log(src);//blob:http%3A//localhost%3A8003/a47ea163-c253-471a-9d9e-877fe345b60f
var img = document.createElement('img');
img.onload = function() {
    URL.invokeObjectURL(img.src);
}
img.src = src;
document.body.appendChild(img);

```

由于`blob`对象不是一个有效的文件，所以不能正常显示图片。上面的`demo`提到了一个`URL.createObjectURL`接口，顺便来学习以下：
>objectURL = URL.createObjectURL(blob);

主要用于根据一个`Blob`对象(或者`File`,因为`File`继承自`Blob`)，创建一个`URL`用于表示该对象。需要注意的是即使对同一个对象调用两次也会得到不同的`URL`。如果该`URL`不用了需要调用`URL.invokeObjectURL`来进行释放。浏览器会在当前`document unloaded`的时候自动把该`URL`释放。`URL`格式：
> blob:http%3A//localhost%3A8003/a47ea163-c253-471a-9d9e-877fe345b60f


最后来看一个正常点的`DEMO`，利用`URL.createObjectURL`读取本地图片文件，并创建缩略图。

--

**利用`Blob`显示缩略图`**

``` javascript
 var input = document.createElement("input");
 input.type = "file";
 input.accept = "image/*";
 input.multiple = true;
 input.style.display = "none";
 document.body.appendChild(input);

 var fileSelect = document.createElement("a");
 fileSelect.href = "#";
 fileSelect.appendChild(document.createTextNode("Choose files"));
 document.body.appendChild(fileSelect);

 var imgList = document.createElement("div");
 imgList.innerHTML = "<p>No file Selected!</p>"
 document.body.appendChild(imgList);

 input.addEventListener("change", function(e) {
 var files = this.files;
 if(!files.length) {
    return;
 }
 imgList.innerHTML = "";
 var list = document.createElement("ul");
 imgList.appendChild(list);
 for(var i = 0; i < files.length; i++) {
     var li = document.createElement("li"); 
     list.appendChild(li);

     var img = document.createElement("img");
     img.src = window.URL.createObjectURL(files[i]);
     img.height = 60;
     img.width  = 60;
     img.onload = function() {
         window.URL.revokeObjectURL(this.src);
     }
     li.appendChild(img);
     var info = document.createElement("span");
     info.innerHTML = files[i].name + ":" + files[i].size + " bytes";
     li.appendChild(info);
  }
}, false);

fileSelect.addEventListener("click", function(e) {
  input.click();     
       e.preventDefault();
}, false);

```

由于`File`对象继承自`Blob`,所以我们可以很方便的利用`File`对象加载本地系统图片文件，并通过`createObjectURL`生成一个`URL`并加以显示。

参考文献：
+  [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
+  [Using_files_from_web](https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications)

