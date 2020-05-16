'use strict'

const Service = require('egg').Service
const fse = require('fs-extra')
const path = require('path')
class Tools2Service extends Service {
  async mergeFile(filePath, size, hash) {
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, hash)
    const chunks = fse
      .readdirSync(chunkDir)
      .sort((a, b) => {
        return a.split('-').pop() - b.split('-').pop()
      })
      .map(cp => path.resolve(chunkDir, cp))
    await this.mergeChunks(chunks, filePath, size)
    await fse.rmdir(chunkDir)
    return filePath
  }

  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) =>
      new Promise(resolve => {
        const readStream = fse.createReadStream(filePath)
        readStream.on('end', () => {
          fse.unlinkSync(filePath)
          resolve()
        })
        readStream.pipe(writeStream)
      })
    await Promise.all(
      files.map((file, index) =>
        pipStream(
          file,
          fse.createWriteStream(dest, {
            start: index * size,
            end: (index + 1) * size
          })
        )
      )
    )
  }
}

module.exports = Tools2Service
