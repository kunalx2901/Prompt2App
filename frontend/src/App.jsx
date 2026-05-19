import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import './App.css'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('prompt2app_token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('prompt2app_user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) {
      localStorage.setItem('prompt2app_token', token)
    } else {
      localStorage.removeItem('prompt2app_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('prompt2app_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('prompt2app_user')
    }
  }, [user])

  const handleAuth = (tokenValue, userValue) => {
    setToken(tokenValue)
    setUser(userValue)
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="brand">
            Prompt2App
          </Link>
          <nav className="topbar-nav">
            {token ? (
              <>
                <Link to="/" className="nav-link">
                  Projects
                </Link>
                <button className="button button-ghost" onClick={handleLogout}>
                  Logout
                </button>
                <span className="user-badge">{user?.name || user?.email}</span>
              </>
            ) : (
              <Link to="/auth" className="button button-primary">
                Login / Register
              </Link>
            )}
          </nav>
        </header>

        <main className="content-area">
          <Routes>
            <Route
              path="/auth"
              element={<AuthPage onAuth={handleAuth} token={token} />}
            />
            <Route
              path="/"
              element={
                token ? (
                  <DashboardPage token={token} user={user} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/project/:projectId"
              element={
                token ? (
                  <ProjectPage token={token} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={token ? '/' : '/auth'} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
