'use strict'

var Koa = require('koa');               // 引入 koa@1.2.0 
var path = require('path');             // 引入 path模块 提供了处理和转换路径的工具
var wechat = require('./wechat/g');     // 引入接入 wechat 的函数（属于中间件）
var util = require('./libs/util');      // 引入 读写 access_token 的函数
var config = require('./config')
var weixin = require('./weixin')
var wechat_file = path.join(__dirname, './config/wechat.txt')   // 引入保存 access_token 的txt文件

var app = new Koa()   // 实例化 koa

app.use(wechat(config.wechat, weixin.reply))  // 运行中间件

app.listen(8080)    // 监听 8080 端口
console.log('Listening: 8080')