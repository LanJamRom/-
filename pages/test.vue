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
      <!-- <el-progress :stroke-width="20" :text-inside="true" :percentage="workHashProgress" style="margin-bottom: 10px;" /> -->
      <!-- <el-progress :stroke-width="20" :text-inside="true" :percentage="idleHashProgress" /> -->
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
    <p>上传进度</p>
    <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress" />
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = Number((0.1 * 1024 * 1024).toFixed(0))
export default {
  data() {
    return {
      file: null,
      chunks: [],
      workHashProgress: 0,
      idleHashProgress: 0,
      hash: null
    }
  },
  computed: {
    cubeWidth() {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16
    },
    uploadProgress() {
      if (!this.file || !this.chunks.length) return 0
      const loaded = this.chunks.map(item => item.chunk.size * (item.progress / 100)).reduce((acc, cur) => acc + cur, 0)
      console.log(loaded)
      return Number(((loaded * 100) / this.file.size).toFixed(2))
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
        drag.style.borderColor = 'baclk'
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
    createFileChunk(file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < file.size) {
        chunks.push({ index: cur, file: file.slice(cur, cur + size) })
        cur += size
      }
      return chunks
    },
    calculateHashSample() {
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()
        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024
        // 取第一个区块2M，最后一个区块全部数据
        const chunks = [file.slice(0, offset)]
        let cur = offset
        while (cur < size) {
          // 判断是否为最后一个区块
          if (cur + offset >= size) {
            chunks.push(file.slice(cur, cur + offset))
          } else {
            // 中间的区块：取前中后各2字节
            const mid = (cur + offset) / 2
            const end = cur + offset
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = e => {
          spark.append(e.target.result)
          resolve(spark.end())
        }
      })
    },
    // 上传切片前，拼装form
    async uploadChunks(uploadedList) {
      const requests = this.chunks
        .filter(chunk => !uploadedList.includes(chunk.name))
        .map(chunk => {
          const form = new FormData()
          form.append('name', chunk.name)
          form.append('hash', chunk.hash)
          form.append('file', chunk.chunk)
          return { form, index: chunk.index, error: 0 }
        })
      // 解决多并发造成浏览器卡顿的问题
      await this.sendRequest(requests)
      // 执行切片合并, 返回文件最终处理结果
      await this.mergeRequest()
    },
    // 上传切片（断点续传）
    // TODO: 上传可能失败(进度变红)，每个切片重试三次，全部失败结束全部
    sendRequest(chunks, limit = 3) {
      // 对并发数进行控制
      return new Promise((resolve, reject) => {
        const len = chunks.length
        let count = 0
        let isStop = false
        const start = async () => {
          if (isStop) return
          const task = chunks.shift()
          if (task) {
            const { form, index } = task
            const { head: { ret } = {} } = await this.$http.post('/v1/uploadFile', form, {
              onUploadProgress: progress => {
                this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
              }
            })
            if (ret !== 0) {
              this.chunks[index].progress = -1
              if (task.error < 3) {
                chunks.unshift(task)
                task.error++
                // 重新发起请求
                start()
              } else {
                // 重试次数已达到三次，中断全部上传
                isStop = true
                // eslint-disable-next-line prefer-promise-reject-errors
                reject()
              }
            } else if (count === len - 1) {
              // 图片已全部上传完毕
              resolve()
            } else {
              count++
              // 开始下一个任务
              start()
            }
          }
        }
        while (limit > 0) {
          start()
          limit--
        }
      })
    },
    async mergeRequest() {
      const {
        data,
        head: { ret }
      } = await this.$http.post('/v1/mergeFile', {
        ext: this.file.name.split('.').pop(),
        hash: this.hash,
        size: CHUNK_SIZE
      })
      if (ret === 0) return this.$message.success(data)
    },
    async uploadFile() {
      if (!this.file) return
      // 创建切片
      const chunks = await this.createFileChunk(this.file)

      // 创建抽样哈希
      this.hash = await this.calculateHashSample()

      // 检测后端是否已上传过文件/切片
      const {
        data: { uploaded = false, uploadedList = [] }
      } = await this.$http.post('/v1/checkFile', {
        hash: this.hash,
        ext: this.file.name.split('.').pop()
      })
      if (uploaded) return this.$message.success('秒传成功')
      // 对切片进行格式化
      this.chunks = chunks.map((chunk, index) => {
        const name = this.hash + '-' + index
        return {
          name,
          index,
          hash: this.hash,
          chunk: chunk.file,
          progress: uploadedList.includes(name) ? 100 : 0
        }
      })
      // 执行切片上传
      await this.uploadChunks(uploadedList)
    }
  }
}
</script>

<style lang="scss" scoped>
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
