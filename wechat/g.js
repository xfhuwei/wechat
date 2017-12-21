'use strict'

var sha1 = require('sha1');  // 加密模块
var getRawBody = require('raw-body')
var Wechat = require('./wechat') 
var util = require('./util') 

module.exports = function(opts) {  // 把方法暴露出去
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
            
            var data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            })
            // console.log(data.toString())

            var content = yield util.parseXMLAsync(data)
            console.log(content) 

            var message = util.formatMessage(content.xml)

            console.log(message)

            if (message.MsgType === 'event') {
                if (message.Event === 'subscribe') {
                    var now = new Date().getTime()

                    that.status = 200
                    that.type = 'application/xml'
                    that.body = '<xml>' + 
                    '<ToUserName><![CDATA['+ message.FromUserName +']]></ToUserName>' +
                    '<FromUserName><![CDATA['+ message.ToUserName +']]></FromUserName>' +
                    '<CreateTime>'+ now +'</CreateTime>' +
                    '<MsgType><![CDATA[text]]></MsgType>' +
                    '<Content><![CDATA[春城是傻逼]]></Content>' +
                    '</xml>';

                    console.log(that.body)
                    return
                }
            }
        }
        
    }
}