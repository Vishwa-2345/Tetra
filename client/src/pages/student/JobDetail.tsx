import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { jobsAPI, paymentsAPI, reviewsAPI, usersAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { 
  Briefcase, User, DollarSign, CheckCircle, XCircle, 
  Play, MessageCircle, Star, ArrowLeft, Loader2, Users, Check 
} from 'lucide-react'
import { Job, User as UserType, Application } from '../../types'
import { format } from 'date-fns'
import PaymentSuccessModal from '../../components/payment/PaymentSuccessModal'

interface Review {
  id: number
  job_id: number
  reviewer_id: number
  reviewee_id: number
  rating: number
  feedback: string | null
  created_at: string
  reviewer?: UserType
}

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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    amount: number
    type: 'advance' | 'final' | 'refund'
  } | null>(null)
  const [applicants, setApplicants] = useState<Application[]>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  const isGiver = job?.job_giver_id === user?.id
  const isDoer = job?.job_doer_id === user?.id

  useEffect(() => {
    fetchJob()
  }, [jobId])

  useEffect(() => {
    if (job?.final_paid) {
      fetchReviews()
    }
  }, [job?.final_paid, jobId])

  const fetchJob = async () => {
    try {
      const { data } = await jobsAPI.getById(parseInt(jobId!))
      setJob(data)
      if (data.job_giver_id === user?.id) {
        fetchApplicants(data.id)
        if (data.status === 'pending' && !data.job_doer_id) {
          fetchPotentialDoers(data.skill_required)
        }
      }
    } catch (error) {
      toast.error('Failed to load job')
      navigate('/dashboard/my-jobs', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicants = async (jobId: number) => {
    setLoadingApplicants(true)
    try {
      const { data } = await jobsAPI.getApplications(jobId)
      setApplicants(data)
    } catch (error) {
      console.error('Failed to fetch applicants')
    } finally {
      setLoadingApplicants(false)
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

  const fetchReviews = async () => {
    try {
      const { data } = await reviewsAPI.getByJob(parseInt(jobId!))
      setReviews(data)
    } catch (error) {
      console.error('Failed to fetch reviews')
    }
  }

  const handleStatusUpdate = async (status: string) => {
    setActionLoading(true)
    try {
      await jobsAPI.updateStatus(parseInt(jobId!), status)
      toast.success(`Job status updated to ${status.replace('_', ' ')}`)
      fetchJob()
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update status'
      toast.error(errorMsg, { duration: 4000 })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayAdvance = async () => {
    setActionLoading(true)
    try {
      await paymentsAPI.payAdvance(parseInt(jobId!))
      setPaymentSuccessData({ amount: job!.price * 0.5, type: 'advance' })
      setShowPaymentSuccess(true)
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
      setPaymentSuccessData({ amount: job!.price * 0.5, type: 'final' })
      setShowPaymentSuccess(true)
      fetchJob()
    } catch (error: any) {
      console.error('Pay final error:', error)
      console.error('Full error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      let errorMsg = 'Failed to pay final'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message
        }
      }
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (cancelReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)')
      return
    }
    setSubmittingCancel(true)
    try {
      await paymentsAPI.requestCancellation(parseInt(jobId!), cancelReason)
      toast.success('Cancellation request submitted for admin review')
      setShowCancelModal(false)
      setCancelReason('')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit cancellation request')
    } finally {
      setSubmittingCancel(false)
    }
  }

  const handleAssign = async (doerId: number) => {
    setActionLoading(true)
    try {
      await jobsAPI.assign(parseInt(jobId!), doerId)
      toast.success('Job assigned successfully! Waiting for advance payment.')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to assign job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignFromApplicant = async (applicantId: number) => {
    setActionLoading(true)
    try {
      await jobsAPI.assign(parseInt(jobId!), applicantId)
      toast.success('Job assigned successfully! Waiting for advance payment.')
      fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to assign job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    try {
      // Reviews always go to the DOER (the person who did the work)
      if (!job?.job_doer_id) {
        toast.error('No doer assigned to this job')
        return
      }
      
      await reviewsAPI.create({
        job_id: parseInt(jobId!),
        reviewee_id: job.job_doer_id,
        rating: reviewRating,
        feedback: reviewFeedback
      })
      toast.success('Review submitted for the freelancer')
      setShowReviewModal(false)
      setReviewRating(5)
      setReviewFeedback('')
      fetchReviews()
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
    pending: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    cancellation_pending: 'bg-orange-100 text-orange-700',
  }

  const getCancelWindowInfo = () => {
    if (!job?.assigned_at || !job?.advance_paid || job?.final_paid) return null
    const assignedDate = new Date(job.assigned_at)
    const threeDaysLater = new Date(assignedDate)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const now = new Date()
    const daysRemaining = Math.ceil((threeDaysLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = now > threeDaysLater
    return { daysRemaining, isExpired, deadline: threeDaysLater }
  }

  const cancelWindowInfo = getCancelWindowInfo()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(isGiver ? '/dashboard/my-jobs' : '/dashboard/assigned-jobs')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
              <Briefcase className="text-primary-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-500">
                Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${statusColors[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{job.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-gray-500 text-sm mb-1">Price</div>
            <div className="text-xl font-bold text-green-600">₹{job.price.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-gray-500 text-sm mb-1">Advance (50%)</div>
            <div className="text-xl font-bold text-gray-900">₹{(job.price * 0.5).toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-gray-500 text-sm mb-1">Final (50%)</div>
            <div className="text-xl font-bold text-gray-900">₹{(job.price * 0.5).toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-gray-500 text-sm mb-1">Status</div>
            <div className="text-xl font-bold capitalize text-gray-900">{job.status.replace('_', ' ')}</div>
          </div>
        </div>

        {job.skill_required && (
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-lg bg-primary-50 text-primary-600 text-sm">
              {job.skill_required}
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {job.giver && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} /> Job Giver
            </h3>
            <Link to={`/dashboard/profile/${job.giver.id}`} className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                {job.giver.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{job.giver.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {job.giver.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            </Link>
            {isDoer && (
              <Link to={`/dashboard/chat/${job.giver.id}?job_id=${job.id}`} className="block w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-center font-medium hover:bg-gray-200 transition-colors">
                <MessageCircle size={18} className="inline mr-2" /> Message
              </Link>
            )}
          </div>
        )}

        {job.doer && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} /> Job Doer
            </h3>
            <Link to={`/dashboard/profile/${job.doer.id}`} className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600">
                {job.doer.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{job.doer.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {job.doer.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            </Link>
            {isGiver && (
              <Link to={`/dashboard/chat/${job.doer.id}?job_id=${job.id}`} className="block w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-center font-medium hover:bg-gray-200 transition-colors">
                <MessageCircle size={18} className="inline mr-2" /> Message
              </Link>
            )}
          </div>
        )}

        {isGiver && applicants.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} /> Applicants ({applicants.length})
            </h3>
            
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {applicants.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <Link to={`/dashboard/profile/${applicant.applicant_id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {applicant.applicant?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {applicant.applicant?.name || 'Unknown'}
                          {applicant.applicant?.is_verified && (
                            <CheckCircle size={14} className="text-green-500" />
                          )}
                          {applicant.applicant_id === job.job_doer_id && (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Selected</span>
                          )}
                          {applicant.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Not Selected</span>
                          )}
                          {applicant.status === 'pending' && applicant.applicant_id !== job.job_doer_id && (
                            <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">Pending</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {applicant.applicant?.avg_rating?.toFixed(1) || '0.0'} • 
                          {applicant.applicant?.completed_jobs || 0} jobs done
                        </div>
                        {applicant.message && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">"{applicant.message}"</p>
                        )}
                      </div>
                    </Link>
                    {!job.job_doer_id && applicant.status === 'pending' && (
                      <button
                        onClick={() => handleAssignFromApplicant(applicant.applicant_id)}
                        disabled={actionLoading}
                        className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!job.doer && potentialDoers.length > 0 && job.status === 'pending' && (
              <>
                <h4 className="text-md font-medium text-gray-700 mt-6 mb-3">Suggested Freelancers</h4>
                <div className="space-y-3">
                  {potentialDoers.map((doer) => (
                    <div key={doer.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                      <Link to={`/dashboard/profile/${doer.id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {doer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doer.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {doer.avg_rating?.toFixed(1) || '0.0'} • {doer.skills?.split(',')[0] || 'General'}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleAssign(doer.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {isGiver && job.doer && !job.advance_paid && (
            <button
              onClick={handlePayAdvance}
              disabled={actionLoading}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <DollarSign size={18} /> Pay 50% Advance (₹{(job.price * 0.5).toFixed(2)})
            </button>
          )}

          {isGiver && job.advance_paid && job.status === 'in_progress' && !job.final_paid && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
              <p className="font-medium flex items-center gap-2">
                <CheckCircle size={18} /> 50% Advance Paid
              </p>
              <p className="text-sm mt-1">Final payment will be requested once the doer marks the job as complete.</p>
            </div>
          )}

          {isGiver && job.advance_paid && job.status === 'completed' && !job.final_paid && (
            <button
              onClick={handlePayFinal}
              disabled={actionLoading}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <DollarSign size={18} /> Pay Final 50% (₹{(job.price * 0.5).toFixed(2)})
            </button>
          )}

          {isGiver && job.final_paid && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <p className="font-medium flex items-center gap-2">
                <CheckCircle size={18} /> Job Completed - All Payments Made
              </p>
            </div>
          )}

          {isGiver && !job.doer && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
              <p className="font-medium">Waiting for applicants</p>
              <p className="text-sm mt-1">Assign a freelancer to proceed with the job.</p>
            </div>
          )}

          {isGiver && job.doer && job.advance_paid && !job.final_paid && !['cancelled', 'cancellation_pending'].includes(job.status) && (
            cancelWindowInfo && !cancelWindowInfo.isExpired ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={actionLoading}
                  className="px-6 py-3 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-2 font-medium w-full justify-center"
                >
                  <XCircle size={18} /> Cancel & Refund
                  <span className="text-xs bg-red-100 px-2 py-0.5 rounded ml-2">
                    {cancelWindowInfo.daysRemaining} day{cancelWindowInfo.daysRemaining !== 1 ? 's' : ''} left
                  </span>
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Must cancel within 3 days of assignment. Refund will be sent to your UPI.
                </p>
              </div>
            ) : (
              <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-4 text-gray-500">
                <p className="font-medium">Cancel window has expired</p>
                <p className="text-sm mt-1">The 3-day cancellation window has passed since assignment.</p>
              </div>
            )
          )}

          {isGiver && !job.doer && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
              <p className="font-medium">Assign a doer to enable cancellation</p>
              <p className="text-sm mt-1">You can only cancel a job after assigning a freelancer.</p>
            </div>
          )}

          {isGiver && job.doer && !job.advance_paid && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
              <p className="font-medium">Pay advance to enable cancellation</p>
              <p className="text-sm mt-1">You can only cancel after paying the advance amount.</p>
            </div>
          )}

          {job.status === 'cancellation_pending' && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
              <p className="font-medium flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Cancellation Pending Review
              </p>
              <p className="text-sm mt-1">Your cancellation request is being reviewed by admin.</p>
            </div>
          )}

          {isDoer && job.job_doer_id === user?.id && !job.advance_paid && (
            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-4 text-gray-600">
              <p className="font-medium">Waiting for advance payment</p>
              <p className="text-sm mt-1">The job giver needs to pay 50% advance before you can start work.</p>
            </div>
          )}

          {isDoer && job.advance_paid && job.status === 'assigned' && (
            <button
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={actionLoading}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Play size={18} /> Start Job
            </button>
          )}

          {isDoer && job.status === 'in_progress' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={actionLoading}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle size={18} /> Mark Complete
            </button>
          )}

          {job.status === 'completed' && (isGiver || isDoer) && !job.final_paid && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
              <p className="font-medium">Waiting for final payment</p>
              <p className="text-sm mt-1">The job giver needs to release the final payment.</p>
            </div>
          )}

          {job.status === 'completed' && (isGiver || isDoer) && job.final_paid && (
            <div className="space-y-4">
              {/* Review prompt - Only show for job giver to review the doer */}
              {isGiver && !reviews.some(r => r.reviewer_id === user?.id) && job.doer && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100 flex items-center gap-3 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star size={24} className="text-amber-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-amber-800">Leave a Review for {job.doer.name}</p>
                    <p className="text-sm text-amber-600">Share your experience with this freelancer</p>
                  </div>
                </button>
              )}
              
              {!isGiver && !reviews.some(r => r.reviewer_id === user?.id) && job.doer && (
                <div className="px-6 py-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Star size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Reviews will appear here</p>
                    <p className="text-sm text-gray-500">The job giver can leave a review for the freelancer</p>
                  </div>
                </div>
              )}
              
              {reviews.some(r => r.reviewer_id === user?.id) && (
                <div className="px-6 py-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Review Submitted</p>
                    <p className="text-sm text-green-600">Thank you for your feedback!</p>
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-bold">
                                {review.reviewer?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.reviewer?.name || 'User'}</p>
                              <p className="text-sm text-gray-500">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.feedback && (
                          <p className="text-gray-600 mt-2">{review.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReviewRating(r)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Star
                      size={28}
                      className={r <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 min-h-[100px] resize-none"
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentSuccess && paymentSuccessData && (
        <PaymentSuccessModal
          open={showPaymentSuccess}
          onClose={() => {
            setShowPaymentSuccess(false)
            setPaymentSuccessData(null)
          }}
          amount={paymentSuccessData.amount}
          type={paymentSuccessData.type}
        />
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Cancellation</h3>
            <p className="text-gray-500 text-sm mb-4">
              Please provide a detailed reason for cancellation. This will be reviewed by admin.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Cancellation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 min-h-[120px] resize-none"
                placeholder="Explain why you need to cancel this job (minimum 10 characters)..."
              />
              <p className="text-xs text-gray-400 mt-1">{cancelReason.length}/10 minimum characters</p>
            </div>
            <div className="mb-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> Refund will be processed to your UPI ID after admin approval.
                You can only cancel within 3 days of job creation.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                }}
                disabled={submittingCancel}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={submittingCancel || cancelReason.trim().length < 10}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingCancel ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
