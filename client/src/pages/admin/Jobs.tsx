import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Job } from '../../types'
import { format } from 'date-fns'

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
    pending: 'bg-amber-500/20 text-amber-400',
    assigned: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-1">Job Management</h1>
        <p className="text-slate-400">View and manage all platform jobs</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === status ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{job.description.slice(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                    <span>By: {job.giver?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <div className="text-lg font-bold text-green-400 mt-2">₹{job.price.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No jobs found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
