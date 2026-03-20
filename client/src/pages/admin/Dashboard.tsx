import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { AdminStats } from '../../types'
import { Users, Briefcase, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-gray-900">{loading ? '...' : stats?.total_users || 0}</div>
          <div className="text-gray-500 text-sm">Total Users</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Briefcase className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-gray-900">{loading ? '...' : stats?.total_jobs || 0}</div>
          <div className="text-gray-500 text-sm">Total Jobs</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <DollarSign className="text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-gray-900">₹{loading ? '...' : (stats?.total_revenue || 0).toFixed(0)}</div>
          <div className="text-gray-500 text-sm">Total Revenue</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-gray-900">₹{loading ? '...' : (stats?.total_commission || 0).toFixed(0)}</div>
          <div className="text-gray-500 text-sm">Platform Commission</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">User Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" />
                <span className="text-gray-700">Verified Users</span>
              </div>
              <span className="font-bold text-green-600">{stats?.verified_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" />
                <span className="text-gray-700">Suspended Users</span>
              </div>
              <span className="font-bold text-red-600">{stats?.suspended_users || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Job Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" />
                <span className="text-gray-700">Completed Jobs</span>
              </div>
              <span className="font-bold text-green-600">{stats?.completed_jobs || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-amber-600" />
                <span className="text-gray-700">Pending Jobs</span>
              </div>
              <span className="font-bold text-amber-600">{stats?.pending_jobs || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
