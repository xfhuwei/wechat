'use strict'

var path = require('path');             // 引入 path模块 提供了处理和转换路径的工具
var util = require('./libs/util');      // 引入 读写 access_token 的函数
var wechat_file = path.join(__dirname, './config/wechat.txt')   // 引入保存 access_token 的txt文件

var config = {  
    wechat: {   // 微信配置项
        appID: 'wx267b3b4aa9851cce',
        appSecret: 'af9e11478c1842914c87766e237821e3',
        token: 'huweitest',
        getAccessToken: function() { // 获取 token
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken: function(data) { // 保存 token
            data = JSON.stringify(data)
            return util.writeFileAsync(wechat_file, data)
        }
    }
}

module.exports = config