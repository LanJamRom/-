import { request } from '@/plugins/axios'

/**
 * 请求登录
 * @param {Object} payload 载荷
 */
export const apiLogin = async payload => {
  const { data } = await request.post('/user/login', payload)
  return data
}
