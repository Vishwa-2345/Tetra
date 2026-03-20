import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { usersAPI, reviewsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Save, Camera, MapPin, DollarSign, Github, Linkedin,
  Link as LinkIcon, Star, CheckCircle, Loader2, ExternalLink,
  Edit2, X, Award, Navigation, ArrowLeft
} from 'lucide-react'

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuthStore()
  const isOwnProfile = !userId || userId === currentUser?.id?.toString()
  const [profile, setProfile] = useState(currentUser)
  const [loading, setLoading] = useState(!isOwnProfile)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editing, setEditing] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    skills: currentUser?.skills || '',
    experience: currentUser?.experience || '',
    portfolio: currentUser?.portfolio || '',
    github: currentUser?.github || '',
    linkedin: currentUser?.linkedin || '',
    projects: currentUser?.projects || '',
    upi_id: currentUser?.upi_id || '',
    address: currentUser?.address || '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    if (!isOwnProfile && userId) {
      fetchProfile()
    }
  }, [userId])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await response.json()
          const address = data.address
          const locationParts = [
            address.city || address.town || address.village || address.suburb,
            address.state,
            address.country
          ].filter(Boolean)
          const formattedAddress = locationParts.join(', ')
          setFormData(prev => ({ ...prev, address: formattedAddress }))
          toast.success('Location added!')
        } catch (error) {
          toast.error('Failed to get address from location')
        } finally {
          setGettingLocation(false)
        }
      },
      () => {
        toast.error('Unable to retrieve your location')
        setGettingLocation(false)
      }
    )
  }

  useEffect(() => {
    if (!isOwnProfile) return
    setFormData({
      name: currentUser?.name || '',
      bio: currentUser?.bio || '',
      skills: currentUser?.skills || '',
      experience: currentUser?.experience || '',
      portfolio: currentUser?.portfolio || '',
      github: currentUser?.github || '',
      linkedin: currentUser?.linkedin || '',
      projects: currentUser?.projects || '',
      upi_id: currentUser?.upi_id || '',
      address: currentUser?.address || '',
    })
  }, [currentUser])

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const { data } = await usersAPI.uploadPhoto(file)
      updateUser(data)
      setProfile(data)
      toast.success('Profile photo updated!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await usersAPI.updateProfile(formData)
      updateUser(data)
      setProfile(data)
      setEditing(false)
      toast.success('Profile updated successfully!')
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
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isOwnProfile && (
              <Link
                to="/dashboard/explore"
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isOwnProfile ? 'My Profile' : `${profile?.name}'s Profile`}
              </h1>
              <p className="text-gray-500">Manage your profile information</p>
            </div>
          </div>
        </div>
      </div>
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Cover gradient */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />
        
        {/* Profile info */}
        <div className="px-4 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 -mt-16 sm:-mt-20">
            {/* Avatar - Circular */}
            <div className="relative">
              {profile?.profile_photo ? (
                <img 
                  src={profile.profile_photo} 
                  alt={profile.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white border-4 border-white shadow-lg">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-md disabled:opacity-50 border-2 border-white"
                >
                  {uploadingPhoto ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 sm:pt-20 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.name}</h1>
                    {profile?.is_verified && (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{profile?.email}</p>
                </div>
                {isOwnProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: currentUser?.name || '',
                        bio: currentUser?.bio || '',
                        skills: currentUser?.skills || '',
                        experience: currentUser?.experience || '',
                        portfolio: currentUser?.portfolio || '',
                        github: currentUser?.github || '',
                        linkedin: currentUser?.linkedin || '',
                        projects: currentUser?.projects || '',
                        upi_id: currentUser?.upi_id || '',
                        address: currentUser?.address || '',
                      })
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium"
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <Star className="text-amber-400 fill-amber-400" size={16} />
                  <span className="font-semibold text-amber-700">{profile?.avg_rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-amber-600">({profile?.total_reviews || 0})</span>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg">
                  <Award className="text-green-500" size={16} />
                  <span className="font-semibold text-green-700">{profile?.completed_jobs || 0}</span>
                  <span className="text-green-600">jobs done</span>
                </div>
                {profile?.address && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin size={16} />
                    <span>{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && isOwnProfile ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl min-h-[100px] resize-none text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    placeholder="React, Node.js, Python..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    placeholder="2 years web development..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address / Location</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                      placeholder="Your city or campus address"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {gettingLocation ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Navigation size={16} />
                    )}
                    {gettingLocation ? 'Getting...' : 'Share Location'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                <textarea
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl min-h-[80px] resize-none text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Describe your best projects..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Links & Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub URL</label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID (for payments)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    placeholder="yourname@upi"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 sm:py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <>
          {/* About Section */}
          {profile?.bio && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">About</h2>
              <p className="text-gray-600 text-sm sm:text-base whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile?.skills && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile?.experience && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Experience</h2>
              <p className="text-gray-600 text-sm">{profile.experience}</p>
            </div>
          )}

          {/* Projects */}
          {profile?.projects && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Projects</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{profile.projects}</p>
            </div>
          )}

          {/* Links */}
          {(profile?.github || profile?.linkedin || profile?.portfolio) && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Links</h2>
              <div className="space-y-2">
                {profile?.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Github size={20} className="text-gray-700" />
                    <span className="text-sm text-gray-700 flex-1">{profile.github}</span>
                    <ExternalLink size={14} className="text-gray-400" />
                  </a>
                )}
                {profile?.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Linkedin size={20} className="text-blue-600" />
                    <span className="text-sm text-gray-700 flex-1">{profile.linkedin}</span>
                    <ExternalLink size={14} className="text-gray-400" />
                  </a>
                )}
                {profile?.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <LinkIcon size={20} className="text-primary-500" />
                    <span className="text-sm text-gray-700 flex-1">Portfolio</span>
                    <ExternalLink size={14} className="text-gray-400" />
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reviews Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Reviews ({reviews.length})</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {review.reviewer?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{review.reviewer?.name}</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.feedback && (
                <p className="text-gray-600 text-sm">{review.feedback}</p>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
