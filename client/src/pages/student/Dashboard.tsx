import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useDashboardStore, useNotificationStore } from '../../store'
import { 
  Briefcase, CheckCircle, Clock, DollarSign, 
  TrendingUp, AlertCircle, ArrowRight, Star
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { stats, fetchStats, isLoading } = useDashboardStore()
  const { notifications, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    fetchStats()
    fetchNotifications()
  }, [])

  if (!user) return null

  const statsCards = [
    { label: 'Jobs Given', value: stats?.total_jobs_given || 0, icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { label: 'Jobs Completed', value: stats?.completed_jobs_done || 0, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { label: 'Pending Payments', value: stats?.pending_payments || 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: 'Wallet Balance', value: `₹${stats?.wallet_balance?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'from-purple-500 to-pink-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {user.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400">Here's what's happening with your work</p>
        </div>
        {!user.is_profile_complete && (
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30"
          >
            <AlertCircle size={18} />
            Complete Profile
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{isLoading ? '...' : stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Performance Overview</h2>
              <Link to="/dashboard/explore" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-sm mb-2">Jobs Completed</div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-green-400" size={20} />
                    <span className="text-2xl font-bold">{stats?.completed_jobs || 0}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-2">Your Rating</div>
                  <div className="flex items-center gap-2">
                    <Star className="text-amber-400 fill-amber-400" size={20} />
                    <span className="text-2xl font-bold">{stats?.avg_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-500 text-sm">({stats?.total_reviews || 0} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-sm mb-2">Total Earned</div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-green-400" size={20} />
                    <span className="text-2xl font-bold">₹{stats?.wallet_balance?.toFixed(0) || '0'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-2">Profile Completion</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${user.is_profile_complete ? 100 : 40}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{user.is_profile_complete ? '100%' : '40%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/dashboard/explore"
                className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-blue-400" />
                </div>
                <div className="font-medium">Explore Jobs</div>
              </Link>
              <Link
                to="/dashboard/create-job"
                className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 hover:border-green-500/40 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="text-green-400" />
                </div>
                <div className="font-medium">Post a Job</div>
              </Link>
              <Link
                to="/dashboard/my-jobs"
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="text-purple-400" />
                </div>
                <div className="font-medium">My Jobs</div>
              </Link>
              <Link
                to="/dashboard/chat"
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="text-amber-400" />
                </div>
                <div className="font-medium">Payments</div>
              </Link>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <Link to="/dashboard/profile" className="text-primary-400 text-sm hover:text-primary-300">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl ${notif.is_read ? 'bg-white/5' : 'bg-primary-500/10 border border-primary-500/20'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${notif.is_read ? 'bg-slate-500' : 'bg-primary-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{notif.title}</div>
                    <div className="text-slate-400 text-xs mt-1 line-clamp-2">{notif.message}</div>
                    <div className="text-slate-500 text-xs mt-2">
                      {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
