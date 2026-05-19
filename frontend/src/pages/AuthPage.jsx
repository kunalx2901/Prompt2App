import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import './AuthPage.css'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

export default function AuthPage({ onAuth, token }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const title = mode === 'login' ? 'Welcome back' : 'Create an account'
  const actionLabel = mode === 'login' ? 'Sign in' : 'Create account'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const route = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = {
        email: form.email,
        password: form.password,
        ...(mode === 'register' ? { name: form.name } : {}),
      }
      const response = await apiRequest(route, { method: 'POST', body })

      onAuth(response.token, response.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const switchMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setForm(initialForm)
    setError('')
  }

  const canSubmit = useMemo(() => {
    if (mode === 'register') {
      return form.name.trim() && form.email.trim() && form.password.length >= 8
    }
    return form.email.trim() && form.password.length >= 8
  }, [form, mode])

  if (token) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="card auth-card">
      <div className="auth-header">
        <div>
          <p className="eyebrow">Secure access</p>
          <h1>{title}</h1>
          <p className="subtext">Build and preview your AI-powered project pipeline in one dashboard.</p>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label className="field-group">
            <span>Full name</span>
            <input
              value={form.name}
              onChange={handleInput('name')}
              placeholder="Jane Doe"
              required
            />
          </label>
        )}

        <label className="field-group">
          <span>Email address</span>
          <input
            type="email"
            value={form.email}
            onChange={handleInput('email')}
            placeholder="hello@example.com"
            required
          />
        </label>

        <label className="field-group">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={handleInput('password')}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        <button className="button button-primary" disabled={!canSubmit || loading}>
          {loading ? 'Working…' : actionLabel}
        </button>

        <button type="button" className="button button-ghost" onClick={switchMode}>
          {mode === 'login'
            ? 'Create a new account'
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </section>
  )
}
