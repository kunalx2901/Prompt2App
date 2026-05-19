import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api'
import { streamSSE } from '../stream'
import ProjectCard from '../components/ProjectCard'
import StatusTimeline from '../components/StatusTimeline'
import './DashboardPage.css'

export default function DashboardPage({ token, user }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState('Create a modern UX-driven portfolio app using React Native and Expo.')
  const [generating, setGenerating] = useState(false)
  const [streamEvents, setStreamEvents] = useState([])
  const [generatedProjectId, setGeneratedProjectId] = useState(null)

  const loadProjects = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest('/api/projects', { token })
      setProjects(result.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [token])

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const result = await apiRequest('/api/projects', {
        method: 'POST',
        body: { name, description },
        token,
      })

      setProjects((current) => [result.project, ...current])
      setName('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async (event) => {
    event.preventDefault()
    setError('')
    setStreamEvents([])
    setGeneratedProjectId(null)
    setGenerating(true)

    try {
      await streamSSE('/api/generate', {
        token,
        body: { prompt },
        onEvent: ({ event: eventType, data }) => {
          let message = data
          if (eventType === 'done') {
            try {
              const parsed = JSON.parse(data)
              setGeneratedProjectId(parsed.projectId)
              message = `Completed generation: ${parsed.filesGenerated} files`}
            catch {
              message = data
            }
            loadProjects()
          }
          setStreamEvents((current) => [
            ...current,
            { event: eventType, message: eventType === 'file' ? `Received ${message}` : message },
          ])
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const statusText = useMemo(() => {
    if (generating) return 'Generating project files with AI…'
    if (generatedProjectId) return 'AI generation complete!'
    return 'Enter a prompt to generate a new AI project.'
  }, [generating, generatedProjectId])

  return (
    <section className="dashboard-grid">
      <div className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Hello, {user?.name || 'creator'}</p>
          <h1>Launch beautiful apps with AI-driven React workflows.</h1>
          <p className="lead-text">
            Use the project dashboard to generate, edit, and preview your app files with OpenRouter AI.
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-badge">Workspace</div>
          <p className="hero-stat">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="generate-card card">
        <div className="card-header">
          <div>
            <h2>Generate AI project</h2>
            <p>Send a prompt to the AI route and watch the project build in real time.</p>
          </div>
          <span className="status-pill">{statusText}</span>
        </div>

        <form className="generate-form" onSubmit={handleGenerate}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Describe the app you want the AI to generate..."
          />
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={generating || !prompt.trim()}>
              {generating ? 'Generating…' : 'Generate with AI'}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setPrompt('Create a modern UX-driven portfolio app using React Native and Expo.')}
            >
              Reset prompt
            </button>
          </div>
        </form>

        <StatusTimeline events={streamEvents} />

        {generatedProjectId && (
          <div className="result-panel">
            <p>Project created successfully.</p>
            <a className="button button-accent" href={`project/${generatedProjectId}`}>
              Open generated project
            </a>
          </div>
        )}

        {error && <div className="alert error">{error}</div>}
      </div>

      <div className="projects-card card">
        <div className="card-header">
          <div>
            <h2>Your projects</h2>
            <p>{projects.length} project{projects.length === 1 ? '' : 's'} available.</p>
          </div>
          <button className="button button-ghost" type="button" onClick={loadProjects}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-panel">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            No projects yet. Generate one with AI or create a new blank project.
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <div className="create-card card">
        <div className="card-header">
          <h2>Create a workspace record</h2>
          <p>Create a generic project record when you want to save a placeholder before AI generation.</p>
        </div>

        <form className="project-form" onSubmit={handleCreate}>
          <label>
            Project name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter project name"
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short project summary"
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button className="button button-primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </div>
    </section>
  )
}
