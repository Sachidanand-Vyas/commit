import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Contributions from './pages/Contributions'
import Habits from './pages/Habits'
import Review from './pages/Review'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import './index.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ token })
    }
    setLoading(false)
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('token', token)
    setUser({ token })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm tracking-wide">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
        } />
        <Route path="/" element={
          user ? <Layout onLogout={handleLogout}> <Dashboard /> </Layout> : <Navigate to="/login" />
        } />
        <Route path="/contributions" element={
          user ? <Layout onLogout={handleLogout}> <Contributions /> </Layout> : <Navigate to="/login" />
        } />
        <Route path="/habits" element={
          user ? <Layout onLogout={handleLogout}> <Habits /> </Layout> : <Navigate to="/login" />
        } />
        <Route path="/review" element={
          user ? <Layout onLogout={handleLogout}> <Review /> </Layout> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  )
}

export default App
