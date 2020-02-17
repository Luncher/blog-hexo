---
title: nginx服务器完整配置
date: 2018-11-11 17:01:39
tags: nginx
categories: server
---

### 基本参数配置

+ `main context`配置:

#### worker进程启动用户、用户组

```shell
user nginx nginx;
```

#### worker进程数量

```shell
worker_processes  2;
```

#### master进程id存放的文件位置

```shell
pid /home/www/nginx/nginx.pid;
```

<!-- more -->

#### 错误日志

```shell
error_log /home/www/nginx/log/error.log warn;
```
>前面是文件存放的位置，后面是日志的错误等级。如果要设置为`debug`需要在编译`nginx`的时候加上`--with-debug`选项。


#### 设置单个worker进程的最大连接数

```shell
events {
  worker_connections  512;
}
```
>这里的最大连接数包括了，和代理服务器的连接、和客户端的连接等。另外需要注意的是，实际同时建立的最大连接数不能超过最大允许打开的文件数量。可以通过`worker_rlimit_nofile`选项来配置。

#### 设置单个worker进程最大允许打开文件数量

```shell
worker_rlimit_nofile  8192;
```

`main context`配置预览:

```shell
user nginx nginx;
worker_processes  2;
pid   /home/www/nginx/nginx.pid;
error_log /home/www/nginx/log/error.log warn;
worker_rlimit_nofile  2048;
events {
  worker_connections  1024;
}
```

`main context`的配置可以参考[ngx_core_module](https://nginx.org/en/docs/ngx_core_module.html)。


+ `http block`配置:

#### 设置http请求日志

```shell
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
access_log  /home/www/nginx/log/access.log  main;
```

#### 定义MIME type 到文件拓展名的映射

```shell
include       /etc/nginx/mime.types;
#默认的MIME type
default_type  application/octet-stream;
```

#### 优化文件传送

```shell
#磁盘文件从内核态直接发送到网卡设备，避免了拷贝到用户态的开销。
sendfile       on;

#开启TCP_CORK选项，当数据包达到固定大小才开始传送。
tcp_nopush     on;
```

#### 设置客户端连接超时时间

```shell
keepalive_timeout  65s;
```
>当时间超过65秒，客户端到服务器的连接将会断开。可以把时间设置的稍微短一些，加快无用连接的回收。

#### 开启基本文件目录功能

```shell
autoindex on;
```
>`autoindex`依赖于[ngx_http_autoindex_module](https://nginx.org/en/docs/http/ngx_http_autoindex_module.html)。

`http block`配置预览：

```shell
http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                       '$status $body_bytes_sent "$http_referer" '
                       '"$http_user_agent" "$http_x_forwarded_for"';

  access_log  /home/www/nginx/log/access.log  main;

  sendfile        on;
  tcp_nopush      on;

  keepalive_timeout  65s;
}
```

---

### 反向代理配置

反向代理相关的配置一般都放置在`nginx/conf.d`目录下，以`hostname`命名。

#### 虚拟主机与请求的分发

```shell
listen 443 ssl default_server;
server_name bitsum.pro *.bitsum.pro;
```
>一个`server block`对应一个虚拟主机的配置，`default_server`当请求找不到虚拟主机的时候，该虚拟主机作为默认的虚拟主机接受请求。


#### 定义反向代理的`host`、负载均衡

```shell
upstream backend_hosts {
  server  47.75.216.4;
}
```
>`upstream`block里面可以配置负载均衡算法、权重等信息。

**几种负载均衡算法：**

+ round robin
>默认的均衡算法，客户端请求被轮流分配到上游服务器。
+ least_conn
>新的客户端连接被分配到最少活跃连接数的上游服务器。
+ ip_hash
>用客户端ip做为hash的key，前三位8字节决定哪一个服务器处理这个客户端请求。这种算法可以保证`session`一致性。
+ hash
>基于客户端传递的数据做hash。

**设置服务器权重:**
```shell
upstream backend_hosts {
  server host1.example.com weight=3;
  server host2.example.com;
}
```
>默认每一个`host`的权重都是1，`host1`接受的请求量将会是`host2`的三倍。


#### 指定上游被代理的服务器、设置额外的请求头

```shell
location / {
  #所有请求都被转发到`backend_hosts`
  proxy_pass  http://backend_hosts;
  #设置客户端请求host
  proxy_set_header    HOST $host;
  #设置客户端请求协议(http、https)
  proxy_set_header    X-Forwarded-Proto $scheme;
  #把客户端的真实ip通过`X-Real-IP`透传到上游服务器
  proxy_set_header    X-Real-IP $remote_addr;
  #代理服务器地址列表、上层代理服务器地址添加到后面
  proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
}
```


### 使用Buffer缓存数据

*为什么`buffer`能优化代理请求呢？*

当没有开启`buffer`的时候，被代理的上游服务器的数据立刻被代理服务器转送到客户端。如果客户端处理的足够快，可以关闭`buffer`的功能，以便客户端尽可能快的获得数据。当`buffer`功能开启的时候，代理服务器会暂存上游服务器返回的数据，然后再反馈给客户端。如果客户端接受数据的速度过慢，`nginx`会关闭到代理服务器的连接。然后以适合的速度发送数据给客户端。


`Buffer`相关配置命令:

+ proxy_buffering
>控制是否开启`buffering`功能。

+ proxy_buffers
>控制缓存代理响应的块的个数以及大小。

+ proxy_buffer_size
>控制缓存代理响应头部的大小, 默认等于proxy_buffers配置的`size`大小，由于响应头比较小，可以适当设置小一点。(当proxy_buffering关闭的时候，依然可以使用。)

+ proxy_busy_buffers_size
>控制发送数据给客户端的缓存的大小。

+ proxy_max_temp_file_size
>当上游服务器的响应过大的时候，会被缓存在一个临时的磁盘文件里面。该指令配置缓存文件的大小。

+ proxy_temp_file_write_size
>当上游服务器的响应过大的时候，会被缓存在一个临时的磁盘文件里面。该指令配置一次写入缓存文件的数据大小。

+ proxy_temp_path
>缓存临时文件存放目录。


### 设置`Cache`缓存静态数据

`Cache`相关配置命令:

+ proxy_cache_path  
基本格式：
  `proxy_cache_path    /home/www/nginx/cache   levels=1:2  keys_zone=backcache:8m max_size=50m use_temp_path=off;`
>`/home/www/nginx/cache`作为缓存路径，如果不存在需要新建，并且设置好目录的权限：

```shell
mkdir -p /home/www/nginx/cache
#根据启动worker进程的用户, 这里设置为对应的用户
sudo chown nginx.nginx /home/www/nginx/cache
sudo chmod 700 /home/www/nginx/cache
```

`levels`设置缓存的目录结构层次，缓存`key`的最后一个字节作为一级子目录的名称，倒数二三两个字节作为二级缓存子目录的名称。

`keys_zone`定义缓存区域的名称，这里称之为`backcache`。最多有8m的缓存`key`，缓存数据的最大大小为`50m`。


+ proxy_cache_key(定义缓存`key`的格式)
  基本格式：  
  `proxy_cache_key     "$scheme$request_method$host$request_uri$is_args$args";`


+ proxy_cache_valid
  基本格式：  
  `proxy_cache_valid   404 1m;`
>根据状态码来控制缓存的有效时间，上例中，缓存404响应的有效时间为1分钟。

**启用Cache**
上面定义了`cache`的基本配置，现在要告诉`nginx`那里应该开启`cache`。

```shell
location ~ ^/(admin|download|miner-client|mobile|static|website)/ {
  #使用backcache这个cache zone
  proxy_cache backcache;

  #允许客户端通过http请求头控制跳过缓存请求最新的数据
  proxy_cache_bypass  $http_cache_control;

  #添加一个头部信息，对于一个请求可以清晰的看到，是被缓存了、缓存失效等状态信息。
  add_header X-Proxy-Cache $upstream_cache_status;

  proxy_pass  http://backend_hosts;
}
```

**开启gzip压缩**

```shell
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

### 给你的网站加上https证书

要给网站开启`https`，那么你需要从证书颁发机构(CA)获得一个证书文件，[letsencrypt](https://letsencrypt.org/)是一个免费开放的证书颁发机构。接下来，你需要证明这个域名你实际拥有控制权，这需要通过[ACME protocol](https://ietf-wg-acme.github.io/acme/)协议来保障。

[certbot](https://certbot.eff.org/)是一个`ACME`的客户端，在你的主机运行它自动生成证书文件，与此同时主机不需要停机。

letsencrypt原理图：

![letEncrypt](/images/letEncrypt原理图.png)

>LetEncrypt会发送请求到`ACME`运行的服务器，校验所有权是否合法。

接下来看看如何配置：

因为系统主机安装了`docker`，`certbot`刚好也有对应的镜像文件：

```shell
sudo docker run -it --name certbot  -p 80:80 \
  -v /home/www/nginx/html:/usr/share/nginx/html \
  -v /home/www/mycertificate/letsencrypt:/etc/letsencrypt \
  -v /home/www/mycertificate/letsencrypt-lib/:/var/lib/letsencrypt \
  certbot/certbot certonly
```

允许上面命令的时候，会出现一系列交互提示出现：


How would you like to authenticate with the ACME CA?
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
1: Spin up a temporary webserver (standalone)
2: Place files in webroot directory (webroot)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Select the appropriate number [1-2] then [enter] (press 'c' to cancel):

因为代理服务器还没有启动起来，这里选择`standalone`模式，就把`ACME`当作一个临时的web服务器。


Plugins selected: Authenticator standalone, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel):

要求填写一个邮箱地址，接受证书过期的提示，以及一些安全提醒等。

Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.2-November-15-2017.pdf. You must
agree in order to register with the ACME server at
https://acme-v02.api.letsencrypt.org/directory
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(A)gree/(C)ancel: A

同意`letsencrypt`这个组织的服务条款。

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Would you be willing to share your email address with the Electronic Frontier
Foundation, a founding partner of the Let's Encrypt project and the non-profit
organization that develops Certbot? We'd like to send you email about our work
encrypting the web, EFF news, campaigns, and ways to support digital freedom.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: Y
Please enter in your domain name(s) (comma and/or space separated)  (Enter 'c'
to cancel):

提示输入要开启`https`的域名，多个域名用逗号或者空格分开。

>证书生成完毕之后会在`/home/www/mycertificate/letsencrypt`目录下有相应的文件，值得注意的是，多个域名共用一个证书文件。所以如果你在上一步配置了多个域名，这里也只能看到一个证书文件。

*nginx 配置`https`证书*

```shell
server {
  listen 443 ssl default_server;
  server_name bitsum.pro *.bitsum.pro;
  #PEM格式的证书文件
  ssl_certificate     /home/www/mycertificate/letsencrypt/live/dev.bitsum.pro/fullchain.pem;
  #证书文件的密钥
  ssl_certificate_key /home/www/mycertificate/letsencrypt/live/dev.bitsum.pro/privkey.pem;
  #指定https的协议版本
  ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
  # 启用指定的OpenSSL ciphers
  ssl_ciphers         HIGH:!aNULL:!MD5;
}
```

启动`nginx`服务：

```shell
sudo nginx -c /home/www/nginx/nginx.conf
```

**完整配置文件**

*nginx.conf:*

```shell
user  nginx nginx;
worker_processes  2;

pid        /home/www/nginx/nginx.pid;
error_log  /home/www/nginx/log/error.log warn;

worker_rlimit_nofile    2048;
events {
  worker_connections  1024;
 }
 
 http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /home/www/nginx/log/access.log  main;

    sendfile        on;
    tcp_nopush     on;

    keepalive_timeout  65s;

    autoindex  on;
 
    proxy_cache_path    /home/www/nginx/cache   levels=1:2  keys_zone=backcache:8m max_size=50m use_temp_path=off;
    proxy_cache_key     "$scheme$request_method$host$request_uri$is_args$args";
    proxy_cache_valid   302 10m;
    proxy_cache_valid   404 1m;
 
    include /home/www/nginx/conf.d/*.conf;
 }
```
*config.d/bitsum.pro.conf:*

```shell
server {
    listen 80;
    server_name bitsum.pro;
    return 301 https://bitsum.pro$request_uri;
}

upstream backend_hosts {
    server  47.75.216.4;
}

server {
  listen 443 ssl default_server;
  server_name bitsum.pro *.bitsum.pro;
  ssl_certificate     /home/www/mycertificate/letsencrypt/live/dev.bitsum.pro/fullchain.pem;
  ssl_certificate_key /home/www/mycertificate/letsencrypt/live/dev.bitsum.pro/privkey.pem;
  ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers         HIGH:!aNULL:!MD5;

  proxy_buffering on;
  proxy_buffer_size 2k;
  proxy_buffers   32 8k;
  proxy_busy_buffers_size 16k;
  proxy_max_temp_file_size 2048m;
  proxy_temp_file_write_size 32k;

  location ~ ^/(admin|download|miner-client|mobile|static|website)/ {
    proxy_cache backcache;
    proxy_cache_bypass  $http_cache_control;
    add_header X-Proxy-Cache $upstream_cache_status;

    proxy_pass  http://backend_hosts;
  }

  location / {
    proxy_pass  http://backend_hosts;

    proxy_set_header    HOST $host;
    proxy_set_header    X-Forwarded-Proto $scheme;
    proxy_set_header    X-Real-IP $remote_addr;
    proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
  }

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


### 参考文献

[Docker NGINX and letsencrypt](https://medium.com/@pierangelo1982/docker-nginx-and-letsencrypt-432397db4a0c)  
[letsencrypt](https://letsencrypt.org/getting-started/)  
[certbot](https://certbot.eff.org)  
[understanding-nginx-http-proxying](https://www.digitalocean.com/community/tutorials/understanding-nginx-http-proxying-load-balancing-buffering-and-caching#configuring-proxy-caching-to-decrease-response-times)  
[ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)  
[ngx_core_module](https://nginx.org/en/docs/http/ngx_core_module.html)  
[ngx_http_ssl_module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)  
[nginx-caching-guide](https://www.nginx.com/blog/nginx-caching-guide/)  
