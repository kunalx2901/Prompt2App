import { Hono } from 'hono'
import { uploadFile, getFile, deleteFile, listFiles } from '../storage/r2'
import type { Bindings } from '../types/bindings'

const files = new Hono<{ Bindings: Bindings }>()

// Upload file
files.post('/:projectId', async (c) => {
  const user = c.get('user')
  const { filename, content } = await c.req.json()
  const { projectId } = c.req.param()

  const key = `${user.id}/${projectId}/files/${filename}`

  await uploadFile(c.env.PROMPT2APP_STORAGE, key, content)

  return c.json({ success: true })
})

// List files
files.get('/:projectId', async (c) => {
  const user = c.get('user')
  const { projectId } = c.req.param()

  const prefix = `${user.id}/${projectId}/files/`

  const files = await listFiles(c.env.PROMPT2APP_STORAGE, prefix)

  return c.json({ files })
})

// Get file
files.get('/:projectId/:filename', async (c) => {
  const user = c.get('user')
  const { projectId, filename } = c.req.param()

  const key = `${user.id}/${projectId}/files/${filename}`

  const file = await getFile(c.env.PROMPT2APP_STORAGE, key)

  if (!file) return c.json({ error: 'File not found' }, 404)

  return c.text(file)
})

// Delete file
files.delete('/:projectId/:filename', async (c) => {
  const user = c.get('user')
  const { projectId, filename } = c.req.param()

  const key = `${user.id}/${projectId}/files/${filename}`

  await deleteFile(c.env.PROMPT2APP_STORAGE, key)

  return c.json({ success: true })
})

files.post('/dev/:projectId', async (c) => {
  const { filename, content } = await c.req.json()
  const { projectId } = c.req.param()

  const userId = "user_test123"

  const key = `${userId}/${projectId}/files/${filename}`

  await uploadFile(c.env.PROMPT2APP_STORAGE, key, content)

  return c.json({ success: true })
})

export default files

