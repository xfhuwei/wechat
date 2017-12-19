'use strict'

var Koa = require('koa');
var path = require('path')
var wechat = require('./wechat/g');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt')
var config = {
    wechat: {
        appID: 'wx267b3b4aa9851cce',
        appSecret: 'af9e11478c1842914c87766e237821e3',
        token: 'huweitest',
        getAccessToken: function() {
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken: function(data) {
            data = JSON.stringify(data)
            return util.writeFileAsync(wechat_file, data)
        }
    }
}

var app = new Koa()

app.use(wechat(config.wechat))

app.listen(8080)
console.log('Listening: 8080')