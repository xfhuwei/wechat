'use strict'
// bluebird。 Promise是异步代码 实现控制流 的一种方式。 使代码干净、可读、健壮
var Promise = require('bluebird') 
// request模块让http请求变的更加简单。(作为客户端，去请求、抓取另一个网站的信息) 
var request = Promise.promisify(require('request')) 
var util = require('./util')
var fs = require('fs')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    upload: prefix + 'media/upload?',
    uploadPermPic: prefix + 'media/uploadimg?',
    uploadPermOrther: prefix + 'material/add_material?',
    uploadPermNews: prefix + 'material/add_news?',
    getTempMaterial: prefix + 'media/get?',
    getPermMaterial: prefix + 'material/get_material?',
    delPermMaterial: prefix + 'material/del_material'
}

function Wechat(opts) {
    var that = this
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken

    this.fetchAccessToken()
}

// 取 access_token
Wechat.prototype.fetchAccessToken = function() {  
    var that = this

    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {
            return Promise.resolve(this)
        }
    }

    return this.getAccessToken()
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
            return Promise.resolve(data)
        })
}

// 判断 access_token 是否在有效期内
Wechat.prototype.isValidAccessToken = function(data) { 
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

// 更新、获取 access_token
Wechat.prototype.updateAccessToken = function() { 
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

// 请求上传临时素材
Wechat.prototype.uploadTempMaterial = function(type, filepath) {  
    var that = this
    var form = {
        media: fs.createReadStream(filepath)
    }
     
    return new Promise(function(resolve, reject) {
        that.fetchAccessToken()
            .then(function(data) {
                var url = api.upload + '&access_token=' + data.access_token + '&type=' + type

                request({method: 'POST', url: url, formData: form, json: true}).then(function(response){
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Upload material fails')
                    }
                }) 
            })
            .catch(function(err) {
                reject(err)
            })
    })
}

// 请求上传永久素材 ****改
Wechat.prototype.uploadPermMaterial = function(type, filepath) {
    var that = this
    var form = {}
    var uploadUrl = ''

    if (type === 'pic') {
        uploadUrl = api.uploadPermPic
    } 
    if (type === 'other') {
        uploadUrl = api.uploadPermOther
    } 
    if (type === 'news') {
        uploadUrl = api.uploadPermNews
        form = filepath
    } else {
        form.media = fs.createReadStream(filepath)
    }

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken()
            .then(function(data) {
                var url = uploadUrl + 'access_token=' + data.access_token
                var opts = {
                    method: 'POST',
                    url: url,
                    json: true
                }
                if (type == 'news') {
                    opts.body = form
                } else {
                    opts.formData = form
                }
                request(opts).then(function(response) {
                    var _data = response.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('upload permanent material failed!')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
}

// 获取素材链接
Wechat.prototype.getMaterial = function(mediaId, permanent){
    var that = this;
    var getUrl = permanent ? api.getPermMaterial : api.getTempMaterial;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url = getUrl + 'access_token=' + data.access_token;
            if(!permanent) url += '&media_id=' + mediaId;
            resolve(url)
        });
    });
}

// 删除永久素材
Wechat.prototype.delMaterial = function(mediaId) {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.delPermMaterial + 'access_token=' + data.access_token
            var form = {media_id: mediaId}
            request({url: url, method: 'POST', json: true, formData: form})
                .then(function(response) {
                    var _data = response.body
                    if (_data.errcode === 0) {
                        resolve()
                    } else {
                        throw new Error('delete permanent material failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

// 修改永久素材、获取素材总数、获取素材列表 等未一一实现


// 响应微信
Wechat.prototype.reply = function() {
    var content = this.body
    var message = this.weixin
    var xml = util.tpl(content, message)

    this.status = 200
    this.type = 'application/xml'
    this.body = xml
}

module.exports = Wechat