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
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-slate-400">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{loading ? '...' : stats?.total_users || 0}</div>
          <div className="text-slate-400 text-sm">Total Users</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Briefcase className="text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{loading ? '...' : stats?.total_jobs || 0}</div>
          <div className="text-slate-400 text-sm">Total Jobs</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">₹{loading ? '...' : (stats?.total_revenue || 0).toFixed(0)}</div>
          <div className="text-slate-400 text-sm">Total Revenue</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">₹{loading ? '...' : (stats?.total_commission || 0).toFixed(0)}</div>
          <div className="text-slate-400 text-sm">Platform Commission</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">User Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" />
                <span>Verified Users</span>
              </div>
              <span className="font-bold text-green-400">{stats?.verified_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-400" />
                <span>Suspended Users</span>
              </div>
              <span className="font-bold text-red-400">{stats?.suspended_users || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Job Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" />
                <span>Completed Jobs</span>
              </div>
              <span className="font-bold text-green-400">{stats?.completed_jobs || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-amber-400" />
                <span>Pending Jobs</span>
              </div>
              <span className="font-bold text-amber-400">{stats?.pending_jobs || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
