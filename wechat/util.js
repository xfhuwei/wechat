'use strict'

var xml2js = require('xml2js')  // 简单的XML到JavaScript对象转换器。
var Promise = require('bluebird')
var tpl = require('./tpl')

exports.parseXMLAsync = function(xml) { // 异步解析XML
    return new Promise(function(resolve, reject) {
        xml2js.parseString(xml, {trim: true}, function(err, content) {
            if (err) reject(err)
            else resolve(content)
        })
    })
}

function formatMessage(result) { // 格式化 结果对象
    var message = {}

    if (typeof result === 'object') {
        var keys = Object.keys(result)

        for (var i = 0; i < keys.length; i++) {
            var item = result[keys[i]]
            var key = keys[i]

            if (!(item instanceof Array) || item.length === 0) {
                continue
            } 
            if (item.length === 1) {
                var val = item[0]

                if (typeof val === 'object') {
                    message[key] = formatMessage(val)
                } else {
                    message[key] = (val || '').trim()
                }
            } else {
                message[key] = []
                for (var j = 0, k = item.length; j < k; j++ ) {
                    message[key].push(formatMessage(item[j]))
                }
            }
        }
    }

    return message
}

exports.formatMessage = formatMessage

exports.tpl = function(content, message) { // 整理回复信息
    var info = {}
    var type = 'text'
    var fromUserName = message.FromUserName
    var toUserName = message.ToUserName

    if (Array.isArray(content)) { // 如果回复内容为数组， 这回复类型为图文模式
        type = 'news'
    }
    type = content.type || type

    info.content = content
    info.createTime = new Date().getTime()
    info.msgType = type
    info.toUserName = fromUserName
    info.fromUserName = toUserName

    return tpl.compiled(info)
}