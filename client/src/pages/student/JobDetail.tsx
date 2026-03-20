import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { jobsAPI, paymentsAPI, reviewsAPI, usersAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { 
  Briefcase, User, DollarSign, CheckCircle, XCircle, 
  Play, MessageCircle, Star, ArrowLeft 
} from 'lucide-react'
import { Job, User as UserType } from '../../types'
import { format } from 'date-fns'

export default function JobDetail() {
  const { jobId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [potentialDoers, setPotentialDoers] = useState<UserType[]>([])

  const isGiver = job?.job_giver_id === user?.id
  const isDoer = job?.job_doer_id === user?.id

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const { data } = await jobsAPI.getById(parseInt(jobId!))
      setJob(data)
      if (data.status === 'pending' && isGiver) {
        fetchPotentialDoers(data.skill_required)
      }
    } catch (error) {
      toast.error('Failed to load job')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const fetchPotentialDoers = async (skill?: string) => {
    try {
      const { data } = await usersAPI.list({ skill, verified_only: true })
      setPotentialDoers(data.filter((u: UserType) => u.id !== user?.id).slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch potential doers')
    }
  }

  const handleStatusUpdate = async (status: string) => {
    setActionLoading(true)
    try {
      await jobsAPI.updateStatus(parseInt(jobId!), status)
      toast.success(`Job ${status.replace('_', ' ')}`)
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayAdvance = async () => {
    setActionLoading(true)
    try {
      await paymentsAPI.payAdvance(parseInt(jobId!))
      toast.success('50% advance paid successfully')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to pay advance')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayFinal = async () => {
    setActionLoading(true)
    try {
      await paymentsAPI.payFinal(parseInt(jobId!))
      toast.success('Final payment completed!')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to pay final')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefund = async () => {
    setActionLoading(true)
    try {
      await paymentsAPI.requestRefund(parseInt(jobId!))
      toast.success('Refund processed')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to process refund')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssign = async (doerId: number) => {
    setActionLoading(true)
    try {
      await jobsAPI.assign(parseInt(jobId!), doerId)
      toast.success('Job assigned successfully')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to assign job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    try {
      const revieweeId = isGiver ? job?.job_doer_id : job?.job_giver_id
      if (!revieweeId) return
      
      await reviewsAPI.create({
        job_id: parseInt(jobId!),
        reviewee_id: revieweeId,
        rating: reviewRating,
        feedback: reviewFeedback
      })
      toast.success('Review submitted')
      setShowReviewModal(false)
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit review')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) return null

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
              <Briefcase className="text-primary-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="text-slate-400">
                Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border capitalize ${statusColors[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-slate-300 mb-6 whitespace-pre-wrap">{job.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-slate-400 text-sm mb-1">Price</div>
            <div className="text-xl font-bold text-green-400">₹{job.price.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-slate-400 text-sm mb-1">Advance (50%)</div>
            <div className="text-xl font-bold">₹{(job.price * 0.5).toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-slate-400 text-sm mb-1">Final (50%)</div>
            <div className="text-xl font-bold">₹{(job.price * 0.5).toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-slate-400 text-sm mb-1">Status</div>
            <div className="text-xl font-bold capitalize">{job.status.replace('_', ' ')}</div>
          </div>
        </div>

        {job.skill_required && (
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-sm">
              {job.skill_required}
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {job.giver && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} /> Job Giver
            </h3>
            <Link to={`/dashboard/profile/${job.giver.id}`} className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-lg font-bold">
                {job.giver.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{job.giver.name}</div>
                <div className="text-sm text-slate-400 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {job.giver.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            </Link>
            {isDoer && (
              <Link to={`/dashboard/chat/${job.giver.id}?job_id=${job.id}`} className="btn-secondary w-full py-2 rounded-lg text-center">
                <MessageCircle size={18} className="inline mr-2" /> Message
              </Link>
            )}
          </div>
        )}

        {job.doer && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} /> Job Doer
            </h3>
            <Link to={`/dashboard/profile/${job.doer.id}`} className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg font-bold">
                {job.doer.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{job.doer.name}</div>
                <div className="text-sm text-slate-400 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {job.doer.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            </Link>
            {isGiver && (
              <Link to={`/dashboard/chat/${job.doer.id}?job_id=${job.id}`} className="btn-secondary w-full py-2 rounded-lg text-center">
                <MessageCircle size={18} className="inline mr-2" /> Message
              </Link>
            )}
          </div>
        )}

        {!job.doer && job.status === 'pending' && isGiver && potentialDoers.length > 0 && (
          <div className="glass rounded-2xl p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Assign to a Freelancer</h3>
            <div className="space-y-3">
              {potentialDoers.map((doer) => (
                <div key={doer.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center">
                      {doer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{doer.name}</div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {doer.avg_rating?.toFixed(1) || '0.0'} • {doer.skills?.split(',')[0] || 'General'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(doer.id)}
                    disabled={actionLoading}
                    className="btn-primary px-4 py-2 rounded-lg"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {isGiver && !job.advance_paid && job.doer && (
            <button
              onClick={handlePayAdvance}
              disabled={actionLoading}
              className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <DollarSign size={18} /> Pay 50% Advance (₹{(job.price * 0.5).toFixed(2)})
            </button>
          )}

          {isGiver && job.advance_paid && !job.final_paid && job.status === 'in_progress' && (
            <button
              onClick={handlePayFinal}
              disabled={actionLoading}
              className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <DollarSign size={18} /> Pay Final 50% (₹{(job.price * 0.5).toFixed(2)})
            </button>
          )}

          {isGiver && !job.final_paid && (job.status === 'pending' || job.status === 'assigned') && (
            <button
              onClick={handleRefund}
              disabled={actionLoading}
              className="px-6 py-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-2"
            >
              <XCircle size={18} /> Cancel & Refund
            </button>
          )}

          {isDoer && job.status === 'assigned' && (
            <button
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={actionLoading}
              className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Play size={18} /> Start Job
            </button>
          )}

          {isDoer && job.status === 'in_progress' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={actionLoading}
              className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <CheckCircle size={18} /> Mark Complete
            </button>
          )}

          {job.status === 'completed' && (isGiver || isDoer) && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-3 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-2"
            >
              <Star size={18} /> Leave Review
            </button>
          )}
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>
            <div className="mb-4">
              <label className="block text-sm mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReviewRating(r)}
                    className="p-2 rounded-lg hover:bg-white/10"
                  >
                    <Star
                      size={28}
                      className={r <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2">Feedback</label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full px-4 py-3 rounded-xl min-h-[100px] resize-none"
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-lg btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-3 rounded-lg btn-primary"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
