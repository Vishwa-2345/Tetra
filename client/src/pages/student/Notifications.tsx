import { useEffect } from 'react'
import { useNotificationStore } from '../../store'
import { 
  Bell, Briefcase, DollarSign, 
  MessageCircle, Star, Check
} from 'lucide-react'
import { format } from 'date-fns'

const iconMap: Record<string, any> = {
  'status_update': Briefcase,
  'job_assigned': Briefcase,
  'payment': DollarSign,
  'refund': DollarSign,
  'review': Star,
  'message': MessageCircle,
  'default': Bell,
}

const colorMap: Record<string, string> = {
  'status_update': 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
  'job_assigned': 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
  'payment': 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/30',
  'refund': 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
  'review': 'from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30',
  'message': 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
  'default': 'from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/30',
}

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const getNotificationIcon = (type: string) => {
    const Icon = iconMap[type] || iconMap['default']
    return Icon
  }

  const getNotificationColor = (type: string) => {
    return colorMap[type] || colorMap['default']
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-secondary text-sm"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Bell className="text-slate-500" size={32} />
          </div>
          <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
          <p className="text-slate-500 text-sm">When you get notifications, they'll appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getNotificationIcon(notif.type)
            const colorClass = getNotificationColor(notif.type)
            
            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  notif.is_read 
                    ? 'bg-white/5 border-white/10' 
                    : `bg-gradient-to-br ${colorClass}`
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.is_read ? 'bg-slate-700/50' : ''
                  }`}>
                    <Icon size={20} className={notif.is_read ? 'text-slate-500' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium text-sm sm:text-base ${notif.is_read ? 'text-slate-400' : ''}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-xs sm:text-sm mt-1 ${notif.is_read ? 'text-slate-500' : 'text-slate-300'}`}>
                          {notif.message}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {format(new Date(notif.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
