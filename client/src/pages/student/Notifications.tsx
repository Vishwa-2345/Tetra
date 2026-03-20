import { useEffect } from 'react'
import { useNotificationStore } from '../../store'
import { 
  Bell, Briefcase, DollarSign, 
  MessageCircle, Star, Check
} from 'lucide-react'
import { format } from 'date-fns'

const formatNotificationTime = (dateString: string | Date) => {
  // Parse the date string and ensure it's in local timezone
  let date: Date
  if (typeof dateString === 'string') {
    if (dateString.endsWith('Z')) {
      date = new Date(dateString)
    } else {
      date = new Date(dateString)
      if (Math.abs(date.getTime() - new Date(dateString + 'Z').getTime()) > 12 * 60 * 60 * 1000) {
        date = new Date(dateString + 'Z')
      }
    }
  } else {
    date = dateString
  }
  
  const now = new Date()
  
  // Check if the date is today (compare in local time)
  const isToday = date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate()
  
  // Check if the date is yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.getFullYear() === yesterday.getFullYear() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getDate() === yesterday.getDate()
  
  // Check if within this week (last 7 days)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const isThisWeek = date >= weekAgo && date <= now
  
  if (isToday) {
    return format(date, 'h:mm a')
  } else if (isYesterday) {
    return 'Yesterday'
  } else if (isThisWeek) {
    return format(date, 'EEEE')
  } else {
    return format(date, 'MMM d')
  }
}

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
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100/80 backdrop-blur text-gray-700 text-sm font-medium hover:bg-gray-200/80 transition-colors"
            >
              <Check size={16} />
              Mark all read
            </button>
          )}
        </div>
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
                      {formatNotificationTime(notif.created_at)}
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
