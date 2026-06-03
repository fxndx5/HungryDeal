'use client'

import { useEffect, useRef } from 'react'
import type { Restaurant } from '@shared/types'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any
  }
}

interface MapViewProps {
  restaurants: Restaurant[]
}

export function MapView({ restaurants }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    if (mapRef.current) return

    const initMap = () => {
      const L = window.L
      if (!L || !containerRef.current) return

      const map = L.map(containerRef.current).setView([40.4200, -3.7025], 13)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const iconHtml = `
        <div style="
          width: 36px; height: 36px;
          background: #ea580c;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      restaurants.forEach((r) => {
        if (!r.latitude || !r.longitude) return

        const marker = L.marker([r.latitude, r.longitude], { icon: customIcon }).addTo(map)
        const platformBadges = (r.platforms ?? [])
          .map((p) => {
            const colors: Record<string, string> = {
              uber_eats: 'background:#000;color:#fff',
              glovo: 'background:#facc15;color:#713f12',
              just_eat: 'background:#f97316;color:#fff',
            }
            const labels: Record<string, string> = {
              uber_eats: 'Uber Eats',
              glovo: 'Glovo',
              just_eat: 'Just Eat',
            }
            return `<span style="${colors[p] ?? ''};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${labels[p] ?? p}</span>`
          })
          .join(' ')

        marker.bindPopup(`
          <div style="min-width:180px;padding:4px 0;">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px 0;color:#1e293b;">${r.name}</p>
            <p style="font-size:12px;color:#64748b;margin:0 0 10px 0;">${r.address ?? ''}</p>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">${platformBadges}</div>
            <a href="/compare/${r.id}"
               style="display:block;background:#ea580c;color:white;text-align:center;
                      padding:7px 12px;border-radius:20px;text-decoration:none;
                      font-size:13px;font-weight:700;">
              Comparar precios
            </a>
          </div>
        `, { minWidth: 200 })
      })
    }

    if (window.L) {
      initMap()
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = initMap
    document.head.appendChild(script)

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapRef.current as any).remove()
        mapRef.current = null
      }
    }
  }, [restaurants])

  return (
    <div
      ref={containerRef}
      style={{ height: 'clamp(260px, 45vw, 480px)', width: '100%', borderRadius: '16px', overflow: 'hidden' }}
    />
  )
}
