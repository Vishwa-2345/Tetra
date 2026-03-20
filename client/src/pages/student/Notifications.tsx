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
  'status_update': 'bg-blue-50 text-blue-600 border-blue-200',
  'job_assigned': 'bg-purple-50 text-purple-600 border-purple-200',
  'payment': 'bg-green-50 text-green-600 border-green-200',
  'refund': 'bg-amber-50 text-amber-600 border-amber-200',
  'review': 'bg-pink-50 text-pink-600 border-pink-200',
  'message': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  'default': 'bg-gray-50 text-gray-600 border-gray-200',
}

const iconColorMap: Record<string, string> = {
  'status_update': 'text-blue-500',
  'job_assigned': 'text-purple-500',
  'payment': 'text-green-500',
  'refund': 'text-amber-500',
  'review': 'text-pink-500',
  'message': 'text-cyan-500',
  'default': 'text-gray-500',
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

  const getIconColor = (type: string) => {
    return iconColorMap[type] || iconColorMap['default']
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500 text-sm">When you get notifications, they'll appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getNotificationIcon(notif.type)
            const colorClass = getNotificationColor(notif.type)
            const iconColor = getIconColor(notif.type)
            
            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  notif.is_read 
                    ? 'bg-white border-gray-100' 
                    : colorClass
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white ${!notif.is_read ? `border ${colorClass}` : 'border-gray-100'}`}>
                    <Icon size={20} className={notif.is_read ? 'text-gray-400' : iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium text-sm sm:text-base ${notif.is_read ? 'text-gray-500' : 'text-gray-900'}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-xs sm:text-sm mt-1 ${notif.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
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
