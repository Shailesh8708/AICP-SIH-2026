import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppRouter } from './routes/AppRouter'
import { Navbar, Footer, WorkspaceShell } from './components/Layout'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { GokuAssistant } from './components/GokuAssistant'
import { CyberBackground3D } from './components/CyberBackground3D'
import { DailyQuizWidget } from './components/DailyQuiz'

function AppContent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <CyberBackground3D />
      {user ? (
        <WorkspaceShell user={user} onLogout={handleLogout}>
          <AppRouter />
        </WorkspaceShell>
      ) : (
        <div className="flex flex-col min-h-screen relative z-10">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="flex-1">
            <AppRouter />
          </main>
          <Footer />
        </div>
      )}
      {user && <DailyQuizWidget user={user} />}
      <GokuAssistant user={user} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
