<template>
  <div class="login-container">
    <el-form ref="loginForm" label-width="100px" class="login-form" :model="form" :rules="rules" label-suffix=":">
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item prop="psw" label="密码">
        <el-input v-model="form.psw" type="password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <el-input v-model="form.captcha" type="text" placeholder="验证码" />
        <img :src="captchaUrl" alt="" class="captcha" @click="updateCaptcha" />
      </el-form-item>
      <el-form-item label="">
        <el-button type="primary" @click.native.prevent="submit">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
import { apiLogin } from './api'
import { setToken } from '@/utils/auth.js'
export default {
  layout: 'login',
  data() {
    return {
      form: {
        email: '1244207826@qq.com',
        psw: 'lan123',
        captcha: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        psw: { required: true, pattern: /^[\w-_]{6,12}$/g, message: '请输入密码', trigger: 'blur' },
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
      if (this.validate) {
        const payload = { ...this.form, psw: md5(this.form.psw) }
        const {
          data: { token = '' },
          head: { ret, msg = '登录失败' }
        } = await apiLogin(payload)
        if (ret !== 0) {
          return this.$message.error(msg)
        }
        await setToken(token)
        return this.$message.success(msg)
      }
    },
    validate() {
      this.$refs.loginForm.validate(valid => {
        if (valid) return true
        else return false
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
