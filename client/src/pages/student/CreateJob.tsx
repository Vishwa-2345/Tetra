import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { Briefcase, ArrowLeft } from 'lucide-react'

export default function CreateJob() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill_required: '',
    price: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.is_profile_complete) {
      toast.error('Please complete your profile first')
      navigate('/dashboard/profile')
      return
    }

    setLoading(true)
    try {
      const { data } = await jobsAPI.create({
        ...formData,
        price: parseFloat(formData.price)
      })
      toast.success('Job created successfully!')
      navigate(`/dashboard/my-jobs/${data.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
            <Briefcase className="text-primary-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
            <p className="text-gray-500">Describe your project and find the perfect freelancer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
              placeholder="e.g., Build a portfolio website"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 min-h-[150px] resize-none"
              placeholder="Describe your project requirements in detail..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <select
                value={formData.skill_required}
                onChange={(e) => setFormData({ ...formData, skill_required: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 appearance-none cursor-pointer"
              >
                <option value="">Select a skill</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Content Writing">Content Writing</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                placeholder="1000"
                min="100"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
            <h4 className="font-medium text-primary-700 mb-2">Payment Process</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pay 50% advance when freelancer starts working</li>
              <li>• Remaining 50% paid when job is completed</li>
              <li>• 5% platform fee deducted from final payment</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  )
}
