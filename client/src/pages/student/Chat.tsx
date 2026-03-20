import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useChatStore, useAuthStore } from '../../store'
import { format } from 'date-fns'
import { ArrowLeft, Send, Phone, Video, MoreVertical, Search, Wifi, WifiOff, RefreshCw, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Chat() {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageRef = useRef<string>('')

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
    if (userId) {
      const numericUserId = parseInt(userId)
      setCurrentChat(numericUserId)
      fetchMessages(numericUserId)
      markConversationRead(numericUserId)
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const handleRetry = () => {
    clearWsError()
    connectWebSocket()
  }

  const getStatusIndicator = () => {
    switch (wsStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs">Connected</span>
          </div>
        )
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Connecting...</span>
          </div>
        )
      case 'error':
        return (
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
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
            className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
          >
            <LogIn size={14} />
            <span className="text-xs">Login Required</span>
          </Link>
        )
      default:
        return (
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
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

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
      <div className="w-80 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            {getStatusIndicator()}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-primary-500 outline-none"
              placeholder="Search conversations..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredConversations.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => {
                setCurrentChat(conv.user_id)
                fetchMessages(conv.user_id)
                markConversationRead(conv.user_id)
                navigate(`/dashboard/chat/${conv.user_id}`)
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                currentChat === conv.user_id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-lg font-bold relative flex-shrink-0">
                {conv.user_name?.charAt(0).toUpperCase() || 'U'}
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{conv.user_name}</div>
                <div className={`text-sm truncate ${conv.unread_count > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {conv.last_message || 'No messages yet'}
                </div>
              </div>
              {conv.last_message_time && (
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {format(new Date(conv.last_message_time), 'HH:mm')}
                </span>
              )}
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        {currentChat && currentConversation ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Link to="/dashboard/chat" className="lg:hidden p-1 hover:bg-white/10 rounded-lg">
                <ArrowLeft size={20} />
              </Link>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center font-bold flex-shrink-0">
                {currentConversation.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{currentConversation.user_name}</div>
                <div className="flex items-center gap-2">
                  {wsStatus === 'connected' ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Online
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Phone size={20} className="text-slate-400" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Video size={20} className="text-slate-400" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <MoreVertical size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-dark-200 to-dark-100">
              {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
                <div className={`text-center py-2 px-4 rounded-lg mb-4 ${
                  wsStatus === 'error' || wsStatus === 'auth_error' 
                    ? 'bg-red-500/10 text-red-400' 
                    : 'bg-slate-500/10 text-slate-400'
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
                <div className="text-center text-slate-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
              {currentMessages.map((msg: any, index: number) => {
                const isOwn = msg.sender_id === user?.id
                const showAvatar = index === 0 || currentMessages[index - 1]?.sender_id !== msg.sender_id
                
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                        {currentConversation.user_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8 mr-2" />}
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        isOwn
                          ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white rounded-br-md'
                          : 'bg-white/10 rounded-bl-md'
                      } ${msg.is_temp ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm sm:text-base">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-slate-500'}`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                        {msg.is_temp && ' • sending...'}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-dark-200">
              <div className="flex gap-3">
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
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500 outline-none"
                  placeholder={wsStatus === 'connected' ? "Type a message..." : "Type a message..."}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg">Select a conversation</p>
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
