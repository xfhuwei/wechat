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
            // 用户同意上报地理位置后，每次进入公众号会话时，都会在进入时上报地理位置，上报地理位置以推送XML数据包到开发者填写的URL来实现。
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
        else if (content === '8') { // 上传 永久素材（需要认证权限） 回复图片
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/node.jpg', {type: 'image'})

            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        else if (content === '9') { // 上传 永久素材（需要认证权限） 回复视频
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/images/wx_camera_1514090846138.mp4', {type: 'video', description: '{"title": "Really a nice place", "introduction": " Never think is so easy"}'})

            reply = {
                type: 'video',
                title: '回复视频',
                description: '回复视频的描述',
                mediaId: data.media_id
            }
        }
        else if (content === '10') { // 上传临时素材、获取临时素材、回复图文列表
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
        else if (content === '11') { 
            var counts = yield wechatApi.countMaterial() // 获取 永久素材 总数量

            console.log(JSON.stringify(counts))

            var results = yield [
                wechatApi.batchMaterial({ // 获取 永久素材 列表
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

            reply = '已执行获取永久素材 总数量、列表 函数'
        }
        else if (content === '12') {
            // var group = yield wechatApi.createGroup('wechat3')
            // console.log('新分组 wechat3')
            // console.log(group)

            // var groups = yield wechatApi.fetchGroup()
            // console.log('加了 wechat3 后的分组列表')
            // console.log(groups)

            // var group2 = yield wechatApi.checkGroup(message.FromUserName)
            // console.log('查看自己的分组')
            // console.log(group2)

            // var result = yield wechatApi.moveGroup(message.FromUserName, 100)
            // console.log('移动到 100')
            // console.log(result)

            // var groups2 = yield wechatApi.fetchGroup()
            // console.log('移动后的分组列表')
            // console.log(groups2)

            // var result2 = yield wechatApi.moveGroup([message.FromUserName], 101)
            // console.log('移动到 101')
            // console.log(result2)

            // var groups3 = yield wechatApi.fetchGroup()
            // console.log('批量移动后的分组列表')
            // console.log(groups3)

            // var result3 = yield wechatApi.updateGroup(100, 'wechat100')
            // console.log('100 wechat 改名为 wechat100')
            // console.log(result3)

            // var groups4 = yield wechatApi.fetchGroup()
            // console.log('改名后的分组列表')
            // console.log(groups4)

            // var result4 = yield wechatApi.deleteGroup(100)
            // console.log('删除 100 wechat100分组')
            // console.log(result4)

            // var groups5 = yield wechatApi.fetchGroup()
            // console.log('删除 100 后的分组列表')
            // console.log(groups5)

            reply = '分组api测试，需解开注释'
        }
        else if (content === '13') {

            // var result = yield wechatApi.fetchUsers(message.FromUserName, '鲁班一号') // 设置备注
            // console.log(result)

            var user = yield wechatApi.fetchUsers(message.FromUserName, 'zh_CN') // 获取单个用户信息
            console.log(user)

            var openIds = [
                {
                    openid: message.FromUserName,
                    lang: 'en'
                }
            ]
            var users = yield wechatApi.fetchUsers(openIds) // 获取多个用户信息
            console.log(users)

            reply = JSON.stringify(user)
        }
        else if (content === '14') {
            var user = yield wechatApi.listUser() // 获取用户列表
            console.log(user)

            var user2 = yield wechatApi.listUser(user.next_openid)

            reply = JSON.stringify(user)
        }


        this.body = reply;
    }

    yield next
}