// pages/earth.js
import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function EarthPage() {
  const globeRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return  // no SSR

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
        .enablePointerInteraction(false)
        .width(window.innerWidth)
        .height(window.innerHeight)

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

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.5
      globe.controls().enableZoom = false
      globe.controls().enablePan = false

      const onResize = () =>
        globe.width(window.innerWidth).height(window.innerHeight)
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        globeRef.current.innerHTML = ''
      }
    })
  }, [])

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 z-50 px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 text-white hover:bg-opacity-20 transition-all duration-200"
      >
        ← Back
      </Link>
      
      <div ref={globeRef} />
    </div>
  )
}
