import { request } from '@/plugins/axios'

export const apiUploadFile = async form => {
  const { data } = await request.post('/v1/uploadFile', form, {
    onUploadProgress: progress => {
      this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
    }
  })
  return data
}
