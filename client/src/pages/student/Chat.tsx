import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useChatStore, useAuthStore } from '../../store'
import { format } from 'date-fns'
import { ArrowLeft, Send, Phone, Video, Search, Wifi, WifiOff, RefreshCw, LogIn, X, Paperclip, FileText, Loader2, Link as LinkIcon } from 'lucide-react'
import { messagesAPI } from '../../services/api'
import toast from 'react-hot-toast'

const formatMessageTime = (dateString: string | Date) => {
  // Parse the date string and ensure it's in local timezone
  let date: Date
  if (typeof dateString === 'string') {
    // If it's an ISO string with Z suffix, parse directly
    // Otherwise, append UTC indicator to ensure correct parsing
    if (dateString.endsWith('Z')) {
      date = new Date(dateString)
    } else {
      // Try to parse as local time first
      date = new Date(dateString)
      // If the parsed date is significantly different, try UTC
      if (Math.abs(date.getTime() - new Date(dateString + 'Z').getTime()) > 12 * 60 * 60 * 1000) {
        date = new Date(dateString + 'Z')
      }
    }
  } else {
    date = dateString
  }
  
  // Create a copy of now for comparison
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
    return 'Yesterday ' + format(date, 'h:mm a')
  } else if (isThisWeek) {
    return format(date, 'EEEE h:mm a')
  } else {
    return format(date, 'MMM d, h:mm a')
  }
}

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const {
    conversations,
    currentChat,
    messages,
    wsStatus,
    wsError,
    fetchConversations,
    fetchMessages,
    sendMessage,
    setCurrentChat,
    connectWebSocket,
    disconnectWebSocket,
    markConversationRead,
    clearWsError
  } = useChatStore()
  
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [directUserId, setDirectUserId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageRef = useRef<string>('')
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchConversations()
    connectWebSocket()
    return () => disconnectWebSocket()
  }, [])

  useEffect(() => {
    const userIdParam = searchParams.get('user')
    if (userIdParam) {
      const numericUserId = parseInt(userIdParam)
      setDirectUserId(numericUserId)
      setCurrentChat(numericUserId)
      fetchMessages(numericUserId)
      markConversationRead(numericUserId)
      setShowMobileChat(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (currentChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, currentChat])

  useEffect(() => {
    if (wsError) {
      toast.error(wsError, { duration: 4000 })
    }
  }, [wsError])

  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    
    const trimmedMessage = message.trim()
    if (!trimmedMessage || !currentChat) return
    
    lastMessageRef.current = trimmedMessage
    
    const jobId = searchParams.get('job_id')
    sendMessage(currentChat, trimmedMessage, jobId ? parseInt(jobId) : undefined)
    setMessage('')
  }, [message, currentChat, sendMessage, searchParams])

  const isImage = (type?: string) => type === 'image' || type?.startsWith('image/')

  const handleRetry = () => {
    clearWsError()
    connectWebSocket()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentChat) return

    setUploadingFile(true)
    try {
      const { data } = await messagesAPI.uploadFile(file)
      const jobId = searchParams.get('job_id')
      sendMessage(
        currentChat, 
        `Shared a file: ${file.name}`, 
        jobId ? parseInt(jobId) : undefined,
        data.url,
        file.type.startsWith('image/') ? 'image' : 'file'
      )
      toast.success('File sent')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleBack = () => {
    setSearchParams('')
    setCurrentChat(null)
    setShowMobileChat(false)
    setDirectUserId(null)
  }

  const handleSelectConversation = (userId: number) => {
    setSearchParams(`user=${userId}`)
  }

  const getStatusIndicator = () => {
    switch (wsStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs">Connected</span>
          </div>
        )
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Connecting...</span>
          </div>
        )
      case 'error':
        return (
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
          >
            <WifiOff size={14} />
            <span className="text-xs">Disconnected</span>
            <RefreshCw size={12} />
          </button>
        )
      case 'auth_error':
        return (
          <Link 
            to="/login"
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors"
          >
            <LogIn size={14} />
            <span className="text-xs">Login Required</span>
          </Link>
        )
      default:
        return (
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-600 transition-colors"
          >
            <Wifi size={14} />
            <span className="text-xs">Connect</span>
          </button>
        )
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  const currentConversation = conversations.find(c => c.user_id === currentChat)
  const currentMessages = currentChat ? (messages[currentChat] || []) : []

  const getDirectUserName = () => {
    if (currentConversation) return currentConversation.user_name
    if (directUserId) {
      const conv = conversations.find(c => c.user_id === directUserId)
      return conv?.user_name || 'User'
    }
    return 'User'
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
      {/* Conversations List */}
      <div className={`w-80 bg-white rounded-xl flex flex-col overflow-hidden shadow-sm ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {getStatusIndicator()}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
              placeholder="Search conversations..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => handleSelectConversation(conv.user_id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  (currentChat === conv.user_id || directUserId === conv.user_id) ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600 relative flex-shrink-0">
                  {conv.user_name?.charAt(0).toUpperCase() || 'U'}
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 truncate">{conv.user_name}</div>
                    {conv.last_message_time && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatMessageTime(conv.last_message_time)}
                      </span>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="text-xs text-primary-600 font-medium mt-0.5">
                      {conv.unread_count} unread message{conv.unread_count > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No conversations yet</p>
              <p className="text-sm">Start chatting from Explore page</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 bg-white rounded-xl flex flex-col overflow-hidden shadow-sm ${!showMobileChat && !currentChat ? 'hidden md:flex' : 'flex'}`}>
        {currentChat ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 bg-white z-10">
              <button 
                onClick={handleBack}
                className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">
                {getDirectUserName().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{getDirectUserName()}</div>
                <div className="flex items-center gap-2">
                  {wsStatus === 'connected' ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Online
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Phone size={20} className="text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Video size={20} className="text-gray-500" />
              </button>
              <button 
                onClick={handleBack}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
                <div className={`text-center py-2 px-4 rounded-lg mb-4 ${
                  wsStatus === 'error' || wsStatus === 'auth_error' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <p className="text-sm">
                    {wsStatus === 'auth_error' && 'Session expired. Please login to continue chatting.'}
                    {wsStatus === 'error' && 'Connection lost. Attempting to reconnect...'}
                    {wsStatus === 'disconnected' && 'Chat disconnected.'}
                  </p>
                  {(wsStatus === 'error' || wsStatus === 'disconnected') && (
                    <button 
                      onClick={handleRetry}
                      className="mt-2 text-xs underline hover:no-underline"
                    >
                      Click to reconnect
                    </button>
                  )}
                </div>
              )}
              {currentMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {currentMessages.map((msg: any, index: number) => {
                const isOwn = msg.sender_id === user?.id
                const showAvatar = index === 0 || currentMessages[index - 1]?.sender_id !== msg.sender_id
                const hasAttachment = msg.attachment_url
                const isAttachmentImage = isImage(msg.attachment_type) || (hasAttachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachment_url))
                const isExternalUrl = hasAttachment && (msg.attachment_url.startsWith('http://') || msg.attachment_url.startsWith('https://'))
                
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 mr-2 flex-shrink-0">
                        {getDirectUserName().charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8 mr-2" />}
                    <div
                      className={`max-w-[70%] rounded-2xl ${
                        isOwn
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-white border border-gray-200 rounded-bl-md'
                      } ${msg.is_temp ? 'opacity-70' : ''}`}
                    >
                      {hasAttachment && (
                        <div className="p-2">
                          {isAttachmentImage ? (
                            <a 
                              href={msg.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block"
                              onClick={(e) => {
                                e.preventDefault()
                                window.open(msg.attachment_url, '_blank')
                              }}
                            >
                              <img 
                                src={msg.attachment_url} 
                                alt="Attachment" 
                                className="max-w-full max-h-64 rounded-lg object-cover hover:opacity-90 transition-opacity cursor-pointer"
                              />
                            </a>
                          ) : isExternalUrl ? (
                            <a 
                              href={msg.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
                              } transition-colors`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20' : 'bg-blue-100'}`}>
                                <LinkIcon size={20} className={isOwn ? 'text-white' : 'text-blue-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">Shared Link</p>
                                <p className={`text-xs truncate ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>{msg.attachment_url}</p>
                              </div>
                            </a>
                          ) : (
                            <a 
                              href={msg.attachment_url} 
                              download
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
                              } transition-colors`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20' : 'bg-primary-100'}`}>
                                <FileText size={20} className={isOwn ? 'text-white' : 'text-primary-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">{msg.content.replace('Shared a file: ', '')}</p>
                                <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>Click to download</p>
                              </div>
                            </a>
                          )}
                        </div>
                      )}
                      <div className="px-3 pb-3">
                        {msg.content && !msg.content.startsWith('Shared a file:') && (
                          <p className="text-sm sm:text-base">{msg.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                          {formatMessageTime(msg.created_at)}
                          {msg.is_temp && ' • sending...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  {uploadingFile ? (
                    <Loader2 size={20} className="text-gray-500 animate-spin" />
                  ) : (
                    <Paperclip size={20} className="text-gray-500" />
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    lastMessageRef.current = ''
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg text-gray-900">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing conversations</p>
              <div className="mt-4 flex justify-center">
                {getStatusIndicator()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
