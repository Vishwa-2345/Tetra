import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Briefcase, CheckCircle, DollarSign, Plus } from 'lucide-react'
import { Job } from '../../types'
import { format } from 'date-fns'

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data } = await jobsAPI.getMyJobs()
      setJobs(data)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Jobs</h1>
          <p className="text-slate-400">Jobs you've posted</p>
        </div>
        <Link
          to="/dashboard/create-job"
          className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Post Job
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-48 mb-4" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Link key={job.id} to={`/dashboard/my-jobs/${job.id}`} className="block">
              <div className="glass rounded-2xl p-6 hover-lift">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                      <Briefcase className="text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <p className="text-slate-400 text-sm">
                        Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-slate-400 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-green-400" />
                      <span className="font-semibold">₹{job.price.toFixed(2)}</span>
                    </div>
                    {job.doer && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-xs">
                          {job.doer.name.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-400">{job.doer.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {job.advance_paid && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle size={14} /> 50% Paid
                      </span>
                    )}
                    {job.final_paid && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle size={14} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-slate-500 mb-4">Post your first job to get started</p>
              <Link to="/dashboard/create-job" className="btn-primary px-6 py-2 rounded-lg inline-flex items-center gap-2">
                <Plus size={18} /> Post Job
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
