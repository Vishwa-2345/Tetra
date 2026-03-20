import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useDashboardStore } from '../../store'
import { 
  Briefcase, CheckCircle, Clock, DollarSign, 
  TrendingUp, AlertCircle, ArrowRight, Star, MessageCircle
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { stats, fetchStats, isLoading } = useDashboardStore()

  useEffect(() => {
    fetchStats()
  }, [])

  if (!user) return null

  const statsCards = [
    { label: 'Jobs Given', value: stats?.total_jobs_given || 0, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { label: 'Jobs Completed', value: stats?.completed_jobs_done || 0, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Pending Payments', value: stats?.pending_payments || 0, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Wallet Balance', value: `₹${stats?.wallet_balance?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {user.name?.split(' ')[0]}!</h1>
            <p className="text-gray-500">Here's what's happening with your work</p>
          </div>
          {!user.is_profile_complete && (
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50/80 backdrop-blur text-amber-600 rounded-lg border border-amber-200"
            >
              <AlertCircle size={18} />
              Complete Profile
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{isLoading ? '...' : stat.value}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              <Link to="/dashboard/explore" className="text-primary-500 text-sm flex items-center gap-1 hover:text-primary-600 font-medium">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-sm mb-2">Jobs Completed</div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-green-500" size={20} />
                    <span className="text-2xl font-bold text-gray-900">{stats?.completed_jobs || 0}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-2">Your Rating</div>
                  <div className="flex items-center gap-2">
                    <Star className="text-amber-400 fill-amber-400" size={20} />
                    <span className="text-2xl font-bold text-gray-900">{stats?.avg_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-400 text-sm">({stats?.total_reviews || 0} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-sm mb-2">Total Earned</div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-green-500" size={20} />
                    <span className="text-2xl font-bold text-gray-900">₹{stats?.wallet_balance?.toFixed(0) || '0'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-2">Profile Completion</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${user.is_profile_complete ? 100 : 40}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.is_profile_complete ? '100%' : '40%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/dashboard/explore"
                className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-200 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-blue-500" />
                </div>
                <div className="font-medium text-gray-900">Explore Jobs</div>
              </Link>
              <Link
                to="/dashboard/create-job"
                className="p-4 rounded-xl bg-green-50 border border-green-100 hover:border-green-200 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="text-green-500" />
                </div>
                <div className="font-medium text-gray-900">Post a Job</div>
              </Link>
              <Link
                to="/dashboard/my-jobs"
                className="p-4 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-200 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="text-purple-500" />
                </div>
                <div className="font-medium text-gray-900">My Jobs</div>
              </Link>
              <Link
                to="/dashboard/chat"
                className="p-4 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="text-amber-500" />
                </div>
                <div className="font-medium text-gray-900">Payments</div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
          </div>
          <div className="space-y-3">
            <Link
              to="/dashboard/notifications"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Star className="text-primary-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-500">View all your notifications</div>
                </div>
              </div>
              <ArrowRight className="text-gray-400" />
            </Link>
            <Link
              to="/dashboard/chat"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageCircle className="text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Messages</div>
                  <div className="text-sm text-gray-500">Chat with others</div>
                </div>
              </div>
              <ArrowRight className="text-gray-400" />
            </Link>
            <Link
              to="/dashboard/payments"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <DollarSign className="text-amber-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Payments</div>
                  <div className="text-sm text-gray-500">Manage your wallet</div>
                </div>
              </div>
              <ArrowRight className="text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
