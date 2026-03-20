import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI, jobsAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { Search, Star, MapPin, Filter, X, MessageCircle, Briefcase, Clock, DollarSign, Users, ExternalLink, Github, Linkedin, Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react'
import { User, Job } from '../../types'

const skillOptions = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'design', label: 'UI/UX Design' },
  { value: 'writing', label: 'Content Writing' },
  { value: 'data', label: 'Data Analysis' },
  { value: 'video', label: 'Video Editing' },
]

const ratingOptions = [
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
]

interface ProfileModalProps {
  user: User
  onClose: () => void
}

function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  useEffect(() => {
    fetchUserJobs()
  }, [user.id])

  const fetchUserJobs = async () => {
    setLoadingJobs(true)
    try {
      const { data } = await jobsAPI.getByUser(user.id)
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch user jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    assigned: { bg: 'bg-blue-100', text: 'text-blue-700' },
    in_progress: { bg: 'bg-purple-100', text: 'text-purple-700' },
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
              ← Back
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                {user.is_verified && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={16} className="fill-amber-400" />
                <span>{user.avg_rating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">({user.total_reviews || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{user.completed_jobs || 0} jobs completed</span>
                {user.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {user.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {user.skills && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Freelancing Abilities / Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.split(',').map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-primary-50 text-primary-600 text-sm">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.experience && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Experience</h3>
              <p className="text-gray-700">{user.experience}</p>
            </div>
          )}

          {user.projects && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Projects</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{user.projects}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Links</h3>
            <div className="space-y-2">
              {user.github && (
                <a href={user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors text-sm">
                  <Github size={16} /> {user.github}
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              )}
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors text-sm">
                  <Linkedin size={16} /> {user.linkedin}
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              )}
              {user.portfolio && (
                <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors text-sm">
                  <LinkIcon size={16} /> Portfolio
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              )}
              {!user.github && !user.linkedin && !user.portfolio && (
                <p className="text-gray-400 text-sm">No links added</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <Briefcase size={20} /> Posted Jobs ({jobs.length})
            </h3>
            
            {loadingJobs ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link key={job.id} to={`/dashboard/my-jobs/${job.id}`} onClick={onClose} className="block p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[job.status]?.bg} ${statusColors[job.status]?.text}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <DollarSign size={14} /> {job.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No jobs posted yet
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <Link to={`/dashboard/chat?user=${user.id}`} onClick={onClose} className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
            <MessageCircle size={18} /> Contact {user.name.split(' ')[0]}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Explore() {
  const { user } = useAuthStore()
  const [mode, setMode] = useState<'users' | 'jobs'>('users')
  
  const [freelancers, setFreelancers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchUsers, setSearchUsers] = useState('')
  const [skill, setSkill] = useState('')
  const [minRating, setMinRating] = useState<number | undefined>()
  const [showNearby, setShowNearby] = useState(false)
  const [nearbyRadius, setNearbyRadius] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState<User | null>(null)
  const [locationError, setLocationError] = useState('')

  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [searchJobs, setSearchJobs] = useState('')
  const [jobSkill, setJobSkill] = useState('')
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null)

  useEffect(() => {
    if (mode === 'users') {
      fetchFreelancers()
    } else {
      fetchJobs()
    }
  }, [skill, minRating, showNearby, mode, jobSkill, nearbyRadius])

  const fetchFreelancers = async () => {
    setLoadingUsers(true)
    setLocationError('')
    try {
      if (showNearby) {
        if (!user?.latitude || !user?.longitude) {
          setLocationError('Please set your location in profile to use nearby search')
          setLoadingUsers(false)
          return
        }
        const { data } = await usersAPI.getNearby({
          latitude: user.latitude,
          longitude: user.longitude,
          radius_km: nearbyRadius
        })
        setFreelancers(data.filter((u: User) => u.id !== user?.id))
      } else {
        const { data } = await usersAPI.list({ skill: skill || undefined, min_rating: minRating })
        setFreelancers(data.filter((u: User) => u.id !== user?.id))
      }
    } catch (error) {
      console.error('Failed to load freelancers')
      toast.error('Failed to load freelancers')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchJobs = async () => {
    setLoadingJobs(true)
    setLocationError('')
    try {
      const { data } = await jobsAPI.list({ 
        skill: jobSkill || undefined
      })
      let openJobs = data.filter((j: Job) => j.job_giver_id !== user?.id && j.status === 'pending')
      
      if (showNearby && user?.latitude && user?.longitude) {
        const userLat = user.latitude
        const userLon = user.longitude
        openJobs = openJobs.filter((j: Job) => {
          if (j.giver?.latitude && j.giver?.longitude) {
            const distance = calculateDistance(
              userLat, userLon,
              j.giver.latitude, j.giver.longitude
            )
            return distance <= nearbyRadius
          }
          return false
        })
      }
      
      setJobs(openJobs)
    } catch (error) {
      console.error('Failed to load jobs')
      toast.error('Failed to load jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const filteredFreelancers = freelancers.filter((f) =>
    f.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    f.skills?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(searchJobs.toLowerCase()) ||
    j.description?.toLowerCase().includes(searchJobs.toLowerCase())
  )

  const handleApply = async (jobId: number) => {
    setApplyingJobId(jobId)
    try {
      await jobsAPI.apply(jobId)
      toast.success('Application submitted successfully!')
      fetchJobs()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to apply for job')
    } finally {
      setApplyingJobId(null)
    }
  }

  const jobStatusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    assigned: { bg: 'bg-blue-100', text: 'text-blue-700' },
    in_progress: { bg: 'bg-purple-100', text: 'text-purple-700' },
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
  }

  return (
    <div className="animate-fade-in">
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Explore</h1>
            <p className="text-gray-500 text-sm">Find freelancers or browse jobs</p>
          </div>
          
          {/* Mode Toggle with Clear Indicators */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                mode === 'users'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={18} className={mode === 'users' ? 'animate-pulse' : ''} />
              <span>Freelancers</span>
              {mode === 'users' && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  🔍
                </span>
              )}
            </button>
            <button
              onClick={() => setMode('jobs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                mode === 'jobs'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Briefcase size={18} className={mode === 'jobs' ? 'animate-pulse' : ''} />
              <span>Jobs</span>
              {mode === 'jobs' && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  💼
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Mode Banner */}
      <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
        mode === 'users' 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'bg-green-50 text-green-700 border border-green-200'
      }`}>
        {mode === 'users' ? (
          <>
            <Users size={16} />
            <span>Browsing Freelancers - {showNearby ? `Showing within ${nearbyRadius}km radius` : 'All freelancers'}</span>
          </>
        ) : (
          <>
            <Briefcase size={16} />
            <span>Browsing Jobs - {showNearby ? `Showing within ${nearbyRadius}km radius` : 'All available jobs'}</span>
          </>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
      {mode === 'users' ? (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm sm:text-base border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Search by name or skill..."
                />
              </div>
              <button
                onClick={() => { setShowNearby(!showNearby); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                  showNearby 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MapPin size={16} className={showNearby ? 'animate-bounce' : ''} />
                {showNearby ? `Nearby (${nearbyRadius}km)` : 'Show Nearby'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-2 text-sm"
              >
                <Filter size={18} /> Filters
              </button>
            </div>

            {/* Nearby Radius Selector */}
            {showNearby && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="text-sm text-blue-700">Search radius:</span>
                  <div className="flex gap-2">
                    {[5, 10, 25, 50].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setNearbyRadius(radius)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          nearbyRadius === radius
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {radius}km
                      </button>
                    ))}
                  </div>
                </div>
                {locationError && (
                  <p className="text-xs text-red-600 mt-2">{locationError}</p>
                )}
              </div>
            )}

            <div className={`mt-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Skill</label>
                  <select
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  >
                    <option value="">All Skills</option>
                    {skillOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Rating</label>
                  <select
                    value={minRating || ''}
                    onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  >
                    <option value="">Any Rating</option>
                    {ratingOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    {freelancer.profile_photo ? (
                      <img 
                        src={freelancer.profile_photo} 
                        alt={freelancer.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary-100"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-100 flex items-center justify-center text-lg sm:text-xl font-bold text-primary-600">
                        {freelancer.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate text-gray-900">{freelancer.name}</h3>
                        {freelancer.is_verified && (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs sm:text-sm">
                        <Star size={12} className="fill-amber-400" />
                        <span>{freelancer.avg_rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-400 text-xs">({freelancer.total_reviews || 0})</span>
                      </div>
                      {freelancer.distance_km !== undefined && freelancer.distance_km !== null && (
                        <div className={`flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${
                          showNearby ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                        }`}>
                          <MapPin size={10} />
                          <span>{freelancer.distance_km} km away</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-xs sm:text-sm mb-4 line-clamp-2">
                    {freelancer.bio || freelancer.skills || 'No bio available'}
                  </p>
                  
                  {freelancer.skills && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                      {freelancer.skills.split(',').slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-primary-50 text-primary-600 text-xs">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedFreelancer(freelancer)}
                      className="flex-1 py-2 text-center text-xs sm:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      See Profile
                    </button>
                    <Link
                      to={`/dashboard/chat?user=${freelancer.id}`}
                      className="flex-1 py-2 text-center text-xs sm:text-sm bg-primary-500 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-primary-600 transition-colors"
                    >
                      <MessageCircle size={14} /> Contact
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchJobs}
                  onChange={(e) => setSearchJobs(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm sm:text-base border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Search by job title or description..."
                />
              </div>
              <button
                onClick={() => { setShowNearby(!showNearby); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                  showNearby 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MapPin size={16} className={showNearby ? 'animate-bounce' : ''} />
                {showNearby ? `Nearby (${nearbyRadius}km)` : 'Show Nearby'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-2 text-sm"
              >
                <Filter size={18} /> Filters
              </button>
            </div>

            {/* Nearby Radius Selector for Jobs */}
            {showNearby && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-green-500" />
                  <span className="text-sm text-green-700">Search radius:</span>
                  <div className="flex gap-2">
                    {[5, 10, 25, 50].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setNearbyRadius(radius)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          nearbyRadius === radius
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-green-600 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {radius}km
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Jobs will be filtered by job creator's location</p>
              </div>
            )}

            <div className={`mt-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-600 mb-2">Skill</label>
                <select
                  value={jobSkill}
                  onChange={(e) => setJobSkill(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                >
                  <option value="">All Skills</option>
                  {skillOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingJobs ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${jobStatusColors[job.status]?.bg} ${jobStatusColors[job.status]?.text}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        {job.application_count !== undefined && job.application_count > 0 && (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600">
                            {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        {job.skill_required && (
                          <span className="px-2 py-1 rounded bg-primary-50 text-primary-600">
                            {job.skill_required}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        {job.giver && (
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {job.giver.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">₹{job.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Budget</div>
                      </div>
                      {job.has_applied ? (
                        <button
                          disabled
                          className="px-6 py-3 rounded-lg bg-green-100 text-green-700 font-medium flex items-center gap-2 cursor-not-allowed"
                        >
                          <CheckCircle size={18} /> Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={applyingJobId === job.id}
                          className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {applyingJobId === job.id ? (
                            <><Loader2 size={18} className="animate-spin" /> Applying...</>
                          ) : (
                            'Apply Now'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-gray-400" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </>
      )}

      {selectedFreelancer && (
        <ProfileModal
          user={selectedFreelancer}
          onClose={() => setSelectedFreelancer(null)}
        />
      )}
      </div>
    </div>
  )
}
