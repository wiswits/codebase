import React, { useEffect, useState } from 'react'
import { 
  FileText, 
  Palette, 
  Badge, 
  CalendarCheck,
  TrendingUp,
  Clock,
  Users,
  Printer,
  CheckCircle,
  AlertCircle,
  Download,
  PlusCircle,
  Upload,
  Layers
} from 'lucide-react'
import axios from '../services/axios'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import QuickAction from '../components/QuickAction'
import ActivityItem from '../components/ActivityItem'
import EventCard from '../components/EventCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCertificates: 1247,
    activeTemplates: 12,
    BadgesGenerated: 890,
    thisMonth: 89
  })
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'certificate',
      title: 'Certificate issued to Rahul Sharma',
      description: 'Academic Excellence Certificate',
      time: '2 min ago',
      icon: FileText
    },
    {
      id: 2,
      type: 'template',
      title: 'Template "Sports Day 2025" published',
      description: 'by Coordinator',
      time: '15 min ago',
      icon: Palette
    },
    {
      id: 3,
      type: 'idcard',
      title: 'ID Cards generated in bulk',
      description: 'Total 120 ID Cards',
      time: '1 hour ago',
      icon: Badge
    },
    {
      id: 4,
      type: 'download',
      title: 'Certificate downloaded by Priya Singh',
      description: 'Certificate ID: CERT-2025-1045',
      time: '2 hours ago',
      icon: Download
    }
  ])

  const [chartData, setChartData] = useState([
    { day: 'Mon', value: 125 },
    { day: 'Tue', value: 85 },
    { day: 'Wed', value: 75 },
    { day: 'Thu', value: 45 },
    { day: 'Fri', value: 95 },
    { day: 'Sat', value: 55 },
    { day: 'Sun', value: 40 }
  ])

  const [distributionData, setDistributionData] = useState([
    { name: 'Academic', value: 35 },
    { name: 'Sports', value: 27 },
    { name: 'ID Cards', value: 20 },
    { name: 'Participation', value: 10 },
    { name: 'Others', value: 8 }
  ])

  const COLORS = ['#C8A04E', '#0F2147', '#94a3b8', '#f59e0b', '#10b981']

  const quickActions = [
    { icon: PlusCircle, label: 'Create Certificate' },
    { icon: Badge, label: 'Generate ID Card' },
    { icon: Upload, label: 'Upload Excel' },
    { icon: Layers, label: 'Bulk Certificates' },
    { icon: CheckCircle, label: 'Verify Certificate' },
    { icon: Printer, label: 'Print Queue' }
  ]

  const events = [
    {
      date: 'MAY 25',
      title: 'Annual Sports Day',
      description: 'Prepare certificates for winners'
    },
    {
      date: 'JUN 05',
      title: 'Annual Function',
      description: 'Certificates for participants'
    },
    {
      date: 'JUN 15',
      title: 'Exam Results Day',
      description: 'Merit certificates distribution'
    },
    {
      date: 'JUN 30',
      title: 'Graduation Ceremony',
      description: 'Graduation certificates'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Good Morning, {user?.firstName || 'Principal'}
          </h1>
          <p className="text-gray-500 mt-1">Welcome back to Sunrise Public School</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Certificates"
          value={stats.totalCertificates}
          trend={12}
          icon={FileText}
        />
        <StatCard
          label="Active Templates"
          value={stats.activeTemplates}
          trend="2 new this week"
          icon={Palette}
        />
        <StatCard
          label="ID Cards Generated"
          value={stats.BadgesGenerated}
          trend={8}
          icon={Badge}
        />
        <StatCard
          label="This Month"
          value={stats.thisMonth}
          trend={5}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-primary">Certificate Issuance Overview</h3>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#C8A04E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Certificate Distribution</h3>
          <div className="space-y-4">
            {distributionData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-primary">{item.value}%</span>
                </div>
                <div className="progress-bar mt-1">
                  <div 
                    className="fill" 
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#f0f2f5] flex justify-center">
            <span className="text-xs text-gray-400">Total 1,247 documents</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Recent Activity</h3>
            <button className="text-xs text-secondary font-medium hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} {...activity} />
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Upcoming Events</h3>
          {events.map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Bulk Queue Status</h3>
            <span className="chip chip-blue">Processing</span>
          </div>
          <div className="bg-[#faf9f6] rounded-2xl p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Batch #B-2025-042</span>
              <span className="font-medium text-primary">245 / 500</span>
            </div>
            <div className="progress-bar mt-2">
              <div className="fill" style={{ width: '49%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>49% complete</span>
              <span>~ 12 min remaining</span>
            </div>
          </div>
          <div className="bg-[#faf9f6] rounded-2xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Batch #B-2025-041</span>
              <span className="font-medium text-emerald-600">Completed</span>
            </div>
            <div className="progress-bar mt-2">
              <div className="fill" style={{ width: '100%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1,200 documents</span>
              <span>2 hours ago</span>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="btn-secondary text-sm flex-1">
              <Clock className="w-4 h-4 inline mr-2" />
              Process Queue
            </button>
            <button className="btn-outline text-sm flex-1">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Retry Failed
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard