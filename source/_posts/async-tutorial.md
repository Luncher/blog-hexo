---
title: async-tutorial
categories: server
date: 2016-06-07 19:37:24
---
`async`是一个强大的异步流程控制库，其语义类似于`js`对数组的操作。它提供了一系列非常强大而便捷的方法，有助于我们在`javascript`单线程模型背景下写出优雅的逻辑控制代码。  

<!-- more -->

### **牛刀小试**   
先从文件操作开始初步了解`async`函数库的作用：  

+ 使用`filter`过滤出磁盘中存在的文件  

```javascript
const fs = require('fs');  
const async = require('async');  

async.filter(['f1', 'f2', 'f3'], function(it, callback) {
    fs.access(it, function(err) {
      callback(null, !err);
    });
}, function(err, results) {
  console.log(results);
});

```  
假设当前目录下存在以上三个文件，那么`results`输出为：  
```javascript
['f1', 'f2', 'f3']
```  

+ 使用`map`判断文件是否存在  
```javascript
async.map(['f1', 'f2', 'f3'], function(it, callback) {
  fs.exists(function(exists) {
      callback(null, exists);
  });
}, function(err, results) {
    console.log(results);//[true, true, true]
});
```  

>以上两个例子分别使用了`access`与`exists`判断文件是否存在，关于两个`API`的详细说明，请查看`nodejs`[官方文档](https://nodejs.org/dist/latest-v6.x/docs/api/fs.html#fs_fs_exists_path_callback)  


+ 常用的多任务并行   

```javascript  
function asyncTask(delay, arg) {
    return function(callback) {
        setTimeout(function() {
            console.log(arg + "done");
            callback(null, arg);
        }, delay);
    };
}

async.parallel([
    asyncTask(10, "task1"),
    asyncTask(1, "task2"),
    asyncTask(100, "task3"),
], function(err, ret) {
    console.log(ret);
});

```  
`asyncTask`输出的顺序依次为：
```javascript  

[luncher@localhost async]$ node app.js
task2done
task1done
task3done
//ret
[ 'task1', 'task2', 'task3' ]

```  
可见虽然任务是并行的，但是最终的结果依然按照任务数组的顺序排列。  

+ 顺序执行任务  

```javascript  

function asyncTask(delay, arg) {
    return function(callback) {
        setTimeout(function() {
            console.log(arg + "done");
            callback(null, arg);
        }, delay);
    };
}

async.series([
    asyncTask(10, "task1"),
    asyncTask(1, "task2"),
    asyncTask(100, "task3"),
], function(err, ret) {
    console.log(ret);
});

```  

输出：  

```javascript  
[luncher@localhost async]$ node app.js
task1done
task2done
task3done
[ 'task1', 'task2', 'task3' ]  
```  
可以看到任务按照传入的顺序依次执行。  

---   

### 集合类型多任务处理  
- `each`  
`each`函数依次遍历数组执行回调函数：  

```javascript  

function readFile(file, callback) {
    fs.readFile(file, function(err, ret) {
        console.log("readFile "+ file + " done");
        callback(err);
    });
}

async.each(['f1', 'f2', 'f3'], readFile, function(err) {
    console.log("all done");
});

```  
**需要注意的是，each不能保证迭代函数完成的顺序，这取决于用户的具体任务**  

- `forEachOf`  

`each`函数可以对数组进行遍历，如果想要遍历的是一个对象，那么需要用到`forEachOf`.  

```javascript  
function readFile(file, k, callback) {
    fs.readFile(file, function(err, ret) {
        console.log("readFile "+ k + " " + file + " done");
        callback(err);
    });
}

async.forEachOf({k1: "f1", k2: "f2", k3: "f3"}, readFile, function(err) {
    console.log("all done");
});
```  

迭代函数第一个参数是`value`，第二个参数是`key`.  

- 控制`each`和`foEachOf`的顺序  
` eachSeries`与`forEachOf`都是用来控制迭代函数的顺序执行：  

```javascript  

function readFile(file, k, callback) {
    fs.readFile(file, function(err, ret) {
        console.log("readFile "+ k + " " + file + " done");
        callback(err);
    });
}

async.forEachOfSeries({k1: "f1", k2: "f2", k3: "f3"}, readFile, function(err) {
    console.log("all done");
});

```  

这样程序的输出始终是：  


```javascript
[luncher@localhost async]$ node app.js
readFile k1 f1 done  
readFile k2 f2 done
readFile k3 f3 done
all done

```

+ 使用`apply`包装异步任务  

前面几个异步任务都需要人为的额外写一个函数，如`asyncTask`，`async`提供一个`apply`语法糖用于解决此类问题：  

```javascript  

// 使用 apply

async.parallel([
    async.apply(fs.writeFile, 'testfile1', 'test1'),
    async.apply(fs.writeFile, 'testfile2', 'test2'),
]);


// 等同于

async.parallel([
    function(callback){
        fs.writeFile('testfile1', 'test1', callback);
    },
    function(callback){
        fs.writeFile('testfile2', 'test2', callback);
    }
]);

```  


+ 使用`Limit`类函数控制并发数量  

`async`为每个接口都提供了一个`Limit`参数，用户限制并发数量，我们利用`filterLimit`做一个简单的测试：  

```javascript

var count = 0;
async.filterLimit([1, 10, 28, 90, 10], 2, function(it, callback) {
    count++;
    console.log(it + "开始");
    console.log("并发数：", count);
    setTimeout(function() {
        count--;
        console.log(it + "结束");
        callback(null);
    }, it);
}, function(results) {
    console.log(results);
});

```  
输出：  

```javascript  
[luncher@localhost async]$ node app.js 
1开始
并发数： 1
10开始
并发数： 2
1结束
28开始
并发数： 2
10结束
90开始
并发数： 2
28结束
10开始
并发数： 2
10结束
90结束
null

```  

可以看到，最大并发数也就是`2`，虽然待执行任务大于`2`.  

`async`几乎提供了全类数组操作类型的接口，例如：`sortBy`、`reduce`、`some`等，这里不再一一展开。  

### 异步控制函数  

前面介绍了两个异步流程控制函数：`series`和`parallel`。下面介绍其他几个流程控制函数：    

+ 使用`whilst`实现`while`操作  

`whilst`用于实现，类似于`while`的效果，直到满足条件，否则持续执行回调函数。  

```javascript  
var c = 0;

async.whilst(function() {
    console.log("judge");
    return c < 3;
}, function(callback) {
    c++;
    console.log("try " + c);
    setTimeout(function() {
        callback(null, c);
    }, 1000);
}, function(err, val) {
    console.log('err', err);
    console.log('value: ', val);
});

```  
输出：  

```javascript  
[luncher@localhost async]$ node app.js 
judge
try 1
judge
try 2
judge
try 3
judge
err null
value:  3
```  

+ 使用`waterFall`解决异步任务依赖问题  

```javascript  
async.waterfall([
    function(callback) {
        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
      // arg1 now equals 'one' and arg2 now equals 'two'
        callback(null, 'three');
    },
    function(arg1, callback) {
        // arg1 now equals 'three'
        callback(null, 'done');
    }
], function (err, result) {
    // result now equals 'done'
});
```  


