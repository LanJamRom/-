'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async login() {
    const rule = {
      email: { required: true, type: 'email' },
      psw: {required: true, type: 'string'},
      captcha: {required: true, type: 'string'}
    }
    const { ctx } = this
    ctx.validate(rule)
    const payload = ctx.request.body
    const res = await ctx.service.user.login(payload)
    ctx.helper.success({ctx, res, msg: '登录成功'})
  }

  async register() {
    const rule = {
      email: { required: true, type: 'email' },
      nickname: { type: 'string' },
      psw: {required: true, type: 'string'},
      captcha: {required: true, type: 'string'}
    }
    const { ctx } = this
    ctx.validate(rule)
    const payload = ctx.request.body
    await ctx.service.user.register(payload)
    ctx.helper.success({ctx, msg: '注册成功'})
  }

  async vertify() {

  }

  async info() {

  }
}

module.exports = UserController;
