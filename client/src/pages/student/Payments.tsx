import { useState, useEffect } from 'react'
import { paymentsAPI } from '../../services/api'
import { WalletSummary } from '../../types'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function Payments() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWallet()
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'advance': return 'text-blue-400'
      case 'final': return 'text-green-400'
      case 'refund': return 'text-amber-400'
      case 'commission': return 'text-purple-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-1">Payments</h1>
        <p className="text-slate-400">Manage your wallet and transactions</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-green-400">
            ₹{wallet?.total_earned?.toFixed(2) || '0.00'}
          </div>
          <div className="text-slate-400 text-sm">Total Earned</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <TrendingDown className="text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-amber-400">
            ₹{wallet?.total_spent?.toFixed(2) || '0.00'}
          </div>
          <div className="text-slate-400 text-sm">Total Spent</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <DollarSign className="text-primary-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            ₹{wallet?.current_balance?.toFixed(2) || '0.00'}
          </div>
          <div className="text-slate-400 text-sm">Current Balance</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-purple-400">
            ₹{wallet?.pending_payments?.toFixed(2) || '0.00'}
          </div>
          <div className="text-slate-400 text-sm">Pending Payments</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : wallet?.transactions && wallet.transactions.length > 0 ? (
          <div className="space-y-3">
            {wallet.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.transaction_type === 'advance' || tx.transaction_type === 'final' 
                      ? 'bg-green-500/20' 
                      : tx.transaction_type === 'refund'
                      ? 'bg-amber-500/20'
                      : 'bg-purple-500/20'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      tx.transaction_type === 'advance' || tx.transaction_type === 'final' 
                        ? 'text-green-400' 
                        : tx.transaction_type === 'refund'
                        ? 'text-amber-400'
                        : 'text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium capitalize">{tx.transaction_type}</div>
                    <div className="text-sm text-slate-400">
                      {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getTypeColor(tx.transaction_type)}`}>
                    {tx.transaction_type === 'refund' ? '+' : '+'}₹{tx.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-500 capitalize">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  )
}
