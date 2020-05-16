'use strict'
// 服务端⾃身的处理逻辑错误(包含框架错误500 及 ⾃定义业务逻辑错误533开始 ) 客户端请求参数导致的错误(4xx开始)，设置不同的状态码
const errorCode = require('../common/errorCode')
module.exports = (option, app) => {
  return async function (ctx, next) {
    try {
      await next()
    } catch (err) {
      // 所有的异常都在 app 上触发⼀个 error 事件，框架会记录⼀条错误⽇志
      app.emit('error', err, this)
      // 从 error 对象上读出各个属性，设置到响应中
      const status = err.status || 500
      let errorMsg = err.message || ''

      // egg-validate参数校验失败
      if (status === 422) {
        errorMsg = err.errors && err.errors[0] && `${err.errors[0].field} ${err.errors[0].message}`
        // errorMsg = err.errors && err.errors[0] && `${err.errors[0].field} field ${err.message}`.toLowerCase()
      }

      // ⽣产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
      if (status === 500 && app.config.env === 'prod') {
        errorMsg = 'Internal Server Error'
      }

      // 自定义业务处理逻辑>533开始
      if ( status >= 533) {
        errorMsg = errorCode[status].msg
      }
      ctx.helper.success({ ctx, ret: errorCode[status].ret, msg: errorMsg || errorCode[status].msg })
    }
  }
}