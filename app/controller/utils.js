'use strict'
const svgCaptcha = require('svg-captcha')
const fse = require('fs-extra')
const path = require('path')
const Controller = require('egg').Controller

class UtilController extends Controller {
  async captcha() {
    const { ctx } = this
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      noise: 3
    })
    ctx.session.captcha = captcha.text
    ctx.response.type = 'image/svg+xml'
    ctx.body = captcha.data
  }

  async uploadFile() {
    const { ctx } = this
    if (Math.random() > 0.3) {
      ctx.throw(534)
    }
    const file = ctx.request.files[0]
    const { hash, name } = ctx.request.body
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    // const filePath = path.resolve() // 文件最终存储的位置。合并之后的

    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }

    await fse.move(file.filepath, `${chunkPath}/${name}`)
    ctx.helper.success({ctx})
  }

  async mergeFile() {
    const { ctx } = this
    const { ext, size, hash} = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.tools.mergeFile(filePath, size, hash)
    const res = `/public/${hash}.${ext}`
    ctx.helper.success({ctx, res})
  }

  async checkFile() {
    const { ctx } = this
    const { exp, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${exp}`)

    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) {
      // 文件存在
      uploaded = true
    } else {
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash))
    }
    const res = { uploaded, uploadedList}
    ctx.helper.success({ctx, res})
  }

  async getUploadedList(dirPath) {
    return fse.existsSync(dirPath) ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.') : []
  }
}

module.exports = UtilController
