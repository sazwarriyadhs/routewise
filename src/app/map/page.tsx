'use client'

import { useEffect, useRef } from 'react'
import io from 'socket.io-client'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Circle as CircleStyle, Fill, Stroke, Icon } from 'ol/style'

const socket = io('http://localhost:3001') // Use port 3001 for our socket server

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const vectorSource = useRef(new VectorSource())
  const marker = useRef<Feature<Point>>()

  useEffect(() => {
    if (!mapRef.current) return;
    
    const olMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: vectorSource.current,
        }),
      ],
      view: new View({
        center: fromLonLat([106.8272, -6.1754]), // Jakarta
        zoom: 12,
      }),
    })

    // Add the vehicle marker
    const initialFeature = new Feature({
      geometry: new Point(fromLonLat([106.8272, -6.1754])),
    })
    initialFeature.setStyle(
      new Style({
        image: new Icon({
          src: '/image/truck-icon.png',
          scale: 0.5,
        }),
      }),
    )
    marker.current = initialFeature
    vectorSource.current.addFeature(initialFeature)

    // Listen for position data from the server
    socket.on('vehicle_position', (coords: [number, number]) => {
      const [lon, lat] = coords
      const geom = new Point(fromLonLat([lon, lat]))
      marker.current?.setGeometry(geom)
    })

    return () => {
      socket.disconnect()
      olMap.setTarget(undefined)
    }
  }, [])

  return <div ref={mapRef} className="w-full h-screen" />
}
