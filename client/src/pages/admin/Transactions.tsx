import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Transaction } from '../../types'
import { DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getTransactions(filter === 'all' ? undefined : filter)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions')
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
        <h1 className="text-3xl font-bold mb-1">Transaction Monitoring</h1>
        <p className="text-slate-400">View all platform transactions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'advance', 'final', 'refund', 'commission'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === type ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="glass rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.transaction_type === 'commission' ? 'bg-purple-500/20' :
                  tx.transaction_type === 'refund' ? 'bg-amber-500/20' :
                  'bg-green-500/20'
                }`}>
                  <DollarSign className={`w-5 h-5 ${getTypeColor(tx.transaction_type)}`} />
                </div>
                <div>
                  <div className="font-medium capitalize">{tx.transaction_type}</div>
                  <div className="text-sm text-slate-400">
                    {tx.description || 'No description'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${getTypeColor(tx.transaction_type)}`}>
                  ₹{tx.amount.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No transactions found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
