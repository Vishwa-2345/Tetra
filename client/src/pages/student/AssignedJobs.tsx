import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Briefcase, CheckCircle, Play } from 'lucide-react'
import { Job } from '../../types'
import { format } from 'date-fns'

export default function AssignedJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data } = await jobsAPI.getAssignedJobs()
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
    pending: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Assigned Jobs</h1>
        <p className="text-gray-500">Jobs assigned to you</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Link key={job.id} to={`/dashboard/assigned-jobs/${job.id}`} className="block">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Briefcase className="text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                      <p className="text-gray-500 text-sm">
                        From {job.giver?.name} • {format(new Date(job.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-gray-500 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <span>₹{job.price.toFixed(2)}</span>
                    {job.advance_paid && (
                      <span className="text-sm font-normal text-gray-400">(+ ₹{job.advance_amount?.toFixed(2)} advance)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'assigned' && (
                      <span className="text-blue-600 text-sm flex items-center gap-1 font-medium">
                        <Play size={14} /> Accept to Start
                      </span>
                    )}
                    {job.status === 'in_progress' && (
                      <span className="text-purple-600 text-sm flex items-center gap-1 font-medium">
                        <CheckCircle size={14} /> In Progress
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="text-green-600 text-sm flex items-center gap-1 font-medium">
                        <CheckCircle size={14} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned jobs</h3>
              <p className="text-gray-500">Jobs will appear here when assigned to you</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
