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
      case 'advance': return 'text-blue-600'
      case 'final': return 'text-green-600'
      case 'refund': return 'text-amber-600'
      case 'commission': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'commission': return 'bg-purple-100'
      case 'refund': return 'bg-amber-100'
      default: return 'bg-green-100'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Transaction Monitoring</h1>
        <p className="text-gray-500">View all platform transactions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'advance', 'final', 'refund', 'commission'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === type ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeBg(tx.transaction_type)}`}>
                  <DollarSign className={`w-5 h-5 ${getTypeColor(tx.transaction_type)}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900 capitalize">{tx.transaction_type}</div>
                  <div className="text-sm text-gray-500">
                    {tx.description || 'No description'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${getTypeColor(tx.transaction_type)}`}>
                  ₹{tx.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
              No transactions found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
