import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, useNotificationStore, useChatStore } from '../../store'
import { 
  LayoutDashboard, User, Search, Briefcase, CheckSquare, 
  CreditCard, MessageCircle, Bell, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import LogoutConfirmModal from './LogoutConfirmModal'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/profile', icon: User, label: 'My Profile' },
  { to: '/dashboard/explore', icon: Search, label: 'Explore' },
  { to: '/dashboard/my-jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/dashboard/assigned-jobs', icon: CheckSquare, label: 'Assigned Jobs' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
]

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'My Profile',
  '/dashboard/explore': 'Explore',
  '/dashboard/my-jobs': 'My Jobs',
  '/dashboard/assigned-jobs': 'Assigned Jobs',
  '/dashboard/payments': 'Payments',
  '/dashboard/chat': 'Messages',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/create-job': 'Create Job',
}

export default function StudentLayout() {
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const { connectWebSocket, disconnectWebSocket, fetchConversations } = useChatStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : true
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [unreadChats, setUnreadChats] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const currentPageName = pageNames[location.pathname] || 'Dashboard'

  return (
    <div className="min-h-screen bg-dark-800">
      <LogoutConfirmModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={22} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">Tetragrid</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center lg:justify-start lg:ml-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Home</span>
              <ChevronRight size={14} />
              <span className="font-medium text-gray-900">{currentPageName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/dashboard/chat"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageCircle size={22} className="text-gray-500" />
              {unreadChats > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs flex items-center justify-center font-medium text-white">
                  {unreadChats > 9 ? '9+' : unreadChats}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/dashboard/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell size={22} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ml-2">
              <span className="text-white font-semibold text-sm">{user?.name?.charAt(0)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-gray-200
        transform transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-3 py-3 rounded-xl transition-all ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={20} className={sidebarCollapsed ? '' : 'flex-shrink-0'} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Button (when sidebar is hidden) */}
      {!sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="fixed bottom-4 right-4 z-30 p-4 bg-primary-500 text-white rounded-full shadow-lg lg:hidden"
        >
          <X size={20} />
        </button>
      )}

      {/* Main Content */}
      <div className={`
        pt-16 min-h-screen transition-all duration-300
        ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}
      `}>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
