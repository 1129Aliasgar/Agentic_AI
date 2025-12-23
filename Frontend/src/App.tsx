import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './contexts/NotificationContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import NotificationDrawer from './components/NotificationDrawer'
import EmailPage from './pages/EmailPage'
import DocPage from './pages/DocPage'
import MapPage from './pages/MapPage'

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/email" replace />} />
              <Route path="/email" element={<EmailPage />} />
              <Route path="/doc" element={<DocPage />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </main>
          <NotificationDrawer />
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App

