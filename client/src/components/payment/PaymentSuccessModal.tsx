import { CheckCircle, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PaymentSuccessModalProps {
  open: boolean
  onClose: () => void
  amount: number
  type: 'advance' | 'final' | 'refund'
  transactionId?: string
}

export default function PaymentSuccessModal({ 
  open, 
  onClose, 
  amount, 
  type,
  transactionId 
}: PaymentSuccessModalProps) {
  if (!open) return null

  const typeLabels = {
    advance: 'Advance Payment',
    final: 'Final Payment',
    refund: 'Refund Processed'
  }

  const generateMockId = () => {
    return `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-lg">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
        <p className="text-gray-500 text-sm mb-6">(Mock Payment)</p>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <DollarSign className="text-green-600" size={28} />
            <span className="text-4xl font-bold text-green-600">₹{amount.toFixed(2)}</span>
          </div>
          <div className="text-gray-600">
            {typeLabels[type]}
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-6">
          Transaction ID: {transactionId || generateMockId()}
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard/payments"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            View Transactions
          </Link>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
