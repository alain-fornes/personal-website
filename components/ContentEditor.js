import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const ContentEditor = ({ node, onClose, onContentSaved }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    tags: '',
    content_type: 'blog_post'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [existingPosts, setExistingPosts] = useState([])
  const [editingPost, setEditingPost] = useState(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    loadExistingPosts()
  }, [node])

  const loadExistingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_content')
        .select('*')
        .eq('node_id', node.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingPosts(data || [])
    } catch (err) {
      console.error('Error loading existing posts:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Calculate reading time (rough estimate: 200 words per minute)
      const wordCount = formData.content.trim().split(/\s+/).length
      const readingTime = Math.max(1, Math.round(wordCount / 200))

      // Process tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const contentData = {
        node_id: node.id,
        title: formData.title.trim(),
        slug: slug,
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || null,
        status: formData.status,
        tags: tags.length > 0 ? tags : null,
        content_type: formData.content_type,
        reading_time_minutes: readingTime,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      }

      let result
      if (editingPost) {
        // Update existing post
        result = await supabase
          .from('blog_content')
          .update(contentData)
          .eq('id', editingPost.id)
          .select()
      } else {
        // Create new post
        result = await supabase
          .from('blog_content')
          .insert([contentData])
          .select()
      }

      if (result.error) throw result.error

      console.log('Content saved:', result.data[0])
      onContentSaved()
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err.message || 'Failed to save content')
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
    setError('')
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      status: post.status,
      tags: post.tags ? post.tags.join(', ') : '',
      content_type: post.content_type
    })
  }

  const handleNewPost = () => {
    setEditingPost(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      tags: '',
      content_type: 'blog_post'
    })
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('blog_content')
        .delete()
        .eq('id', postId)

      if (error) throw error
      
      loadExistingPosts()
      if (editingPost?.id === postId) {
        handleNewPost()
      }
    } catch (err) {
      console.error('Error deleting post:', err)
      setError('Failed to delete post')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white border-opacity-20 rounded-lg w-full max-w-6xl h-[90vh] flex overflow-hidden">
        
        {/* Sidebar - Existing Posts */}
        <div className="w-1/4 border-r border-white border-opacity-10 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Content for {node.title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleNewPost}
            className={`w-full mb-4 p-3 rounded border transition-all duration-200 ${
              !editingPost 
                ? 'bg-green-500 bg-opacity-20 border-green-400 border-opacity-30 text-white'
                : 'bg-white bg-opacity-5 border-white border-opacity-10 text-gray-300 hover:bg-opacity-10'
            }`}
          >
            + New Post
          </button>

          <div className="space-y-2">
            {existingPosts.map(post => (
              <div
                key={post.id}
                className={`p-3 rounded border cursor-pointer transition-all duration-200 ${
                  editingPost?.id === post.id
                    ? 'bg-white bg-opacity-10 border-white border-opacity-30'
                    : 'bg-white bg-opacity-5 border-white border-opacity-10 hover:bg-opacity-10'
                }`}
                onClick={() => handleEditPost(post)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{post.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        post.status === 'published' 
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {post.reading_time_minutes}m read
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePost(post.id)
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white border-opacity-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                    previewMode
                      ? 'bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 text-blue-300'
                      : 'bg-white bg-opacity-10 border border-white border-opacity-20 text-gray-300 hover:bg-opacity-20'
                  }`}
                >
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {/* Form Controls */}
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Post title..."
                className="col-span-2 px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
                required
              />
              
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white focus:outline-none focus:border-opacity-40"
              >
                <option value="draft" className="bg-black">Draft</option>
                <option value="published" className="bg-black">Published</option>
                <option value="archived" className="bg-black">Archived</option>
              </select>

              <select
                name="content_type"
                value={formData.content_type}
                onChange={handleInputChange}
                className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white focus:outline-none focus:border-opacity-40"
              >
                <option value="blog_post" className="bg-black">Blog Post</option>
                <option value="note" className="bg-black">Quick Note</option>
                <option value="project" className="bg-black">Project</option>
                <option value="resource" className="bg-black">Resource</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {previewMode ? (
              <div className="h-full overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none">
                  <h1>{formData.title || 'Untitled Post'}</h1>
                  {formData.excerpt && (
                    <p className="text-gray-400 italic">{formData.excerpt}</p>
                  )}
                  <div className="whitespace-pre-wrap">{formData.content}</div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-white border-opacity-10">
                  <input
                    type="text"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Brief excerpt or summary (optional)..."
                    className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
                  />
                </div>
                
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your content here... (Markdown supported)"
                  className="flex-1 p-4 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                  style={{ minHeight: '400px' }}
                />
                
                <div className="p-4 border-t border-white border-opacity-10">
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Tags (comma-separated)..."
                    className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-opacity-40"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white border-opacity-10">
            {error && (
              <div className="text-red-400 text-sm bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded p-3 mb-4">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {formData.content.trim() && (
                  <>
                    {formData.content.trim().split(/\s+/).length} words • 
                    ~{Math.max(1, Math.round(formData.content.trim().split(/\s+/).length / 200))} min read
                  </>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white hover:bg-opacity-20 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-4 py-2 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded text-white hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingPost ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentEditor

