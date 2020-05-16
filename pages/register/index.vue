<template>
  <div class="login-container">
    <el-form ref="registerForm" label-width="100px" class="login-form" :model="form" :rules="rules" label-suffix=":">
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" type="text" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item prop="psw" label="密码">
        <el-input v-model="form.psw" type="password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item prop="repsw" label="密码">
        <el-input v-model="form.repsw" type="password" placeholder="请再次输入密码" />
      </el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <el-input v-model="form.captcha" type="text" placeholder="验证码" />
        <img :src="captchaUrl" alt="" class="captcha" @click="updateCaptcha" />
      </el-form-item>
      <el-form-item label="">
        <el-button type="primary" @click.native.prevent="submit">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
import { apiRegister } from './api'
export default {
  layout: 'login',
  data() {
    const validateRePsw = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.form.psw) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      form: {
        email: '1244207826@qq.com',
        nickname: 'Lan',
        psw: 'lan123',
        repsw: 'lan123',
        captcha: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        psw: { required: true, pattern: /^[\w-_]{6,12}$/g, message: '请输入密码', trigger: 'blur' },
        repsw: { validator: validateRePsw, required: true, trigger: 'blur' },
        captcha: [
          { pattern: /^\w{4}$/, trigger: 'blur', message: '请输入正确的验证码' },
          { required: true, message: '请输入验证码' }
        ]
      },
      captchaUrl: '/api/captcha?_t' + Date.now()
    }
  },
  methods: {
    async submit() {
      console.log('111111111')
      if (this.validate) {
        const payload = { ...this.form, psw: md5(this.form.psw) }
        const {
          head: { ret, msg = '注册失败' }
        } = await apiRegister(payload)
        if (ret !== 0) {
          return this.$message.error(msg)
        }
        this.$alert(msg, '成功', {
          confirmButtonText: '去登录',
          callback: () => this.$router.push('/login')
        })
      }
    },
    validate() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          console.log(valid)
          return true
        } else {
          console.log(valid)
          return false
        }
      })
    },
    updateCaptcha() {
      this.captchaUrl = '/api/captcha?_t=' + Date.now()
    }
  }
}
</script>

<style lang="scss" scoped>
.captcha-container {
  position: relative;
  width: 400px;
  .captcha {
    position: absolute;
    top: -5%;
    right: -120px;
    width: 100px;
  }
}
</style>
