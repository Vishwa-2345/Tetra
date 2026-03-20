export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  profile_photo?: string;
  skills?: string;
  experience?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  projects?: string;
  bio?: string;
  upi_id?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  is_verified: boolean;
  is_suspended: boolean;
  is_profile_complete: boolean;
  wallet_balance: number;
  created_at: string;
  avg_rating?: number;
  total_reviews?: number;
  completed_jobs?: number;
  distance_km?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  skill_required?: string;
  price: number;
  status: string;
  job_giver_id: number;
  job_doer_id?: number;
  advance_paid: boolean;
  advance_amount: number;
  final_paid: boolean;
  final_amount: number;
  created_at: string;
  completed_at?: string;
  giver?: User;
  doer?: User;
  avg_rating?: number;
}

export interface Transaction {
  id: number;
  job_id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  status: string;
  description?: string;
  created_at: string;
}

export interface Review {
  id: number;
  job_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  feedback?: string;
  created_at: string;
  reviewer?: User;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  job_id?: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: number;
  created_at: string;
}

export interface WalletSummary {
  total_earned: number;
  total_spent: number;
  current_balance: number;
  pending_payments: number;
  transactions: Transaction[];
}

export interface AdminStats {
  total_users: number;
  total_jobs: number;
  completed_jobs: number;
  pending_jobs: number;
  total_revenue: number;
  total_commission: number;
  verified_users: number;
  suspended_users: number;
}

export interface Conversation {
  user_id: number;
  user_name: string;
  user_photo?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface DashboardStats {
  total_jobs_given: number;
  completed_jobs_given: number;
  total_jobs_done: number;
  completed_jobs_done: number;
  pending_payments: number;
  wallet_balance: number;
  is_profile_complete: boolean;
  completed_jobs: number;
  avg_rating?: number;
  total_reviews: number;
}
