'use strict'

var sha1 = require('sha1');  // 加密模块
var getRawBody = require('raw-body') // 用于 解析 微信回传的xml
var Wechat = require('./wechat') 
var util = require('./util') 

module.exports = function(opts, handler) {  // 把方法暴露出去
    var wechat = new Wechat(opts)  // 实例化Wechat，为了获取access_token

    return function *(next) {      // 验证 微信信息
        console.log(this.query)

        var that = this
        var token = opts.token
        var signature = this.query.signature
        var nonce = this.query.nonce
        var timestamp = this.query.timestamp
        var echostr = this.query.echostr

        var str = [token, timestamp, nonce].sort().join('')
        var sha = sha1(str)

        if (this.method === 'GET') {
            if(sha === signature) {
                this.body = echostr + ''
            } else {
                this.body = 'wrong'
            }
        } else if (this.method === 'POST') {
            if(sha !== signature) {
                this.body = 'wrong'
                return false
            } 
            
            var data = yield getRawBody(this.req, { // 根据预期的长度和最大限制验证流的长度。理想的解析请求的身体
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            })
            // console.log(data.toString())

            var content = yield util.parseXMLAsync(data) // 解析 xml
            // console.log(content) 

            var message = util.formatMessage(content.xml) // 格式化

            console.log(message)

            that.weixin = message 

            yield handler.call(that, next)

            wechat.reply.call(that)
        }
    }
}