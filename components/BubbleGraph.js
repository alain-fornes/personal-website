import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/router';

const BubbleGraph = ({ data }) => {
  const ref = useRef();
  const router = useRouter();

  // Beige color
  const beigeColor = '#000000';

  // Store colors in a map for reference
  const colorMap = new Map(data.nodes.map((node, i) => [node.id, beigeColor]));

  useEffect(() => {
    // Get dynamic dimensions based on window size
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const svg = d3.select(ref.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', 'black');

    // Clear any existing elements
    svg.selectAll('*').remove();

    // Create a group (no zoom functionality)
    const g = svg.append('g');

    // Adjust initial positions to use full window
    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
    });

    const simulation = d3.forceSimulation(data.nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20))
      .force('x', d3.forceX(width / 2).strength(0.02))
      .force('y', d3.forceY(height / 2).strength(0.02))
      .alphaDecay(0.01)
      .velocityDecay(0.4)
      .on('tick', ticked);

    let animationFrame;
    let time = 0;
    const animate = () => {
      time += 0.016;
      simulation.tick();
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    const node = g.selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', handleClick)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add main bubble circle
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', beigeColor)
      .attr('opacity', 0.9)
      .style('transition', 'all 0.2s ease')
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

    // Add text labels
    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#000000')
      .style('font-size', '60px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .style('filter', 'drop-shadow(0 1px 1px rgba(255,255,255,0.5))')
      .style('letter-spacing', '0.02em')
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    // Add hover effects
    node.each(function(d, i) {
      const originalColor = beigeColor;
      
      d3.select(this)
        .on('mouseover', function() {
          d3.select(this).selectAll('circle').filter(':first-child')
            .attr('fill', '#FFFFFF')
            .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))');
        })
        .on('mouseout', function() {
          d3.select(this).selectAll('circle').filter(':first-child')
            .attr('fill', originalColor)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
        });
    });

    function ticked() {
      node.attr('transform', d => {
        const bobAmount = 2;
        const bobSpeed = 2;
        const bobOffset = d.id.charCodeAt(0) * 0.1;
        const bob = Math.sin(time * bobSpeed + bobOffset) * bobAmount;
        
        const padding = d.radius + 10;
        const x = Math.max(padding, Math.min(width - padding, d.x));
        const y = Math.max(padding, Math.min(height - padding, d.y + bob));
        
        return `translate(${x},${y})`;
      });
    }

    function handleClick(event, d) {
      // Prevent click during drag
      if (event.defaultPrevented) return;

      // Map emojis to specific page routes
      const emojiRoutes = {
        '💻': 'swe',
        '🌎': 'earth',
        '📄': 'words',
        '📷': 'photos'
      };

      // Get the route for this emoji, fallback to generic route
      const route = emojiRoutes[d.id] || d.id.toLowerCase().replace(/\s+/g, '-');
      
      // Navigate directly without zoom animation
      const color = colorMap.get(d.id);
      router.push({
        pathname: `/${route}`,
        query: { color }
      });
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      svg.attr('width', newWidth).attr('height', newHeight);
      
      // Update force center
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.force('x', d3.forceX(newWidth / 2));
      simulation.force('y', d3.forceY(newHeight / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      simulation.stop();
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [data, router, colorMap]);

  return <svg ref={ref} className="block"></svg>;
};

export default BubbleGraph;
