import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { User } from '../../types'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'suspended'>('all')

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filter === 'verified') params.verified = true
      if (filter === 'suspended') params.suspended = true
      const { data } = await adminAPI.getUsers(params)
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: number) => {
    try {
      await adminAPI.verifyUser(id)
      toast.success('User verified')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to verify user')
    }
  }

  const handleSuspend = async (id: number, suspend: boolean) => {
    try {
      await adminAPI.suspendUser(id, suspend)
      toast.success(`User ${suspend ? 'suspended' : 'unsuspended'}`)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
        <p className="text-gray-500">Manage platform users</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'verified', 'suspended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === f ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.is_verified && <CheckCircle className="text-green-500" size={16} />}
                      {user.is_suspended && <XCircle className="text-red-500" size={16} />}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!user.is_verified && (
                    <button
                      onClick={() => handleVerify(user.id)}
                      className="px-4 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle size={16} /> Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleSuspend(user.id, !user.is_suspended)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                      user.is_suspended
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <XCircle size={16} />
                    {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
