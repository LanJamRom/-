<template>
  <div class="content">
    <h1>用户中心</h1>
    <i class="el-icon-loading" />
    <div id="drag" ref="drag">
      <input type="file" name="file" @change="handleFilerChange" />
    </div>
    <div>
      <!-- <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress" /> -->
    </div>
    <el-button type="primary" @click="uploadFile">上传</el-button>
    <div>
      <p>计算hash的进度</p>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="hashProgress" />
    </div>
    <div>
      <div class="cube-container" :style="{ width: cubeWidth + 'px' }">
        <div v-for="chunk in chunks" :key="chunk.name" class="cube">
          <div
            :class="{
              uploading: chunk.progress > 0 && chunk.progress < 100,
              success: chunk.progress === 100,
              error: chunk.progress < 0
            }"
            :style="{ height: chunk.progress + '%' }"
          >
            <i v-show="chunk.progress < 100 && chunk.progress > 0" class="el-icon-loading" style="color: #f56c6c;" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { apiUploadFile } from './api'
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = Number((0.1 * 1024 * 1024).toFixed(0))
export default {
  data() {
    return {
      file: null,
      // uploadProgress: 0,
      chunks: [],
      hashProgress: 0,
      hash: null
    }
  },
  computed: {
    cubeWidth() {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16
    },
    uploadProgress() {
      if (!this.file || !this.chunks.length) {
        return 0
      }
      const loaded = this.chunks.map(item => item.chunk.size * item.progress).reduce((acc, cur) => acc + cur, 0)
      return parseInt(((loaded * 100) / this.file.size).toFixed(2))
    }
  },
  mounted() {
    this.bindEvents()
  },
  methods: {
    bindEvents() {
      const drag = this.$refs.drag
      drag.addEventListener('dragover', e => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })
      drag.addEventListener('dragleave', e => {
        drag.style.borderColor = 'gray'
        e.preventDefault()
      })
      drag.addEventListener('drop', e => {
        const [file] = e.dataTransfer.files
        this.file = file
        e.preventDefault()
      })
    },
    handleFilerChange(e) {
      const [file] = e.target.files
      if (!file) return
      this.file = file
    },
    blogToString(blob) {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.readAsBinaryString(blob)
        reader.onload = e => {
          const ret = reader.result
            .split('')
            .map(v => v.charCodeAt()) // 转换为unicode编码
            .map(v => v.toString(16).toUpperCase()) // 转换为16进制
            .map(v => v.padStart(2, '0')) // 前两位若不全 补足0
            .join(' ')
          resolve(ret)
        }
      })
    },
    async isGif(file) {
      // GIF89a/GIF87a
      // 前面6个16进制, '47 49 46 38 39 61' / '47 49 46 38 37 61'
      // 16进制转换
      const ret = await this.blogToString(file.slice(0, 6))
      return ret === '47 49 46 38 39 61' || ret === '47 49 46 38 37 61'
    },
    async isPng(file) {
      // 前8个16进制 '89 50 4E 47 0D 0A 1A 0A'
      const ret = await this.blogToString(file.slice(0, 8))
      return ret === '89 50 4E 47 0D 0A 1A 0A'
    },
    async isJpg(file) {
      // 开头2个16进制 'FF D8' 结尾2个16进制 'FF D9'
      const len = file.size
      const start = await this.blogToString(file.slice(0, 2))
      const tail = await this.blogToString(file.slice(-2, len))
      return start === 'FF D8' && tail === 'FF D9'
    },
    async isImage(file) {
      return (await this.isGif(file)) || (await this.isPng(file)) || (await this.isJpg(file))
    },

    createFileChunk(file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < this.file.size) {
        chunks.push({ index: cur, file: this.file.slice(cur, cur + size) })
        cur += size
      }
      return chunks
    },
    calculateHashWorker() {
      return new Promise(resolve => {
        const worker = new Worker('/hash2.js')
        worker.postMessage({ chunks: this.chunks })
        worker.onmessage = e => {
          const { progress, hash } = e.data
          // this.hashProgress = Number(progress.toFixed(2)) // 计算hash进度条
          if (hash) {
            // 计算完成
            resolve(hash)
          }
        }
      })
    },
    calculateHashIdle() {
      const chunks = this.chunks
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer()
        let count = 0
        const appendToSpark = file => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = e => {
              spark.append(e.target.result)
              resolve()
            }
          })
        }
        const workLoop = async deadline => {
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            await appendToSpark(chunks[count].file)
            count++
            if (count < chunks.length) {
              // this.hashProgress = Number(((100 * count) / chunks.length).toFixed(2))
            } else {
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        window.requestIdleCallback(workLoop)
      })
    },
    calculateHashSample() {
      // 布隆过滤器
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()
        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024
        // 第一个2M，最后一个区块数据全要
        const chunks = [file.slice(0, 2)]
        let cur = offset
        while (cur < size) {
          // 最后一个区块
          if (cur + offset >= size) {
            chunks.push(file.slice(cur, cur + offset))
          } else {
            // 中间的区块
            const mid = cur + offset / 2
            const end = cur + offset
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        // 中间的，取前中后各两个字节
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = e => {
          spark.append(e.target.result)
          // this.hashProgress = 100
          resolve(spark.end())
        }
      })
    },
    async uploadChunks(uploadedList) {
      const requests = this.chunks
        .filter(chunk => !uploadedList.includes(chunk.name))
        .map((chunk, index) => {
          // 转成promise
          const form = new FormData()
          form.append('chunk', chunk.chunk)
          form.append('name', chunk.name)
          // form.append('index', chunk.index)
          form.append('hash', chunk.hash)
          return { form, index: chunk.index, error: 0 }
        })
      // .map(({ form, index }) =>
      //   this.$http.post('/v1/uploadFile', form, {
      //     onUploadProgress: progress => {
      //       // 不是整体的进度条，而是每个区块有自己的进度条，整体的进度条需要重新计算
      //       this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
      //     }
      //   })
      // )
      // TODO: 并发量的控制
      // 尝试申请tcp连接过多，也会造成卡顿
      // await Promise.all(requests)
      await this.sendRequest(requests)
      await this.mergeRequest()
    },
    // 上传可能报错，进度条变红，开始重试
    // 一个切片最多重试失败三次，整体全部终止
    sendRequest(chunks, limit = 4) {
      // 并发数的控制
      // 核心：一个数组长度为limit [task1, task2, taks3, task4]
      return new Promise((resolve, reject) => {
        const len = chunks.length
        let count = 0
        let isStop = false
        const start = async () => {
          // stop为true，直接终止所有任务
          if (isStop) return
          const task = chunks.shift()
          if (task) {
            const { form, index } = task
            const { data: { head: { ret } = {} } = {} } = await this.$http.post('/v1/uploadFile', form, {
              onUploadProgress: progress => {
                // 不是整体的进度条，而是每个区块有自己的进度条，整体的进度条需要重新计算
                this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
              }
            })
            if (ret === 18) {
              this.chunks[index].progress = -1
              if (task.error < 3) {
                // 重试次数 + 1    将当前的task重新放入chunks最前面并重新开始请求
                task.error++
                chunks.unshift(task)
                start()
              } else {
                // 错误重试三次
                isStop = true
                // eslint-disable-next-line prefer-promise-reject-errors
                reject()
              }
            }
            if (ret === 0) {
              if (count === len - 1) {
                // 最后一个任务结束了
                resolve()
              } else {
                count++
                // 启动下一个任务
                start()
              }
            }
          }
        }
        while (limit > 0) {
          start()
          limit -= 1
        }
      })
    },

    mergeRequest() {
      this.$http.post('/v1/mergeFile', {
        ext: this.file.name.split('.').pop(),
        size: CHUNK_SIZE,
        hash: this.hash
      })
    },
    async uploadFile() {
      if (!this.file) return
      if (Math.random() > 0.5) {
        // 报错
      }
      // if (await this.isImage(this.file)) {
      //   console.log('文件校验通过')
      // } else {
      //   return console.log('文件格式不正确')
      // }
      const chunks = this.createFileChunk(this.file)
      // const hash = await this.calculateHashWorker()
      // const hash2 = await this.calculateHashIdle()
      this.hash = await this.calculateHashSample()

      // 向后端查询，文件是否上传过，如果没有，是否存在切片
      const { data: { data: { uploaded, uploadedList } } = {} } = await this.$http.post('/v1/checkFile', {
        hash: this.hash,
        ext: this.file.name.split('.').pop()
      })
      if (uploaded) {
        // 秒传
        return this.$message.success('秒传成功')
      }
      this.chunks = chunks.map((chunk, index) => {
        // 切片的名字
        const name = this.hash + '-' + index
        return {
          hash: this.hash,
          name,
          index,
          chunk: chunk.file,
          progress: uploadedList.includes(name) ? 100 : 0
        }
      })
      await this.uploadChunks(uploadedList)
      // console.log('hash:', hash)
      // console.log('hash:', hash2)
      // console.log('hash:', hash3)
      // const form = new FormData()
      // form.append('name', 'file')
      // form.append('file', this.file)
      // const { data: { head: { ret, msg } = {} } = {} } = await this.$http.post('/v1/uploadFile', form, {
      //   onUploadProgress: progress => {
      //     this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
      //   }
      // })
      // if (ret !== 0) return this.$message.error(msg)
    }
  }
}
</script>

<style lang="scss" scoped>
// .content {
//   width: 200px;
//   height: 500px;
//   margin: 0 auto;
// }
#drag {
  line-height: 200px;
  text-align: center;
  vertical-align: middle;
  border: 2px dashed gray;
}
.cube-container {
  .cube {
    float: left;
    width: 14px;
    height: 14px;
    line-height: 14px;
    background-color: #eeeeee;
    border: 1px solid black;
    & > .success {
      background-color: green;
    }
    & > .uploading {
      background-color: blue;
    }
    & > .error {
      background-color: red;
    }
  }
}
</style>
