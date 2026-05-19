import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { streamSSE } from '../stream'
import StatusTimeline from '../components/StatusTimeline'
import SandboxPreview from '../components/SandboxPreview'
import PreviewModal from '../components/PreviewModal'
import './ProjectPage.css'

const encodePath = (path) =>
  path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

export default function ProjectPage({ token }) {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [prompt, setPrompt] = useState('Improve the app with a fresh modern mobile UI and better navigation.')
  const [editing, setEditing] = useState(false)
  const [editEvents, setEditEvents] = useState([])
  const [previewReady, setPreviewReady] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewOutput, setPreviewOutput] = useState('')
  const [previewCommands, setPreviewCommands] = useState([])
  const [previewFilesFromSync, setPreviewFilesFromSync] = useState([])

  const fetchPreview = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest(`/api/preview/${projectId}`, { token })
      setFiles(Object.keys(result.files || []))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await apiRequest(`/api/projects/${projectId}`, { token })
        setProject(data.project)
      } catch {
        // ignore non-critical project metadata failure
      }
    }

    fetchProject()
    fetchPreview()
  }, [projectId, token])

  const loadFileContent = async (path) => {
    setSelected(path)
    setPreviewContent('')
    setContentLoading(true)
    setError('')

    try {
      const encoded = encodePath(path)
      const result = await apiRequest(`/api/files/${projectId}/${encoded}`, { token })
      setPreviewContent(result.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load file content')
    } finally {
      setContentLoading(false)
    }
  }

  const handleEdit = async (event) => {
    event.preventDefault()
    setEditing(true)
    setError('')
    setEditEvents([])

    try {
      await streamSSE('/api/edit', {
        token,
        body: { projectId, prompt },
        onEvent: ({ event: eventType, data }) => {
          let message = data
          if (eventType === 'done') {
            try {
              const parsed = JSON.parse(data)
              message = `Edit finished for ${parsed.projectId || projectId}`
            } catch {
              message = data
            }
            fetchPreview().then(() => setPreviewReady(true))
          }
          setEditEvents((current) => [
            ...current,
            { event: eventType, message },
          ])
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit request failed')
    } finally {
      setEditing(false)
    }
  }

  const previewSummary = useMemo(() => {
    if (files.length === 0) {
      return 'No preview files found yet. Create a project or sync the preview after editing.'
    }
    return `${files.length} files loaded from the preview endpoint.`
  }, [files.length])

  return (
    <section className="project-page">
      <div className="project-panel card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Project preview</p>
            <h1>{project?.name || 'Project details'}</h1>
            <p className="subtext">{project?.description || previewSummary}</p>
          </div>
          <div className="project-meta">
            <span className="meta-pill">{files.length} files</span>
            <span className="meta-pill">Project ID</span>
          </div>
        </div>

        <div className="preview-grid">
          <div className="file-list card-secondary">
            <div className="section-title">Preview files</div>
            {loading ? (
              <p className="loading-panel">Loading files…</p>
            ) : files.length === 0 ? (
              <div className="empty-state">No files are available yet.</div>
            ) : (
              <ul className="file-list-items">
                {files.map((path) => (
                  <li key={path}>
                    <button
                      className={`file-link ${selected === path ? 'active' : ''}`}
                      onClick={() => loadFileContent(path)}
                    >
                      {path}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="file-preview card-secondary">
            <div className="section-title">File content</div>
            {contentLoading ? (
              <div className="loading-panel">Loading content…</div>
            ) : selected ? (
              <pre className="file-code">{previewContent || 'Empty file content.'}</pre>
            ) : (
              <div className="empty-state">Select a file to preview its content.</div>
            )}
          </div>
        </div>

        <div className="hint-card card-secondary">
          <h2>How to sync changes in Expo preview</h2>
          <p>
            This repo stores AI-edited files in R2. To refresh the mobile preview, rerun the loader and restart Expo.
          </p>
          <pre className="hint-code">npm run preview:load -- {'<projectId>'} {'<jwtToken>'}</pre>
        </div>
      </div>

      <div className="edit-card card">
        <div className="card-header">
          <div>
            <h2>Edit project with AI</h2>
            <p>Send a revision prompt to the AI edit route and watch the status events in real time.</p>
          </div>
          <span className="status-pill">{editing ? 'Editing...' : 'Ready to edit'}</span>
        </div>

        <form className="generate-form" onSubmit={handleEdit}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Tell the AI how to update the app..."
          />

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={editing || !prompt.trim()}>
              {editing ? 'Applying changes…' : 'Edit project files'}
            </button>
            {previewReady && (
              <button
                className="button button-ghost"
                type="button"
                onClick={async () => {
                  setPreviewModalOpen(true)
                  setPreviewOutput('Running preview sync...')
                  try {
                    const res = await apiRequest('/api/preview-sync', {
                      method: 'POST',
                      token,
                      body: { projectId }
                    })
                    setPreviewCommands(res.commands || [])
                    setPreviewFilesFromSync(res.files ? Object.keys(res.files) : [])
                    if (res.message) setPreviewOutput(res.message)
                    else if (res.files) setPreviewOutput(`${Object.keys(res.files).length} files available`)
                    else setPreviewOutput(JSON.stringify(res))
                  } catch (e) {
                    setPreviewOutput(e instanceof Error ? e.message : String(e))
                  }
                }}
              >
                Preview
              </button>
            )}
          </div>
        </form>

        <StatusTimeline events={editEvents} />
        {error && <div className="alert error">{error}</div>}
      </div>

      <SandboxPreview
        title={project?.name || 'App preview'}
        subtitle={project?.description || 'Visual preview from generated app metadata.'}
        fileCount={files.length}
        selectedFile={selected}
      />
      <PreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        output={previewOutput}
        projectId={projectId}
        commands={previewCommands}
        token={token}
        previewFiles={previewFilesFromSync}
      />
    </section>
  )
}
