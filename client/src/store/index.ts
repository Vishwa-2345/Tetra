import { create } from 'zustand';
import { User, DashboardStats, Conversation, Notification } from '../types';
import { usersAPI, notificationsAPI, messagesAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await usersAPI.getDashboardStats();
      set({ stats: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await notificationsAPI.list();
      set({ notifications: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationsAPI.getUnreadCount();
      set({ unreadCount: data.count });
    } catch (error) {
      console.error('Failed to fetch unread count');
    }
  },
  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      set({
        notifications: get().notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        unreadCount: Math.max(0, get().unreadCount - 1)
      });
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  },
  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      set({
        notifications: get().notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      });
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  },
}));

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'auth_error';

interface ChatState {
  conversations: Conversation[];
  currentChat: number | null;
  messages: Record<number, any[]>;
  isLoading: boolean;
  ws: WebSocket | null;
  wsConnecting: boolean;
  wsRetryCount: number;
  wsStatus: ConnectionStatus;
  wsError: string | null;
  fetchConversations: () => Promise<void>;
  fetchMessages: (userId: number) => Promise<void>;
  sendMessage: (receiverId: number, content: string, jobId?: number, attachmentUrl?: string, attachmentType?: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: (reason?: string) => void;
  setCurrentChat: (userId: number | null) => void;
  markConversationRead: (userId: number) => void;
  clearWsError: () => void;
}

const AUTH_ERROR_CODES = [4001, 4002, 4003, 4004, 4005];
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 2000;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentChat: null,
  messages: {},
  isLoading: false,
  ws: null,
  wsConnecting: false,
  wsRetryCount: 0,
  wsStatus: 'disconnected',
  wsError: null,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const { data } = await messagesAPI.getConversations();
      set({ conversations: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (userId) => {
    set({ isLoading: true });
    try {
      const { data } = await messagesAPI.getMessages(userId);
      set({
        messages: { ...get().messages, [userId]: data },
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  sendMessage: (receiverId, content, jobId, attachmentUrl, attachmentType) => {
    const { ws, wsStatus } = get();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const tempId = `temp_${Date.now()}`;
    
    if (wsStatus !== 'connected' || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, sending via API');
      messagesAPI.send({ 
        receiver_id: receiverId, 
        content, 
        job_id: jobId,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      })
        .then((response) => {
          const { messages } = get();
          const newMessage = {
            id: response.data.id,
            sender_id: user?.id,
            receiver_id: receiverId,
            content,
            job_id: jobId,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
            created_at: response.data.created_at || new Date().toISOString(),
            is_read: false
          };
          set({
            messages: {
              ...messages,
              [receiverId]: [...(messages[receiverId] || []), newMessage]
            }
          });
          get().fetchConversations();
        })
        .catch(console.error);
      return;
    }
    
    const messageData = JSON.stringify({
      type: 'message',
      receiver_id: receiverId,
      content,
      job_id: jobId,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType
    });
    ws.send(messageData);
    
    const { messages } = get();
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      receiver_id: receiverId,
      content,
      job_id: jobId,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      created_at: new Date().toISOString(),
      is_temp: true
    };
    set({
      messages: {
        ...messages,
        [receiverId]: [...(messages[receiverId] || []), tempMessage]
      }
    });
  },

  connectWebSocket: () => {
    const { ws, wsConnecting, wsRetryCount, wsStatus } = get();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }
    
    if (wsConnecting) {
      return;
    }

    if (wsStatus === 'auth_error') {
      console.log('WebSocket auth error - not retrying. Please login again.');
      return;
    }

    if (wsRetryCount >= MAX_RETRY_ATTEMPTS) {
      console.log('Max WebSocket retry attempts reached');
      set({ wsStatus: 'error', wsError: 'Connection failed after multiple attempts. Please refresh the page.' });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available for WebSocket connection');
      set({ wsStatus: 'auth_error', wsError: 'Please login to use chat' });
      return;
    }

    set({ wsConnecting: true, wsStatus: 'connecting', wsError: null });

    const wsUrl = `ws://localhost:8000/ws/chat?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected successfully');
      set({ wsConnecting: false, wsRetryCount: 0 });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('WebSocket authenticated:', data.message);
          set({ wsStatus: 'connected', wsConnecting: false, wsRetryCount: 0 });
          return;
        }

        if (data.type === 'error') {
          console.error('WebSocket server error:', data.code, data.error, data.message);
          
          if (AUTH_ERROR_CODES.includes(data.code)) {
            set({ 
              wsStatus: 'auth_error', 
              wsError: data.message || 'Authentication failed. Please login again.',
              wsConnecting: false,
              wsRetryCount: MAX_RETRY_ATTEMPTS
            });
            socket.close();
            return;
          }
          
          set({ wsError: data.message || 'Server error occurred' });
          return;
        }
        
        if (data.type === 'message') {
          const { messages, currentChat } = get();
          const chatId = data.sender_id === currentChat ? data.sender_id : data.receiver_id;
          
          if (messages[chatId]) {
            const tempMessages = messages[chatId].filter(m => m.is_temp && m.content === data.content && m.sender_id === data.sender_id);
            
            if (tempMessages.length > 0) {
              const otherMessages = messages[chatId].filter(m => !m.is_temp || m.content !== data.content || m.sender_id !== data.sender_id);
              set({
                messages: {
                  ...messages,
                  [chatId]: [...otherMessages, data]
                }
              });
            } else {
              const existingIds = messages[chatId].map(m => m.id);
              if (!existingIds.includes(data.id)) {
                set({
                  messages: {
                    ...messages,
                    [chatId]: [...messages[chatId], data]
                  }
                });
              }
            }
          } else {
            set({
              messages: {
                ...messages,
                [chatId]: [data]
              }
            });
          }
          get().fetchConversations();
        }

        if (data.type === 'read_receipt') {
          console.log('Message read receipt:', data);
        }

        if (data.type === 'typing') {
          console.log('User typing:', data.sender_name);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      
      const closeCode = event.code;
      
      if (AUTH_ERROR_CODES.includes(closeCode)) {
        set({ 
          ws: null, 
          wsConnecting: false, 
          wsStatus: 'auth_error',
          wsError: 'Session expired. Please login again.'
        });
        return;
      }

      if (event.wasClean) {
        set({ ws: null, wsConnecting: false, wsStatus: 'disconnected' });
        return;
      }

      const currentRetry = get().wsRetryCount;
      if (currentRetry < MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, currentRetry), 30000);
        console.log(`Retrying WebSocket connection in ${delay}ms (attempt ${currentRetry + 1}/${MAX_RETRY_ATTEMPTS})`);
        set({ 
          ws: null, 
          wsConnecting: false, 
          wsRetryCount: currentRetry + 1,
          wsStatus: 'connecting'
        });
        setTimeout(() => get().connectWebSocket(), delay);
      } else {
        set({ 
          ws: null, 
          wsConnecting: false, 
          wsStatus: 'error',
          wsError: 'Unable to connect to chat server. Please refresh the page.'
        });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ wsConnecting: false });
    };

    set({ ws: socket });
  },

  disconnectWebSocket: (reason = 'manual') => {
    const { ws } = get();
    if (ws) {
      ws.onclose = null;
      ws.close(1000, reason);
      set({ ws: null, wsStatus: 'disconnected', wsRetryCount: 0 });
    }
  },

  setCurrentChat: (userId) => set({ currentChat: userId }),

  markConversationRead: (userId) => {
    const { ws, wsStatus } = get();
    if (wsStatus === 'connected' && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'read',
        sender_id: userId
      }));
    }
  },

  clearWsError: () => set({ wsError: null, wsStatus: 'disconnected', wsRetryCount: 0 }),
}));

const originalLogout = useAuthStore.getState().logout;
useAuthStore.setState({
  logout: () => {
    const chatStore = useChatStore.getState();
    chatStore.disconnectWebSocket('logged_out');
    originalLogout();
  }
});
