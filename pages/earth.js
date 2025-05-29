// pages/earth.js
import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function EarthPage() {
  const globeRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return  // no SSR

    // Globe instance reference for proper cleanup
    let globeInstance = null;

    // 1) your list of highlights, all lower-case:
    const highlighted = new Set([
      'usa',
      'cuba',
      'italy',
      'spain',
      'france',
      'netherlands',
      'croatia',
      'turkey',
      'greece',         
      'england',     
      'united arab emirates',
      'thailand',
      'mexico',
      'jamaica',
      'portugal',
      'morocco',
      'the bahamas',
      'canada'
    ])

    // 2) utility to grab *any* name-field and lowercase it
    const getName = feat => {
      const p = feat.properties
      return (
        p.name ||
        p.NAME ||
        p.NAME_LONG ||
        p.name_long ||
        p.ADMIN ||
        p.admin ||
        ''
      ).toString().toLowerCase()
    }

    // Initialize globe only when this page loads
    import('globe.gl').then(({ default: Globe }) => {
      const globe = Globe()
        .globeImageUrl(null)
        .backgroundColor('black')
        .showAtmosphere(false)
        .showGraticules(true)

        // 3) strict .has() on the cleaned name:
        .polygonCapColor(f => 
          highlighted.has(getName(f))
            ? '#00ff00'
            : 'rgba(0,0,0,0)'
        )
        .polygonSideColor(() => 'rgba(255,255,255,0.1)')
        .polygonStrokeColor(() => 'rgba(255,255,255,0.3)')
        .polygonAltitude(f => 
          highlighted.has(getName(f)) ? 0.02 : 0.01
        )
        .enablePointerInteraction(true)
        .width(window.innerWidth)
        .height(window.innerHeight)

      // Store globe instance for cleanup
      globeInstance = globe;
      globe(globeRef.current)

      fetch(
        'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
      )
        .then(r => r.json())
        .then(({ features }) => {
          globe.polygonsData(features)

          // 🔥 debug: print out all names once so you can 
          //   see exactly what string the geoJSON is providing
          console.log('all country names:', features.map(getName))
        })
        .catch(console.error)

      // Performance optimized: no auto-rotation, user controls only
      globe.controls().autoRotate = false
      globe.controls().enableZoom = true
      globe.controls().enablePan = true

      const onResize = () =>
        globe.width(window.innerWidth).height(window.innerHeight)
      window.addEventListener('resize', onResize)

      return () => {
        // Enhanced cleanup when leaving the page
        window.removeEventListener('resize', onResize)
        
        // Stop all globe animations and processes
        if (globeInstance) {
          globeInstance.pauseAnimation(); // Stop any running animations
          globeInstance.controls().dispose(); // Dispose of controls
        }
        
        // Clear the DOM container completely
        if (globeRef.current) {
        globeRef.current.innerHTML = ''
        }
        
        console.log('Earth page cleanup completed - all processes stopped')
      }
    })
  }, []) // Empty dependency array ensures this only runs once when page loads

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 z-50 px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 text-white hover:bg-opacity-20 transition-all duration-200"
      >
        ← Back
      </Link>
      
      {/* Performance tip */}
      <div className="absolute top-8 right-8 z-50 px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 text-white text-sm">
        Drag to rotate • Scroll to zoom
      </div>
      
      <div ref={globeRef} />
    </div>
  )
}
