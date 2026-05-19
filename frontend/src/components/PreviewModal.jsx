import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const SAVED_URLS_KEY = 'prompt2app_preview_urls'

export default function PreviewModal({ open, onClose, output, projectId, commands: propCommands, token, previewFiles }) {
  if (!open) return null

  const defaultCommands = [
    'node scripts/loadPreview.js <projectId> <jwtToken>',
    'cd backend/preview-app',
    'npm install',
    'npm start'
  ]
  const commands = propCommands && propCommands.length ? propCommands : defaultCommands

  const [manualUrl, setManualUrl] = useState('')
  const [detected, setDetected] = useState('')
  const [savedUrls, setSavedUrls] = useState([])
  const [qrSvg, setQrSvg] = useState('')
  const [qrType, setQrType] = useState('svg')
  const [qrSize, setQrSize] = useState(300)
  const [savedMessage, setSavedMessage] = useState('')

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(commands.join('\n'))
      alert('Commands copied to clipboard')
    } catch (e) {
      console.warn('copy failed', e)
    }
  }

  const copyCommand = async (command) => {
    try {
      await navigator.clipboard.writeText(command)
      alert('Copied command')
    } catch (e) {
      console.warn('copy failed', e)
    }
  }

  const saveUrl = (url) => {
    const normalized = url.trim()
    if (!normalized) return
    setSavedMessage('Saved URL')
    const next = [normalized, ...savedUrls.filter((item) => item !== normalized)].slice(0, 5)
    setSavedUrls(next)
    window.localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(SAVED_URLS_KEY)
    if (stored) {
      try {
        setSavedUrls(JSON.parse(stored))
      } catch {
        setSavedUrls([])
      }
    }
  }, [])

  const detectUrlFromOutput = () => {
    if (!output) return ''
    const urlRegex = /(exp:\/\/[^\s'"\)]+)|(https?:\/\/[^\s'"\)]+)/g
    const matches = output.match(urlRegex)
    if (matches && matches.length) {
      const expMatch = matches.find((m) => m.startsWith('exp://'))
      const pick = expMatch || matches[0]
      setDetected(pick)
      return pick
    }
    return ''
  }

  const fetchServerQr = async (url) => {
    if (!url) {
      setQrSvg('')
      return
    }
    try {
      const res = await fetch(`/preview-qr?url=${encodeURIComponent(url)}&type=${encodeURIComponent(qrType)}&size=${encodeURIComponent(qrSize)}`)
      if (!res.ok) {
        setQrSvg('')
        return
      }
      if (qrType === 'png') {
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setQrSvg(objectUrl)
      } else {
        const svg = await res.text()
        setQrSvg(svg)
      }
    } catch (e) {
      setQrSvg('')
    }
  }

  useEffect(() => {
    const url = manualUrl.trim() || detected || ''
    fetchServerQr(url)
  }, [manualUrl, detected, qrType, qrSize])

  return (
    <div className="preview-modal-backdrop">
      <div className="preview-modal">
        <div className="preview-modal-header">
          <h3>Preview & QR</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div className="preview-modal-body">
          <p className="muted">Follow these steps to run the local Expo preview and obtain the QR code.</p>

          <ol className="preview-steps">
            <li>Run the commands below in a terminal inside the repo.</li>
            <li>Open the Expo developer tools (the QR will appear in the browser or terminal).</li>
            <li>Open the Expo Go app on your mobile and scan the QR (ensure devices are on the same Wi‑Fi).</li>
          </ol>

          <div className="command-block">
            <div className="command-header">
              <strong>Commands</strong>
              <button className="button small" onClick={copyAll}>Copy all</button>
            </div>
            <div className="command-lines">
              {commands.map((line, index) => (
                <div key={index} className="command-line">
                  <code>{line}</code>
                  <button className="button tiny" onClick={() => copyCommand(line)}>Copy</button>
                </div>
              ))}
            </div>
          </div>

          {savedUrls.length > 0 && (
            <div className="saved-urls">
              <div className="saved-urls-label">Saved URLs</div>
              <div className="saved-url-list">
                {savedUrls.map((url) => (
                  <button key={url} className="button pill" onClick={() => setManualUrl(url)}>
                    {url}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qr-section">
            <div className="qr-placeholder">
              {qrSvg ? (
                <img
                  src={qrType === 'png' ? qrSvg : `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`}
                  alt="QR code"
                  className="qr-box"
                />
              ) : (
                <div className="qr-box">QR Preview</div>
              )}

              <p className="muted small">The QR will be generated when you provide the Expo URL below or when Expo starts and prints it.</p>
            </div>

            <div className="preview-output">
              <strong>Preview sync output</strong>
              <pre className="output-text">{output || 'No output yet.'}</pre>

              <div style={{ marginTop: 8 }}>
                <button className="button small" onClick={detectUrlFromOutput}>Detect URL from output</button>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  className="button small"
                  onClick={async () => {
                    try {
                      const res = await apiRequest('/api/preview-start', { method: 'POST', token, body: { projectId } })
                      const text = JSON.stringify(res, null, 2)
                      alert('Preview start response:\n' + text)
                    } catch (e) {
                      alert('Preview start failed: ' + (e instanceof Error ? e.message : String(e)))
                    }
                  }}
                >
                  Start preview on server
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="small muted">Expo URL (paste from terminal or devtools)</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input
                    className="input"
                    placeholder="exp://192.168.x.y:19000"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                  <a className="button small" href={manualUrl || detected || '#'} target="_blank" rel="noreferrer">Open</a>
                  <button className="button small" onClick={() => saveUrl(manualUrl || detected)}>Save</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <label className="small muted">QR type</label>
                  <select className="input small" value={qrType} onChange={(e) => setQrType(e.target.value)}>
                    <option value="svg">SVG</option>
                    <option value="png">PNG</option>
                  </select>
                  <label className="small muted">Size</label>
                  <input
                    className="input small"
                    type="number"
                    value={qrSize}
                    min={100}
                    max={600}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                  />
                </div>
                {detected && !manualUrl && (
                  <div className="muted small" style={{ marginTop: 6 }}>Detected: {detected}</div>
                )}
                {savedMessage && <div className="muted small" style={{ marginTop: 6 }}>{savedMessage}</div>}
              </div>

              {qrSvg && (
                <div style={{ marginTop: 12 }}>
                  <button
                    className="button small"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(manualUrl || detected)
                        alert('URL copied')
                      } catch (e) {
                        console.warn('copy failed', e)
                      }
                    }}
                  >
                    Copy URL
                  </button>
                </div>
              )}

              {previewFiles && previewFiles.length > 0 && (
                <div className="preview-file-list" style={{ marginTop: 16 }}>
                  <h4>Preview sync files</h4>
                  <div className="file-tag-list">
                    {previewFiles.map((file) => (
                      <span key={file} className="file-tag">{file}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="preview-modal-actions">
          <button className="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
