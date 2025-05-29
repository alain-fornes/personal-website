import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const KnowledgeNetwork = ({ nodes, connections, onNodeSelect, isAuthenticated }) => {
  const svgRef = useRef()

  useEffect(() => {
    if (!nodes.length) return

    const svg = d3.select(svgRef.current)
    const width = window.innerWidth
    const height = window.innerHeight - 100 // Account for header

    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Create the main group
    const g = svg.append('g')

    // Calculate node sizes based on experience and content
    const processedNodes = nodes.map(node => ({
      ...node,
      radius: calculateNodeSize(node),
      x: Math.random() * width,
      y: Math.random() * height
    }))

    // Process connections for D3 force simulation
    const processedLinks = connections.map(connection => ({
      source: processedNodes.find(n => n.id === connection.from_node_id),
      target: processedNodes.find(n => n.id === connection.to_node_id),
      strength: connection.strength || 5,
      type: connection.connection_type || 'related'
    })).filter(link => link.source && link.target)

    // Create force simulation
    const simulation = d3.forceSimulation(processedNodes)
      .force('link', d3.forceLink(processedLinks).distance(d => 150 + d.strength * 10))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20))
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    // Create connections (links)
    const link = g.selectAll('.link')
      .data(processedLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#444')
      .attr('stroke-width', d => Math.max(1, d.strength / 2))
      .attr('opacity', 0.6)

    // Create node groups
    const nodeGroup = g.selectAll('.node')
      .data(processedNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        if (event.defaultPrevented) return
        onNodeSelect(d)
      })

    // Add main circles
    nodeGroup.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => getCategoryColor(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')

    // Add experience level rings
    nodeGroup.append('circle')
      .attr('r', d => d.radius + 5)
      .attr('fill', 'none')
      .attr('stroke', d => getCategoryColor(d.category))
      .attr('stroke-width', d => Math.max(1, d.experience_level / 2))
      .attr('opacity', 0.5)

    // Add labels
    nodeGroup.append('text')
      .text(d => d.title)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fff')
      .style('font-size', d => Math.max(10, d.radius / 3) + 'px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')

    // Add experience level indicators
    nodeGroup.append('text')
      .text(d => `L${d.experience_level}`)
      .attr('text-anchor', 'middle')
      .attr('y', d => -d.radius - 10)
      .attr('fill', '#aaa')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('pointer-events', 'none')

    // Add blog post count indicators
    nodeGroup.append('text')
      .text(d => d.blog_post_count > 0 ? `${d.blog_post_count} posts` : '')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 20)
      .attr('fill', '#888')
      .style('font-size', '8px')
      .style('pointer-events', 'none')

    // Add hover effects
    nodeGroup
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 4)
          .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))')
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      nodeGroup
        .attr('transform', d => {
          const padding = d.radius + 10
          d.x = Math.max(padding, Math.min(width - padding, d.x))
          d.y = Math.max(padding, Math.min(height - padding, d.y))
          return `translate(${d.x},${d.y})`
        })
    })

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight - 100
      
      svg.attr('width', newWidth).attr('height', newHeight)
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
      simulation.alpha(0.3).restart()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      simulation.stop()
      window.removeEventListener('resize', handleResize)
    }
  }, [nodes, connections, onNodeSelect])

  // Calculate node size based on experience and content
  const calculateNodeSize = (node) => {
    const baseSize = 25
    const experienceBonus = node.experience_level * 8
    const contentBonus = node.blog_post_count * 3
    const projectBonus = node.project_count * 2
    
    return Math.max(baseSize, baseSize + experienceBonus + contentBonus + projectBonus)
  }

  // Get color based on category
  const getCategoryColor = (category) => {
    const colors = {
      'programming': '#3B82F6',     // Blue
      'frameworks': '#10B981',      // Green
      'tools': '#F59E0B',          // Yellow
      'concepts': '#8B5CF6',       // Purple
      'databases': '#EF4444',      // Red
      'cloud': '#06B6D4',          // Cyan
      'testing': '#F97316',        // Orange
      'devops': '#84CC16',         // Lime
      'design': '#EC4899',         // Pink
      'mobile': '#6366F1',         // Indigo
      'default': '#6B7280'         // Gray
    }
    
    return colors[category?.toLowerCase()] || colors.default
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Instructions for empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pt-24">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-2xl font-semibold mb-2">No Knowledge Nodes Yet</h3>
            <p className="mb-4">Start building your knowledge network!</p>
            {isAuthenticated && (
              <p className="text-sm">Click "New Node" to create your first technology node.</p>
            )}
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)' }}
      />
    </div>
  )
}

export default KnowledgeNetwork 