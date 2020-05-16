'use strict';
const md5 = require('md5')
const Service = require('egg').Service;
const HashSalt = "osdjne31,.12kckaw"

class UserService extends Service {
  /**
   * 注册
   * @param {Object} payload 载荷
   */
  async register(payload) {
    const { ctx } = this
    if(payload.captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      ctx.throw(533, '验证码错误')
    }
    if (await this.checkEmail(payload.email)) {
      ctx.throw(533, '该邮箱已被注册')
    }
    return await ctx.model.User.create({
      ...payload,
      psw: md5(payload.psw + HashSalt)
    })
  }

  /**
   * 请求登录
   * @param {Object} payload 载荷
   */
  async login(payload) {
    const { ctx } = this
    const { email, psw, captcha} = payload
    if(captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      ctx.throw(533, '验证码错误')
    }
    const user = await ctx.model.User.findOne({
      email,
      psw: md5(psw + HashSalt)
    })
    if (!user) ctx.throw(533, '用户名或密码错误')
    return { token: await this.service.actionToken.createToken(user._id)}
  }
  /**
   * 检查邮箱是否存在
   * @param {String} email
   */
  async checkEmail(email) {
    const { ctx } = this
    return await ctx.model.User.findOne({email})
  }
}

module.exports = UserService;
