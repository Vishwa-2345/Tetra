import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Job } from '../../types'
import { format } from 'date-fns'
import { Briefcase, User, ArrowRight } from 'lucide-react'

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getJobs(filter === 'all' ? undefined : filter)
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Job Management</h1>
          <p className="text-gray-500">View and manage all platform jobs</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === status ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Briefcase className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                    <p className="text-gray-500 text-sm">{format(new Date(job.created_at), 'MMM d, yyyy • h:mm a')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <div className="text-lg font-bold text-green-600 mt-2">₹{job.price.toFixed(2)}</div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 flex-1">
                  <User size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-500">Created by:</span>
                  <span className="text-sm font-medium text-gray-900">{job.giver?.name || 'Unknown'}</span>
                  {job.giver?.email && (
                    <span className="text-xs text-gray-400">({job.giver.email})</span>
                  )}
                </div>
                
                {job.doer ? (
                  <div className="flex items-center gap-2 flex-1">
                    <ArrowRight size={16} className="text-gray-300 hidden sm:block" />
                    <User size={16} className="text-purple-500" />
                    <span className="text-sm text-gray-500">Assigned to:</span>
                    <span className="text-sm font-medium text-gray-900">{job.doer?.name || 'Unknown'}</span>
                    {job.doer?.email && (
                      <span className="text-xs text-gray-400">({job.doer.email})</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <ArrowRight size={16} className="text-gray-300 hidden sm:block" />
                    <User size={16} className="text-gray-300" />
                    <span className="text-sm text-gray-400 italic">No doer assigned yet</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                {job.advance_paid && (
                  <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-600">Advance Paid</span>
                )}
                {job.final_paid && (
                  <span className="px-2 py-1 rounded text-xs bg-green-50 text-green-600">Final Paid</span>
                )}
                {job.skill_required && (
                  <span className="px-2 py-1 rounded text-xs bg-purple-50 text-purple-600">{job.skill_required}</span>
                )}
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No jobs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
