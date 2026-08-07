import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Mail, Lock, Building, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    orgId: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.orgId) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    const result = await login(formData.email, formData.password, formData.orgId)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-medium">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto shadow-lg">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-primary mt-4">WisWits</h1>
            <p className="text-gray-500 text-sm">Enterprise Document Engine</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization ID
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                  placeholder="Enter organization ID"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@school.edu"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 flex items-center justify-center text-base gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © 2026 WisWits. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 mt-2">
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                Privacy Policy
              </button>
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                Terms & Conditions
              </button>
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login