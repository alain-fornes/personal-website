import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import KnowledgeNetwork from '../components/KnowledgeNetwork'
import ContentEditor from '../components/ContentEditor'
import NodeCreator from '../components/NodeCreator'

export default function SWEPage() {
  const { isAuthenticated } = useAuth()
  const [knowledgeNodes, setKnowledgeNodes] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [showContentEditor, setShowContentEditor] = useState(false)
  const [showNodeCreator, setShowNodeCreator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('network') // 'network', 'content', 'manage'
  const [supabase, setSupabase] = useState(null)
  
  // Initialize Supabase client only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      setSupabase(client)
    } else {
      // If we can't initialize Supabase, stop loading
      setLoading(false)
    }
  }, [])

  // Load knowledge nodes and connections
  useEffect(() => {
    if (supabase) {
      loadKnowledgeData()
    }
  }, [supabase])

  const loadKnowledgeData = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      
      // Load knowledge nodes
      const { data: nodes, error: nodesError } = await supabase
        .from('knowledge_nodes')
        .select('*')
        .eq('is_active', true)
        .order('experience_level', { ascending: false })

      if (nodesError) throw nodesError

      // Load connections
      const { data: connections, error: connectionsError } = await supabase
        .from('node_connections')
        .select(`
          *,
          from_node:knowledge_nodes!node_connections_from_node_id_fkey(title),
          to_node:knowledge_nodes!node_connections_to_node_id_fkey(title)
        `)

      if (connectionsError) throw connectionsError

      setKnowledgeNodes(nodes || [])
      setConnections(connections || [])
    } catch (error) {
      console.error('Error loading knowledge data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNodeSelect = (node) => {
    setSelectedNode(node)
    setViewMode('content')
  }

  const handleCreateNode = () => {
    setShowNodeCreator(true)
  }

  const handleEditContent = (node) => {
    setSelectedNode(node)
    setShowContentEditor(true)
  }

  const handleNodeCreated = (newNode) => {
    setKnowledgeNodes(prev => [...prev, newNode])
    setShowNodeCreator(false)
    loadKnowledgeData() // Refresh to get updated metrics
  }

  const handleContentSaved = () => {
    setShowContentEditor(false)
    loadKnowledgeData() // Refresh to get updated metrics
  }

  const handleDeleteNode = async (nodeId, nodeTitle) => {
    if (!supabase) return
    
    if (!confirm(`Are you sure you want to delete "${nodeTitle}" and ALL its content? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      
      // Delete in the correct order to respect foreign key constraints
      // 1. Delete blog content
      const { error: blogError } = await supabase
        .from('blog_content')
        .delete()
        .eq('node_id', nodeId)

      if (blogError) throw blogError

      // 2. Delete node connections (both directions)
      const { error: connectionsError } = await supabase
        .from('node_connections')
        .delete()
        .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`)

      if (connectionsError) throw connectionsError

      // 3. Delete project associations
      const { error: projectNodesError } = await supabase
        .from('project_nodes')
        .delete()
        .eq('node_id', nodeId)

      if (projectNodesError) throw projectNodesError

      // 4. Delete learning progress
      const { error: learningError } = await supabase
        .from('learning_progress')
        .delete()
        .eq('node_id', nodeId)

      if (learningError) throw learningError

      // 5. Finally delete the knowledge node itself
      const { error: nodeError } = await supabase
        .from('knowledge_nodes')
        .delete()
        .eq('id', nodeId)

      if (nodeError) throw nodeError

      console.log(`Successfully deleted node "${nodeTitle}" and all its content`)
      
      // Refresh the data
      await loadKnowledgeData()
      
      // If we were viewing the deleted node, clear the selection
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
        setViewMode('network')
      }

    } catch (error) {
      console.error('Error deleting node:', error)
      alert(`Failed to delete node: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading && supabase) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading knowledge network...</div>
      </div>
    )
  }

  // Show error if Supabase is not configured (only after we've tried to initialize)
  if (!loading && !supabase) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Configuration Required</h2>
          <p className="text-gray-400 mb-4">Supabase environment variables are not configured.</p>
          <Link 
            href="/" 
            className="px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-200"
            >
              ← Back
            </Link>
            
            <h1 className="text-3xl font-bold">Software Engineering</h1>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-white bg-opacity-10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('network')}
                className={`px-4 py-2 rounded text-sm transition-all duration-200 ${
                  viewMode === 'network' 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Network View
              </button>
              <button
                onClick={() => setViewMode('content')}
                className={`px-4 py-2 rounded text-sm transition-all duration-200 ${
                  viewMode === 'content' 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Content View
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setViewMode('manage')}
                  className={`px-4 py-2 rounded text-sm transition-all duration-200 ${
                    viewMode === 'manage' 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Manage
                </button>
              )}
            </div>

            {/* Admin Actions */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateNode}
                  className="px-4 py-2 bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-all duration-200 text-sm"
                >
                  + New Node
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24">
        {viewMode === 'network' && (
          <KnowledgeNetwork 
            nodes={knowledgeNodes}
            connections={connections}
            onNodeSelect={handleNodeSelect}
            isAuthenticated={isAuthenticated}
          />
        )}

        {viewMode === 'content' && (
          <ContentView 
            nodes={knowledgeNodes}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            onEditContent={handleEditContent}
            onDeleteNode={handleDeleteNode}
            supabase={supabase}
            isAuthenticated={isAuthenticated}
          />
        )}

        {viewMode === 'manage' && isAuthenticated && (
          <ManageView 
            nodes={knowledgeNodes}
            connections={connections}
            onRefresh={loadKnowledgeData}
            onDeleteNode={handleDeleteNode}
            supabase={supabase}
          />
        )}
      </div>

      {/* Modals */}
      {showNodeCreator && (
        <NodeCreator 
          onClose={() => setShowNodeCreator(false)}
          onNodeCreated={handleNodeCreated}
        />
      )}

      {showContentEditor && selectedNode && (
        <ContentEditor 
          node={selectedNode}
          onClose={() => setShowContentEditor(false)}
          onContentSaved={handleContentSaved}
        />
      )}
    </div>
  )
}

// Content View Component
function ContentView({ nodes, selectedNode, onNodeSelect, onEditContent, onDeleteNode, supabase, isAuthenticated }) {
  const [blogPosts, setBlogPosts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedNode && supabase) {
      loadBlogPosts(selectedNode.id)
    }
  }, [selectedNode, supabase])

  const loadBlogPosts = async (nodeId) => {
    if (!supabase) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_content')
        .select('*')
        .eq('node_id', nodeId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBlogPosts(data || [])
    } catch (error) {
      console.error('Error loading blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - Node List */}
      <div className="w-1/3 border-r border-white border-opacity-10 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Knowledge Areas</h3>
          <div className="space-y-2">
            {nodes.map(node => (
              <button
                key={node.id}
                onClick={() => onNodeSelect(node)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  selectedNode?.id === node.id
                    ? 'bg-white bg-opacity-10 border-white border-opacity-30'
                    : 'bg-white bg-opacity-5 border-white border-opacity-10 hover:bg-opacity-10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{node.title}</h4>
                    <p className="text-sm text-gray-400">{node.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      Level {node.experience_level}/10
                    </div>
                    <div className="text-xs text-gray-500">
                      {node.blog_post_count} posts
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">{selectedNode.title}</h2>
                <p className="text-gray-400 mt-2">{selectedNode.description}</p>
              </div>
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditContent(selectedNode)}
                    className="px-4 py-2 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-all duration-200"
                  >
                    + Add Content
                  </button>
                  <button
                    onClick={() => onDeleteNode(selectedNode.id, selectedNode.title)}
                    className="px-4 py-2 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-all duration-200 text-red-300 hover:text-red-200"
                    title={`Delete ${selectedNode.title}`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Experience Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white bg-opacity-5 rounded-lg p-4">
                <h4 className="text-sm text-gray-400">Experience Level</h4>
                <div className="text-2xl font-bold">{selectedNode.experience_level}/10</div>
              </div>
              <div className="bg-white bg-opacity-5 rounded-lg p-4">
                <h4 className="text-sm text-gray-400">Years Experience</h4>
                <div className="text-2xl font-bold">{selectedNode.years_experience}</div>
              </div>
              <div className="bg-white bg-opacity-5 rounded-lg p-4">
                <h4 className="text-sm text-gray-400">Blog Posts</h4>
                <div className="text-2xl font-bold">{selectedNode.blog_post_count}</div>
              </div>
            </div>

            {/* Blog Posts */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Content & Notes</h3>
              {loading ? (
                <div className="text-gray-400">Loading content...</div>
              ) : blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.map(post => (
                    <div key={post.id} className="bg-white bg-opacity-5 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-2">{post.title}</h4>
                      {post.excerpt && (
                        <p className="text-gray-400 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>{post.reading_time_minutes} min read</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No content yet for this technology.
                  {isAuthenticated && ' Click "Add Content" to get started!'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🧠</div>
              <p>Select a knowledge area to view content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Manage View Component
function ManageView({ nodes, connections, onRefresh, onDeleteNode, supabase }) {
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalConnections: 0,
    totalBlogPosts: 0,
    avgExperience: 0
  })

  useEffect(() => {
    if (supabase) {
      calculateStats()
    }
  }, [nodes, connections, supabase])

  const calculateStats = async () => {
    if (!supabase) return
    
    try {
      const { data: blogPosts } = await supabase
        .from('blog_content')
        .select('id')
        .eq('status', 'published')

      const avgExp = nodes.length > 0 
        ? nodes.reduce((sum, node) => sum + node.experience_level, 0) / nodes.length 
        : 0

      setStats({
        totalNodes: nodes.length,
        totalConnections: connections.length,
        totalBlogPosts: blogPosts?.length || 0,
        avgExperience: avgExp.toFixed(1)
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Knowledge Network Management</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white bg-opacity-5 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Nodes</h3>
          <div className="text-3xl font-bold">{stats.totalNodes}</div>
        </div>
        <div className="bg-white bg-opacity-5 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Connections</h3>
          <div className="text-3xl font-bold">{stats.totalConnections}</div>
        </div>
        <div className="bg-white bg-opacity-5 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Blog Posts</h3>
          <div className="text-3xl font-bold">{stats.totalBlogPosts}</div>
        </div>
        <div className="bg-white bg-opacity-5 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Avg Experience</h3>
          <div className="text-3xl font-bold">{stats.avgExperience}/10</div>
        </div>
      </div>

      {/* Node Management Table */}
      <div className="bg-white bg-opacity-5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Knowledge Nodes</h3>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white border-opacity-10">
                <th className="text-left py-3">Title</th>
                <th className="text-left py-3">Category</th>
                <th className="text-left py-3">Experience</th>
                <th className="text-left py-3">Posts</th>
                <th className="text-left py-3">Created</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(node => (
                <tr key={node.id} className="border-b border-white border-opacity-5">
                  <td className="py-3 font-semibold">{node.title}</td>
                  <td className="py-3 text-gray-400">{node.category}</td>
                  <td className="py-3">{node.experience_level}/10</td>
                  <td className="py-3">{node.blog_post_count}</td>
                  <td className="py-3 text-gray-400">
                    {new Date(node.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => onDeleteNode(node.id, node.title)}
                      className="px-3 py-1 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded text-red-300 hover:bg-opacity-30 hover:text-red-200 transition-all duration-200 text-sm"
                      title={`Delete ${node.title}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 