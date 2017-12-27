'use strict'
// bluebird。 Promise是异步代码 实现控制流 的一种方式。 使代码干净、可读、健壮
var Promise = require('bluebird') 
// Lodash 就是一套工具库，它内部封装了诸多对字符串、数组、对象等常见数据类型的处理函数
var _ = require('lodash')
// request模块让http请求变的更加简单。(作为客户端，去请求、抓取另一个网站的信息) 
var request = Promise.promisify(require('request')) 
var util = require('./util')
var fs = require('fs')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: { // 临时素材
        upload: prefix + 'media/upload?', 
        fetch: prefix + 'media/get?'
    },
    permanent: { // 永久素材
        upload: prefix + 'material/add_material?',
        fetch: prefix + 'material/get_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?',
        del: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?',
    },
    group: {
        create: prefix + 'groups/create?',
        fetch: prefix + 'groups/get?',
        check: prefix + 'groups/getid?',
        update: prefix + 'groups/update?',
        move: prefix + 'groups/members/update?',
        batchupdate: prefix + 'groups/members/batchupdate?',
        del: prefix + 'groups/delete?',

    },
    user: {
        remark: prefix + 'user/info/updateremark?', // 此接口暂时开放给微信认证的服务号
        fetch: prefix + 'user/info?',
        batchFetch: prefix + 'user/info/batchget?',
    }
    /* user: { // 用户管理相关
        tags: {
            create: prefix + 'tags/create?',
            get: prefix + 'tags/get?',
            update: prefix + 'tags/update?',
            del: prefix + 'tags/delete?',
            getUser: prefix + 'user/tag/get?',
            userSet: prefix + 'tags/members/batchtagging?',
            userRemove: prefix + 'tags/members/batchuntagging?',
            getUserTags: prefix + 'tags/getidlist?'
        },
        remark: prefix + 'user/info/updateremark?',
        info: prefix + 'user/info?',   // access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN
        list: prefix + 'user/get?',    // access_token=ACCESS_TOKEN&next_openid=NEXT_OPENID
        back:{
            list: prefix + 'tags/members/getblacklist?',
            set: prefix + 'tags/members/batchblacklist?',
            setCancel: prefix + 'tags/members/batchunblacklist?',
        }
    } */
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


/****** 素材管理相关 ******/
// 请求上传 临时/永久 素材
Wechat.prototype.uploadMaterial = function(type, material, permanent) {  
    var that = this
    var form = {}
    var uploadUrl = api.temporary.upload  // 默认上传临时

    if (permanent) {  // 如果有此参数则为 上传永久
        uploadUrl = api.permanent.upload 
        _.extend(form, permanent)  // 将 permanent 合并到 permanent
    }
    if (type === 'pic') { 
        uploadUrl = api.permanent.uploadNewsPic
    }
    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews
        form = material
    } else {
        form.media =  fs.createReadStream(material)
    }

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = uploadUrl + 'access_token=' + data.access_token
            if (!permanent) {
                url += '&type=' + type
            } else {
                form.access_token = data.access_token
            }

            var options = {
                method: 'POST',
                url: url,
                json: true
            }

            if (type === 'news') {
                options.body = form
            } else {
                options.formData = form
            }

            request(options).then(function(response){
                var _data = response[1]
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('Upload material fails')
                }
            }).catch(function(err) {
                reject(err)
            })  
        })
    })
}

// 获取 （临时、永久）素材
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent){
    var that = this
    var fetchUrl = api.temporary.fetch  // 默认临时

    if (permanent) {
        fetchUrl = api.permanent.fetch
    }

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId
            var form = {}
            var options = {url: url, method: 'POST', json: true}
            if (permanent) {
                form.media_id = mediaId,
                form.access_token = data.access_token
                options.body = form
            } else {
                if (type === 'video') { // video 不支持https
                    url = url.replace('https://', 'http://') 
                }
                url += '&media_id=' + mediaId
            }

            if (type === 'news' || type === 'video') { // 若是图文列表或视频 需请求获取
                request(options).then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch permanent material failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
            } else {
                resolve(url)
            }    
        })
    })
}

// 删除永久素材 
Wechat.prototype.deleteMaterial = function(mediaId) {
    var that = this
    var form = {media_id: mediaId} // 删除永久素材只需 media_id
    
    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId
            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
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

// 更新永久素材
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var that = this
    var form = {media_id: mediaId}

    _.extend(form, news) // 合并
    
    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId
            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('update permanent material failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

// 获取素材总数
Wechat.prototype.countMaterial = function() {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.permanent.count + 'access_token=' + data.access_token 
            request({url: url, method: 'GET', json: true})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('count permanent material failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

// 获取素材列表
Wechat.prototype.batchMaterial = function(options) {
    var that = this

    options.type = options.type || 'image'  // 需获取的类型
    options.offset = options.offset || 0    // 偏移量，即从第几个开始获取
    options.conut = options.count || 1      // 需获取的数量

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.permanent.batch + 'access_token=' + data.access_token 
            request({url: url, method: 'POST', body: options, json: true})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('batch permanent material failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}


/****** 用户管理相关 ******/
// 创建分组标签
Wechat.prototype.createGroup = function(name) {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.group.create + 'access_token=' + data.access_token 
            var form = {
                group: {
                    name: name
                }
            }
            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Create group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

Wechat.prototype.fetchGroup = function() {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.group.fetch + 'access_token=' + data.access_token 
            
            request({url: url, method: 'GET', json: true})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

Wechat.prototype.checkGroup = function(openid) {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.group.check + 'access_token=' + data.access_token 
            var form = {
                openid: openid
            }

            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('check group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

Wechat.prototype.updateGroup = function(id, name) {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.group.update + 'access_token=' + data.access_token 
            var form = {
                group: {
                    id: id,
                    name: name
                }
            }

            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('update group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

Wechat.prototype.batchMoveGroup = function(openids, to) {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            if (_.isArray(openids)) {
                var url = api.group.batchupdate + 'access_token=' + data.access_token 
                var form = {
                    openid_list: openids,
                    to_groupid: to
                }
            } else {
                var url = api.group.move + 'access_token=' + data.access_token 
                var form = {
                    openid: openids,
                    to_groupid: to
                }
            }
            
            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('batchMove group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}

Wechat.prototype.deleteGroup = function(id) {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetchAccessToken().then(function(data) {
            var url = api.group.del + 'access_token=' + data.access_token 
            var form = {
                group: {
                    id: id 
                }
            }

            request({url: url, method: 'POST', json: true, body: form})
                .then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('delete group failed!')
                    }
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    })
}



/******* 回答 *******/
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