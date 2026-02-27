import type { R2Bucket } from '@cloudflare/workers-types'

export const uploadFile = async (
  bucket: R2Bucket,
  key: string,
  content: string
) => {
  await bucket.put(key, content, {
    httpMetadata: {
      contentType: 'application/javascript',
    },
  })
}

export const getFile = async (
  bucket: R2Bucket,
  key: string
) => {
  const object = await bucket.get(key)
  if (!object) return null
  return await object.text()
}

export const deleteFile = async (
  bucket: R2Bucket,
  key: string
) => {
  await bucket.delete(key)
}

export const listFiles = async (
  bucket: R2Bucket,
  prefix: string
) => {
  const objects = await bucket.list({ prefix })
  return objects.objects.map(obj => obj.key)
}