import { Hono } from 'hono'
import type { AppEnv } from '../types/app'

const previewQr = new Hono<AppEnv>()

const toNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

previewQr.get('/', async (c) => {
  const url = c.req.query('url') || ''
  if (!url) return c.text('Missing url', 400)

  const type = (c.req.query('type') || 'svg').toLowerCase()
  const size = toNumber(c.req.query('size'), 300)

  try {
    const QR = await import('qrcode')
    if (type === 'png') {
      const buffer = await QR.toBuffer(url, { type: 'png', width: size })
      return c.body(buffer, 200, { 'Content-Type': 'image/png' })
    }

    const svg = await QR.toString(url, { type: 'svg', width: size })
    return c.text(svg, 200, { 'Content-Type': 'image/svg+xml' })
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message || String(e) }, 500)
  }
})

previewQr.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const url = body.url || ''
  if (!url) return c.json({ ok: false, error: 'Missing url' }, 400)

  const type = (body.type || 'svg').toLowerCase()
  const size = toNumber(body.size, 300)

  try {
    const QR = await import('qrcode')
    if (type === 'png') {
      const buffer = await QR.toBuffer(url, { type: 'png', width: size })
      return c.body(buffer, 200, { 'Content-Type': 'image/png' })
    }

    const svg = await QR.toString(url, { type: 'svg', width: size })
    return c.text(svg, 200, { 'Content-Type': 'image/svg+xml' })
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message || String(e) }, 500)
  }
})

export default previewQr
