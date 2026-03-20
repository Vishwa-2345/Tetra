import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI, paymentsAPI } from '../../services/api'
import { WalletSummary, Job } from '../../types'
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import PaymentSuccessModal from '../../components/payment/PaymentSuccessModal'

export default function Payments() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingJobs, setPendingJobs] = useState<Job[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    amount: number
    type: 'advance' | 'final' | 'refund'
  } | null>(null)

  useEffect(() => {
    fetchWallet()
    fetchPendingJobs()
  }, [])

  const fetchWallet = async () => {
    try {
      const { data } = await paymentsAPI.getWallet()
      setWallet(data)
    } catch (error) {
      console.error('Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingJobs = async () => {
    setLoadingPending(true)
    try {
      const { data } = await jobsAPI.getPendingFinalPayments()
      setPendingJobs(data)
    } catch (error) {
      console.error('Failed to load pending jobs')
    } finally {
      setLoadingPending(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'advance': return 'text-blue-600'
      case 'final': return 'text-green-600'
      case 'refund': return 'text-amber-600'
      case 'commission': return 'text-purple-600'
      case 'payout': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payments</h1>
          <p className="text-gray-500">Manage your wallet and transactions</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-green-600">
            ₹{wallet?.total_earned?.toFixed(2) || '0.00'}
          </div>
          <div className="text-gray-500 text-sm">Total Earned</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingDown className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-amber-600">
            ₹{wallet?.total_spent?.toFixed(2) || '0.00'}
          </div>
          <div className="text-gray-500 text-sm">Total Spent</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <DollarSign className="text-primary-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-gray-900">
            ₹{wallet?.current_balance?.toFixed(2) || '0.00'}
          </div>
          <div className="text-gray-500 text-sm">Current Balance</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-purple-600">
            ₹{wallet?.pending_payments?.toFixed(2) || '0.00'}
          </div>
          <div className="text-gray-500 text-sm">Pending Payments</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Final Payments</h2>
              <p className="text-gray-500 text-sm">Jobs awaiting final payment (after 7% commission)</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium">
            {pendingJobs.length} pending
          </span>
        </div>
        
        {loadingPending ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pendingJobs.length > 0 ? (
          <div className="space-y-4">
            {pendingJobs.map((job) => {
              const finalAmount = job.price * 0.5
              const doerPayout = finalAmount - (job.price * 0.05)
              
              return (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">
                        Advance Paid ✓ • Posted {format(new Date(job.created_at), 'MMM d')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">₹{finalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">
                        (₹{doerPayout.toFixed(2)} to doer after 7%)
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/my-jobs/${job.id}`}
                      className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-600 transition-colors"
                    >
                      Pay Now
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 text-sm">No pending final payments</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} /> Transaction History
          </h2>
          <Link to="/dashboard/notifications" className="text-primary-500 text-sm hover:text-primary-600 font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : wallet?.transactions && wallet.transactions.length > 0 ? (
          <div className="space-y-3">
            {wallet.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.transaction_type === 'advance' || tx.transaction_type === 'final' 
                      ? 'bg-green-100' 
                      : tx.transaction_type === 'refund'
                      ? 'bg-amber-100'
                      : tx.transaction_type === 'payout'
                      ? 'bg-blue-100'
                      : 'bg-purple-100'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      tx.transaction_type === 'advance' || tx.transaction_type === 'final' 
                        ? 'text-green-600' 
                        : tx.transaction_type === 'refund'
                        ? 'text-amber-600'
                        : tx.transaction_type === 'payout'
                        ? 'text-blue-600'
                        : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">{tx.transaction_type}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getTypeColor(tx.transaction_type)}`}>
                    +₹{tx.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No transactions yet
          </div>
        )}
      </div>

      {showPaymentSuccess && paymentSuccessData && (
        <PaymentSuccessModal
          open={showPaymentSuccess}
          onClose={() => {
            setShowPaymentSuccess(false)
            setPaymentSuccessData(null)
          }}
          amount={paymentSuccessData.amount}
          type={paymentSuccessData.type}
        />
      )}
    </div>
  )
}
