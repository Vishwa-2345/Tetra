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
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="glass rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
            <Briefcase className="text-primary-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Post a New Job</h1>
            <p className="text-slate-400">Describe your project and find the perfect freelancer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Job Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl"
              placeholder="e.g., Build a portfolio website"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl min-h-[150px] resize-none"
              placeholder="Describe your project requirements in detail..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Required Skills</label>
              <select
                value={formData.skill_required}
                onChange={(e) => setFormData({ ...formData, skill_required: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-200 border border-white/10 text-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="" className="text-slate-400">Select a skill</option>
                <option value="Web Development" className="text-white">Web Development</option>
                <option value="Mobile Development" className="text-white">Mobile Development</option>
                <option value="UI/UX Design" className="text-white">UI/UX Design</option>
                <option value="Graphic Design" className="text-white">Graphic Design</option>
                <option value="Content Writing" className="text-white">Content Writing</option>
                <option value="Data Analysis" className="text-white">Data Analysis</option>
                <option value="Video Editing" className="text-white">Video Editing</option>
                <option value="Other" className="text-white">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl"
                placeholder="1000"
                min="100"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <h4 className="font-medium text-primary-400 mb-2">Payment Process</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Pay 50% advance when freelancer starts working</li>
              <li>• Remaining 50% paid when job is completed</li>
              <li>• 5% platform fee deducted from final payment</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  )
}
