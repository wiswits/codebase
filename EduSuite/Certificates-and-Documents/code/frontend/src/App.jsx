import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import Layout from './layouts/Layout'

import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import Documents from './pages/Documents'
import Verification from './pages/Verification'
import Approvals from './pages/Approvals'
import PrintJobs from './pages/PrintJobs'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'
import Login from './pages/Login'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="templates" element={<Templates />} />
                <Route path="documents" element={<Documents />} />
                <Route path="verification" element={<Verification />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="print-jobs" element={<PrintJobs />} />
                <Route path="audit" element={<AuditLog />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App