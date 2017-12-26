'use strict'

var config = require('./config')
var Wechat = require('./wechat/wechat')
var wechatApi = new Wechat(config.wechat) 

exports.reply = function* (next) {
    var message = this.weixin

    if (message.MsgType === 'event') { // 用户触发事件
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
        else if (message.Event === 'LOCATION') {
            this.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
        }
        else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey
        }
        else if (message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + ' ' + message.Ticket)
            this.body = '看到你扫了一下哦。'
        }
        else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        
    }
    else if (message.MsgType === 'text') { // 用户发来文本
        var content = message.Content
        var reply = '额，不知道你说的 “' + message.Content + '” 是什么'

        if (content === '1') { // 回复纯文本
            reply = '天下第一吃大米'
        }
        else if (content === '2') {
            reply = '天下第二吃豆腐'
        }
        else if (content === '3') {
            reply = '天下第三吃仙丹'
        }
        else if (content === '4') { // 回复图文
            reply = [
                {
                    title: '技术改变世界',
                    description: '这是句描述',
                    picUrl: 'https://v3download.om.cn/Uploads/Pic/2017-12-18/01e3d6d0-e3c1-11e7-ac22-357a035fb014.jpeg',
                    url: 'https://nodejs.org/'
                },
                {
                    title: '公众号二维码',
                    description: '这是还句描述',
                    picUrl: 'https://v3download.om.cn/Uploads/Pic/2017-12-19/572cbb30-e473-11e7-a771-995e32b228bb.jpeg',
                    url: 'https://www.om.cn/'
                }
            ]
        }
        else if (content === '5') { // 上传临时素材图片、回复图片
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/node.jpg')

            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        else if (content === '6') { // 上传临时素材视频、回复视频
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/images/wx_camera_1514090846138.mp4')

            reply = {
                type: 'video',
                title: '回复视频',
                description: '回复视频的描述',
                mediaId: data.media_id
            }
        }
        else if (content === '7') { // 上传临时封面图、回复音乐
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/qrcode.jpg')

            reply = {
                type: 'music',
                title: '回复音乐',
                description: '回复音乐的描述',
                musicUrl: 'http://sc1.111ttt.cn:8282/2017/1/11m/11/304112004168.m4a?tflag=1514212204&pin=2cf66dc5253c300f04a9bf75a900bdd7#.mp3',
                thumbMediaId: data.media_id
            }
        }
        else if (content === '8') { // 上传 永久素材需要 认证权限
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/node.jpg', {type: 'image'})

            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        else if (content === '9') { // 上传 永久素材需要 认证权限
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/images/wx_camera_1514090846138.mp4', {type: 'video', description: '{"title": "Really a nice place", "introduction": " Never think is so easy"}'})

            reply = {
                type: 'video',
                title: '回复视频',
                description: '回复视频的描述',
                mediaId: data.media_id
            }
        }
        else if (content === '10') { // 上传 永久素材需要 认证权限
            var pciData = yield wechatApi.uploadMaterial('image', __dirname + '/images/node.jpg', {})

            var media = {
                articles: [
                    {
                        title: 'tututu',
                        thumb_media_id: pciData.media_id,
                        author: 'huwei',
                        digest: '没有摘要',
                        show_cover_pic: 1,
                        content: '没有内容',
                        content_source_url: 'https://github.com'
                    },
                    {
                        title: 'tututu2',
                        thumb_media_id: pciData.media_id,
                        author: 'huwei',
                        digest: '没有摘要',
                        show_cover_pic: 1,
                        content: '没有内容',
                        content_source_url: 'https://github.com'
                    }
                ]
            }

            data = yield wechatApi.uploadMaterial('news', media, {})
            data = yield wechatApi.fetchMaterial(data.media_id, 'news', {})

            console.log(data)

            var items = data.news_item
            var news = []

            items.forEach(function(item) {
                news.push({
                    title: item.title,
                    description: item.digest,
                    picUrl: pciData.url,
                    url: item.url
                })
            })

            reply = news
        }
        else if (content === '11') { // 上传 永久素材需要 认证权限
            var counts = yield wechatApi.countMaterial()

            console.log(JSON.stringify(counts))

            var results = yield [
                wechatApi.batchMaterial({
                    type: 'image',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'video',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'voice',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'news',
                    offset: 0,
                    count: 10
                })
            ]
            console.log(JSON.stringify(results));

            reply = '1'
        }

        this.body = reply;
    }

    yield next
}