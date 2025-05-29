import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const NodeCreator = ({ onClose, onNodeCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    experience_level: 1,
    years_experience: 0,
    icon: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supabase, setSupabase] = useState(null)

  // Initialize Supabase client only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      setSupabase(client)
    }
  }, [])

  const categories = [
    { value: 'programming', label: 'Programming Languages', color: '#3B82F6' },
    { value: 'frameworks', label: 'Frameworks & Libraries', color: '#10B981' },
    { value: 'tools', label: 'Development Tools', color: '#F59E0B' },
    { value: 'concepts', label: 'Concepts & Patterns', color: '#8B5CF6' },
    { value: 'databases', label: 'Databases', color: '#EF4444' },
    { value: 'cloud', label: 'Cloud & Infrastructure', color: '#06B6D4' },
    { value: 'testing', label: 'Testing & QA', color: '#F97316' },
    { value: 'devops', label: 'DevOps & CI/CD', color: '#84CC16' },
    { value: 'design', label: 'Design & UX', color: '#EC4899' },
    { value: 'mobile', label: 'Mobile Development', color: '#6366F1' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Database connection not available')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Create the node
      const { data, error } = await supabase
        .from('knowledge_nodes')
        .insert([{
          title: formData.title.trim(),
          slug: slug,
          description: formData.description.trim(),
          category: formData.category,
          experience_level: parseInt(formData.experience_level),
          years_experience: parseFloat(formData.years_experience),
          icon: formData.icon.trim() || null,
          is_active: true
        }])
        .select()

      if (error) throw error

      console.log('Node created:', data[0])
      onNodeCreated(data[0])
    } catch (err) {
      console.error('Error creating node:', err)
      setError(err.message || 'Failed to create knowledge node')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user types
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white border-opacity-20 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Knowledge Node</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Technology/Concept Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., React, Python, Machine Learning"
              className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of this technology or concept..."
              rows={3}
              className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white focus:outline-none focus:border-opacity-40"
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-black">
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: categories.find(c => c.value === formData.category)?.color }}
              />
              <span className="text-xs text-gray-400">
                This will determine the node color in the visualization
              </span>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Experience Level (1-10) *
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                name="experience_level"
                value={formData.experience_level}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="flex-1"
              />
              <span className="text-white font-bold w-8 text-center">
                {formData.experience_level}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              1 = Beginner, 5 = Intermediate, 10 = Expert
            </div>
          </div>

          {/* Years Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              name="years_experience"
              value={formData.years_experience}
              onChange={handleInputChange}
              step="0.5"
              min="0"
              max="50"
              placeholder="0"
              className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
            />
          </div>

          {/* Icon (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Icon Name (optional)
            </label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              placeholder="e.g., react, python, javascript"
              className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
            />
            <div className="mt-1 text-xs text-gray-400">
              Icon identifier for potential future icon integration
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded p-3">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white hover:bg-opacity-20 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 px-4 py-2 bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30 rounded text-white hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Node'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="mt-6 pt-4 border-t border-white border-opacity-10">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Preview</h3>
          <div className="bg-white bg-opacity-5 rounded p-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: categories.find(c => c.value === formData.category)?.color }}
              />
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {formData.title || 'Node Title'}
                </div>
                <div className="text-xs text-gray-400">
                  {categories.find(c => c.value === formData.category)?.label} • Level {formData.experience_level}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeCreator 