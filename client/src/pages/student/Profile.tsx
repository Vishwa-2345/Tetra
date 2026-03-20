import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { usersAPI, reviewsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Save, Camera, MapPin, DollarSign, Github, 
  Link as LinkIcon, Star, CheckCircle, Loader2
} from 'lucide-react'

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuthStore()
  const isOwnProfile = !userId || userId === currentUser?.id?.toString()
  const [profile, setProfile] = useState(currentUser)
  const [loading, setLoading] = useState(!isOwnProfile)
  const [saving, setSaving] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    skills: currentUser?.skills || '',
    experience: currentUser?.experience || '',
    portfolio: currentUser?.portfolio || '',
    github: currentUser?.github || '',
    projects: currentUser?.projects || '',
    upi_id: currentUser?.upi_id || '',
    latitude: currentUser?.latitude || '',
    longitude: currentUser?.longitude || '',
    address: currentUser?.address || '',
  })

  useEffect(() => {
    if (!isOwnProfile && userId) {
      fetchProfile()
    }
  }, [userId])

  const fetchProfile = async () => {
    try {
      const { data } = await usersAPI.getById(parseInt(userId!))
      setProfile(data)
      setLoading(false)
      fetchReviews(parseInt(userId!))
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (id: number) => {
    try {
      const { data } = await reviewsAPI.getByUser(id)
      setReviews(data)
    } catch (error) {
      console.error('Failed to load reviews')
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }))
        toast.success('Location captured!')
        setGettingLocation(false)
      },
      () => {
        toast.error('Unable to get location. Please allow location access.')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await usersAPI.updateProfile({
        ...formData,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : null,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : null,
      })
      updateUser(data)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary-500/50 to-purple-500/50" />
        <div className="px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 -mt-12 sm:-mt-16">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-2xl sm:text-4xl font-bold text-white border-4 border-dark-200">
                {profile?.name?.charAt(0)}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-100 transition-colors border border-white/10">
                  <Camera size={14} />
                </button>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-16 w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold">{profile?.name}</h1>
                {profile?.is_verified && (
                  <CheckCircle className="text-green-400" size={18} />
                )}
              </div>
              <p className="text-slate-400 text-sm mb-3">{profile?.email}</p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-slate-300">
                  <Star className="text-amber-400 fill-amber-400" size={14} />
                  <span>{profile?.avg_rating?.toFixed(1) || '0.0'} ({profile?.total_reviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <CheckCircle className="text-green-400" size={14} />
                  <span>{profile?.completed_jobs || 0} jobs completed</span>
                </div>
                {profile?.address && (
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin size={14} />
                    <span>{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl min-h-[100px] resize-none text-sm"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="React, Node.js, Python..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="2 years web development..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Portfolio URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GitHub URL</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">UPI ID (for payments)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                    placeholder="yourname@upi"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Projects</label>
                <textarea
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl min-h-[100px] resize-none text-sm"
                  placeholder="Describe your best projects..."
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Location (for geo-filtering)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                    placeholder="Your city/campus address"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
                >
                  {gettingLocation ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <MapPin size={18} />
                  )}
                  <span className="text-sm font-medium">
                    {gettingLocation ? 'Getting Location...' : 'Share My Location'}
                  </span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5"
                    placeholder="e.g., 28.6139"
                    readOnly={gettingLocation}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5"
                    placeholder="e.g., 77.2090"
                    readOnly={gettingLocation}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Click "Share My Location" to automatically capture your coordinates, or enter manually
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'} <Save size={18} />
          </button>
        </form>
      ) : (
        <div className="glass rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">About</h2>
          <p className="text-slate-300 text-sm sm:text-base whitespace-pre-wrap">{profile?.bio || 'No bio available'}</p>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2 text-sm sm:text-base">Skills</h3>
            <p className="text-slate-400 text-sm">{profile?.skills || 'Not specified'}</p>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2 text-sm sm:text-base">Experience</h3>
            <p className="text-slate-400 text-sm">{profile?.experience || 'Not specified'}</p>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2 text-sm sm:text-base">Projects</h3>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">{profile?.projects || 'Not specified'}</p>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Reviews ({reviews.length})</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-sm sm:text-base">
                  {review.reviewer?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">{review.reviewer?.name}</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {review.feedback && (
                <p className="text-slate-400 text-xs sm:text-sm mt-2">{review.feedback}</p>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-slate-500 py-6 sm:py-8 text-sm">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
