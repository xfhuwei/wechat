'use strict'
var Promise = require('bluebird') 
// bluebird。 Promise是异步代码 实现控制流 的一种方式。 使代码干净、可读、健壮
var Promise = require('bluebird') 
// request模块让http请求变的更加简单。(作为客户端，去请求、抓取另一个网站的信息) 
var request = Promise.promisify(require('request')) 

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential'
}

function Wechat(opts) {
    var that = this
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken

    this.getAccessToken()
        .then(function(data) { // 获取 access_token 后判断
            console.log(data)            
            try{
                data = JSON.parse(data)
            } catch(e) {
                return that.updateAccessToken()
            }

            if (that.isValidAccessToken(data)) {
                return Promise.resolve(data)
            } else {
                return that.updateAccessToken()
            }
        })
        .then(function(data) { // 判断后保存
            // console.log(data)
            that.access_token = data.access_token
            that.expires_in = data.expires_in

            that.saveAccessToken(data)
            // return Promise.resolve(data)
        })
}

Wechat.prototype.isValidAccessToken = function(data) { // 判断 access_token 是否在有效期内
    if (!data || !data.access_token || !data.expires_in) {
       return false
    }
    var access_token = data.access_token
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (now < expires_in) {
        return true
    } else {
        return false
    }
}

Wechat.prototype.updateAccessToken = function() { // 更新、获取 access_token
    var appID = this.appID
    var appSecret = this.appSecret
    // console.log(appSecret)
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret 

    return new Promise(function(resolve, reject) {
        // 请求微信接口 获取 access_token
        request({url: url, json: true}).then(function(response){
            var data = response[1]
            // var data = response.body
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000

            data.expires_in = expires_in

            resolve(data)
        }) 
    })
}

module.exports = Wechat