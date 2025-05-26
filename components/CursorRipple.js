import React, { useEffect, useRef } from 'react';

const CursorRipple = () => {
  const canvasRef = useRef(null);
  const ripples = useRef([]);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse move handler
    const handleMouseMove = (e) => {
      // Add new ripple at cursor position
      ripples.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 0.6,
        maxRadius: 50 + Math.random() * 30, // Random max radius between 50-80
        speed: 2 + Math.random() * 2, // Random speed between 2-4
      });

      // Limit number of ripples for performance
      if (ripples.current.length > 15) {
        ripples.current.shift();
      }
    };

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      ripples.current = ripples.current.filter(ripple => {
        // Update ripple
        ripple.radius += ripple.speed;
        ripple.opacity -= 0.02;

        // Draw ripple if still visible
        if (ripple.opacity > 0 && ripple.radius < ripple.maxRadius) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 0, 0, ${ripple.opacity})`; // Cyan color to match your bubbles
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Add inner glow
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          return true; // Keep ripple
        }
        
        return false; // Remove ripple
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }} // Blend mode for nice effect
    />
  );
};

export default CursorRipple; 