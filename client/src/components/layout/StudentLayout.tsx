import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, useNotificationStore, useChatStore } from '../../store'
import { 
  LayoutDashboard, User, Search, Briefcase, CheckSquare, 
  CreditCard, MessageCircle, Bell, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/profile', icon: User, label: 'My Profile' },
  { to: '/dashboard/explore', icon: Search, label: 'Explore Freelancers' },
  { to: '/dashboard/my-jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/dashboard/assigned-jobs', icon: CheckSquare, label: 'Assigned Jobs' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
]

export default function StudentLayout() {
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const { connectWebSocket, disconnectWebSocket, fetchConversations } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadChats, setUnreadChats] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
    fetchConversations()
    connectWebSocket()
    
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchConversations()
    }, 10000)
    
    return () => {
      clearInterval(interval)
      disconnectWebSocket()
    }
  }, [])

  useEffect(() => {
    const totalUnread = useChatStore.getState().conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    setUnreadChats(totalUnread)
  }, [useChatStore.getState().conversations])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on all screens */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 sm:w-72 bg-dark-200 border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg gradient-text">Tetragrid</h1>
                  <p className="text-xs text-slate-400">Freelance Platform</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="text-sm sm:text-base">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="glass rounded-xl p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{user?.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              {!user?.is_profile_complete && (
                <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                  Complete your profile to start!
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-dark-300/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu size={24} className="text-slate-300" />
            </button>

            {/* Page Title - Mobile */}
            <div className="flex-1 lg:hidden" />

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <NavLink
                to="/dashboard/chat"
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <MessageCircle size={22} className="text-slate-300" />
                {unreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center font-medium text-white">
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/dashboard/notifications"
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Bell size={22} className="text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
