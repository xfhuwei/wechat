'use strict'

exports.reply = function* (next) {
    var message = this.weixin

    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            // 此处不知为何 搜索关注和扫二维码关注都有 EventKey 但为 ''
            if (message.EventKey) {
                console.log('扫二维码进来：' + message.EventKey + ' ' + message.ticket)
            }

            this.body = '哈哈，你订阅了这个号'
        }
        else if (message.Event === 'unsubscribe') {
            console.log('无情取关')
            this.body = ''
        }
        
    }
    else {

    }

    yield next
}