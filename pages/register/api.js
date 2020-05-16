import { request } from '@/plugins/axios'

/**
 * 请求注册
 * @param {Object} payload 载荷
 */
export const apiRegister = async payload => {
  const { data } = await request.post('/user/register', payload)
  return data
}
