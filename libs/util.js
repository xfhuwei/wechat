'use strict'

var fs = require('fs')  // fs 模块用于对 系统文件 及 目录 进行读写操作
var Promise = require('bluebird')   // bluebird 模块 是异步代码实现控制流的一种方式

exports.readFileAsync = function(fpath, encoding) { // 暴露出 读文件 方法
    return new Promise(function(resolve, reject) {
        fs.readFile(fpath, encoding, function(err, content) {
            if (err) reject(err)
            else resolve(content)
        })
    })
}

exports.writeFileAsync = function(fpath, content) { // 暴露出 写文件 方法
    return new Promise(function(resolve, reject) {
        fs.writeFile(fpath, content, function(err) {
            if (err) reject(err)
            else resolve()
        })
    })
}