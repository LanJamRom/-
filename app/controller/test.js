'use strict'

const Controller = require('egg').Controller
const fse = require('fs-extra')
const path = require('path')

class TestController extends Controller {
  async uploadFile() {
    const { ctx } = this
    // if (Math.random() > 0.6) {
    //   ctx.throw(534)
    // }
    const file = ctx.request.files[0]
    const { hash, name } = ctx.request.body

    // 读取当前hash的文件是否存在，不存在则创建
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    if (!fse.existsSync(chunkPath)) await fse.mkdir(chunkPath)

    // 将上传上来的切片移动到chunkPath下
    await fse.move(file.filepath, `${chunkPath}/${name}`)

    ctx.helper.success({ ctx })
  }

  async mergeFile() {
    const { ctx } = this
    const { ext, hash, size } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    const res = await ctx.service.tools2.mergeFile(filePath, size, hash)
    ctx.helper.success({ ctx, res })
  }

  async checkFile() {
    const { ctx } = this
    const { hash, ext } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) uploaded = true
    else uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash))

    const res = { uploaded, uploadedList }
    ctx.helper.success({ ctx, res })
  }

  async getUploadedList(dirPath) {
    return fse.existsSync(dirPath) ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.') : []
  }
}

module.exports = TestController
