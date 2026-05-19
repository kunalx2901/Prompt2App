export async function streamSSE(url, { method = 'POST', body, token, onEvent }) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => null)
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Streaming response body is unavailable')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      processChunk(chunk)
    }
  }

  if (buffer.trim()) {
    processChunk(buffer)
  }

  function processChunk(chunk) {
    const lines = chunk.split('\n')
    let event = 'message'
    let data = ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (line.startsWith('event:')) {
        event = line.slice('event:'.length).trim()
      } else if (line.startsWith('data:')) {
        data += line.slice('data:'.length).trim()
      }
    }

    if (data === '[DONE]') {
      return
    }

    if (onEvent) {
      onEvent({ event, data })
    }

    if (data === '[DONE]') {
      return
    }

    if (onEvent) {
      onEvent({ event, data })
    }
  }
}
