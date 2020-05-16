// eslint-disable-next-line import/order
import { getToken, removeToken } from '@/utils/auth'
import axios from 'axios'
import { MessageBox } from 'element-ui'
import Vue from 'vue'
const service = axios.create({
  baseURL: '/api'
})

export default ({ store, redirect }) => {
  // 请求拦截
  service.interceptors.request.use(config => {
    const token = getToken()
    if (token) {
      config.headers.common.Authorization = 'Bearer ' + token
    }
    return config
  })
  // 响应拦截

  service.interceptors.response.use(response => {
    const {
      data: {
        head: { ret }
      }
    } = response
    console.log(response)
    if (ret === 2) {
      MessageBox.confirm('登录已过期', '过期', {
        confirmButtonText: '登录',
        showCancelButton: false,
        type: 'warning'
      }).then(() => {
        removeToken()
        redirect({ path: '/login' })
      })
    }
    return response.data
  })
}

Vue.prototype.$http = service

export const request = service
