/* eslint valid-jsdoc: "off" */

'use strict'
const path = require('path')
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1588941501534_1051'

  // add your middleware config here
  config.middleware = ['errorHandler', 'tokenHandler']
  config.multipart = {
    mode: 'file',
    whitelist: () => true
  }
  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public')
  config.onerror = {
    all(err, ctx) {
      console.log('11111111111111')
      // 从 error 对象上读出各个属性，设置到响应中
      const status = err.status || 500
      let errorMsg = ''
      if (status === 422) {
        errorMsg = err.errors && err.errors[0] && `${err.errors[0].field} ${err.errors[0].message}`
      }
      // ⽣产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
      if (status === 500 && app.config.env === 'prod') {
        errorMsg = 'Internal Server Error'
      }
      ctx.helper.success({ ctx, ret: errorCode[status].ret, msg: errorMsg || errorCode[status].msg })
    }
  }
  config.mongoose = {
    url: process.env.EGG_MONGODB_URL || 'mongodb://127.0.0.1/website',
    options: {
      server: {
        poolSize: 40,
      },
      useUnifiedTopology: true
    }
  }
  config.security = {
    csrf:{
      enable: false,
    }
  }
  config.jwt = {
    secret: 'in2f54qw',
    enable: true, // default is false
    match: /^\/v1/ // optional
  }
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }

  return {
    ...config,
    ...userConfig
  }
}
