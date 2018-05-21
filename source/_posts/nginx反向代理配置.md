---
title: nginx反向代理配置
date: 2018-05-20 10:08:42
tags: 
  - nginx
  - proxy
  - cache
keywords: 
  - nginx
  - cache
  - proxy
categories: server
---

## nginx 基本配置

为了让`nginx`能正常运行，必须设置它的一些基本配置，`nginx`基本配置主要包含了`nginx`正常运行的配置，包括了日志，以及对master/worker进程的控制、`nginx`服务监听分发等。

```nginx
user nobody; #worker进程启动用户

worker_processes 1; #worker进程数量

error_log logs/error.log debug; #设置nginx错误日志输出路径以及日志等级

pid logs/nginx.pid;#设置保存master进程ID的文件路径

events {
  worker_connections 1024;#设置每个worker进程最大连接数量为1024
}

http {
  # 定义MIME type 到文件拓展名的映射
  include       mime.types;

  #默认的MIME type
  default_type  application/octet-stream;

  # 新增日志格式，格式名称为main
  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

  # 设置http请求访问日志写入的路径，以及解析请求日志的格式
  access_log   logs/access.log  main;

  #设置上游服务器地址
  upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
  }

  server {
    listen 80;# 设置nginx服务监听80端口
    server_name localhost; # 该server只处理请求的Host等于`localhost`的请求
  }
}

```

## nginx 反向代理配置
`nginx`包含了一系列的http请求相关的配置，包含如：`ngx_http_core_module`、`ngx_http_proxy_module`等。参考链接: [Modules reference](http://nginx.org/en/docs/)。这里只配置一些能够用得上的选项：


### 定义缓存路径

```nginx

http {
  # 设置缓存路径、设置一个两层结构的目录、设置缓存键和元数据的共享内存区名称为：mycache, 大小：10m
  # 设置项目不被访问情况下再内存中保持60分钟、缓存的上限为1g、关闭缓存临时文件，避免不必要的文件拷贝
  proxy_cache_path  /data/nginx/cache levels=1:2 keys_zone=my_cache:10m inactive=60m  max_size=1g use_temp_path=off;
}

```

### 反向代理缓存基本配置

```nginx

server {
  # 定义共享内存区域名称
  proxy_cache   my_cache;

  # 定义nginx连接到代理服务器的超时时间
  proxy_connect_timeout 1s;

  #如果当前正在更新缓存或者当前没有代理服务器来处理请求，则使用老的缓存
  proxy_cache_use_stale timeout updating;

  #同一时间只允许一个请求修改缓存
  #锁定时间：1秒
  proxy_cache_lock on;
  proxy_cache_lock_timeout 1s;

  #关闭代理服务器的重定向请求
  proxy_redirect off;

  #根据客户端请求的uri生成缓存键(对uri做md5操作)
  proxy_cache_key "$request_uri"

  #设置200状态码的返回数据的缓存时间为1秒钟
  #定义的其实是一个绝对过期时间即：(第一次缓存的时间+配置的缓存时间)
  proxy_cache_valid   200   1s;

  #nginx反向代理的时候，一些http头部请求字段不会传递给代理服务器，这个时候需要我们手动指定
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;

  #设置代理服务器集群
  location / {
    proxy_pass http://backend;
  }
}

```

### 利用`ngx_http_headers_module`和`ngx_http_upstream_module`设置响应头信息

```nginx

location / {
  # 设置响应头部信息，判断请求是否被缓存
  add_header  X-Cache   '$upstream_cache_status';
}

```

## nginx gzip模块配置

```nginx

server {
  #开启gzip压缩功能
  gzip on;

  #设置启用gzip的http版本信息
  gzip_http_version   1.0;

  #设置gzip压缩等级
  gzip_comp_level   5;

  #设置当Content-Length大于256的时候启用gzip配置
  gzip_min_length   256;

  #对所有的代理请求都启用gzip
  gzip_proxied  any;

  #添加“Vary: Accept-Encoding”到请求头部告知代理服务器是否支持gzip压缩
  gzip_vary   on;

  #设置需要压缩的MIME types
  gzip_types
    application/atom+xml
    application/javascript
    application/json
    application/rss+xml
    application/vnd.ms-fontobject
    application/x-font-ttf
    application/x-web-app-manifest+json
    application/xhtml+xml
    application/xml
    font/opentype
    image/svg+xml
    image/x-icon
    text/css
    text/plain
    text/x-component;
}

```

--EOF--