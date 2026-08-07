import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  FilePlus, 
  CheckCircle, 
  Users, 
  UserCog,
  ClipboardList,
  Printer,
  History,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  GraduationCap,
  Shield,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', path: '/templates', icon: FileText },
  { name: 'Documents', path: '/documents', icon: FilePlus },
  { name: 'Verification', path: '/verification', icon: CheckCircle },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Staff', path: '/staff', icon: UserCog },
  { name: 'Approvals', path: '/approvals', icon: ClipboardList },
  { name: 'Print Jobs', path: '/print-jobs', icon: Printer },
  { name: 'Audit Log', path: '/audit', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
]

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme } = useTheme()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results or filter current page
      toast.info(`Searching for: ${searchQuery}`)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-70 bg-white border-r border-[#eef2f6]
        transform transition-transform duration-300 ease-in-out
        flex flex-col h-full overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-[#eef2f6]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">WisWits</span>
          </Link>
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-gray-500 hover:bg-primary/5 hover:text-primary'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : ''}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-8 rounded-full bg-secondary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#eef2f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-primary truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-400 capitalize truncate">
                {user?.role?.replace('_', ' ') || 'User'}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#eef2f6] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-full border border-[#eef2f6] bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile search toggle */}
            <button className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                3
              </span>
            </button>
            
            {/* User avatar - mobile */}
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white font-bold cursor-pointer text-sm">
              {user?.firstName?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout