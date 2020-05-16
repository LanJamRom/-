'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  // 验证码
  router.get('/captcha', controller.utils.captcha)

  router.post('/v1/uploadFile', controller.test.uploadFile)
  router.post('/v1/mergeFile', controller.test.mergeFile)
  router.post('/v1/checkFile', controller.test.checkFile)
  router.group({ name: 'user', prefix: '/user' }, router => {
    const { info, register, login, vertify } = controller.user
    router.post('/register', register)
    router.post('/login', login)
    router.post('/info', info)
    router.post('/vertify', vertify)
  })
}
