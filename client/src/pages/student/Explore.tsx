import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { Search, Star, MapPin, Filter } from 'lucide-react'
import { User } from '../../types'

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

export default function Explore() {
  const { user } = useAuthStore()
  const [freelancers, setFreelancers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [skill, setSkill] = useState('')
  const [minRating, setMinRating] = useState<number | undefined>()
  const [showNearby, setShowNearby] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchFreelancers()
  }, [skill, minRating, showNearby])

  const fetchFreelancers = async () => {
    setLoading(true)
    try {
      if (showNearby && user?.latitude && user?.longitude) {
        const { data } = await usersAPI.getNearby({
          latitude: user.latitude,
          longitude: user.longitude,
          radius_km: 50
        })
        setFreelancers(data)
      } else {
        const { data } = await usersAPI.list({ skill: skill || undefined, min_rating: minRating })
        setFreelancers(data.filter((u: User) => u.id !== user?.id))
      }
    } catch (error) {
      toast.error('Failed to load freelancers')
    } finally {
      setLoading(false)
    }
  }

  const filteredFreelancers = freelancers.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.skills?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Explore Freelancers</h1>
          <p className="text-slate-400 text-sm sm:text-base">Find talented students for your projects</p>
        </div>
        <button
          onClick={() => { setShowNearby(!showNearby); fetchFreelancers(); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
            showNearby 
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
              : 'btn-secondary'
          }`}
        >
          <MapPin size={16} />
          {showNearby ? 'Showing Nearby' : 'Show Nearby'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm sm:text-base"
              placeholder="Search by name or skill..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary px-4 py-3 rounded-xl flex items-center gap-2 text-sm sm:hidden"
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Filter Options - Always visible on desktop */}
        <div className={`mt-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-slate-300">Skill</label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white"
              >
                <option value="" className="text-slate-900">All Skills</option>
                {skillOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-slate-300">Rating</label>
              <select
                value={minRating || ''}
                onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white"
              >
                <option value="" className="text-slate-900">Any Rating</option>
                {ratingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Freelancer Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-32" />
                </div>
              </div>
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFreelancers.map((freelancer) => (
            <div key={freelancer.id} className="glass rounded-2xl p-4 sm:p-6 hover-lift">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
                  {freelancer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{freelancer.name}</h3>
                    {freelancer.is_verified && (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm">
                    <Star size={12} className="fill-amber-400" />
                    <span>{freelancer.avg_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-500 text-xs">({freelancer.total_reviews || 0})</span>
                  </div>
                  {freelancer.distance_km && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                      <MapPin size={10} />
                      <span>{freelancer.distance_km} km away</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-slate-400 text-xs sm:text-sm mb-4 line-clamp-2">
                {freelancer.bio || freelancer.skills || 'No bio available'}
              </p>
              
              {freelancer.skills && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                  {freelancer.skills.split(',').slice(0, 3).map((s, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/dashboard/profile/${freelancer.id}`}
                  className="flex-1 py-2 text-center text-xs sm:text-sm border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  to={`/dashboard/chat/${freelancer.id}`}
                  className="flex-1 py-2 text-center text-xs sm:text-sm btn-primary rounded-lg"
                >
                  Contact
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredFreelancers.length === 0 && (
        <div className="text-center py-12 sm:py-16 glass rounded-2xl">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-500" size={24} />
          </div>
          <h3 className="text-base sm:text-lg font-medium mb-2">No freelancers found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
