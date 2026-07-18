import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
// @ts-ignore - three-globe ships its own types but TS can't find them automatically
import ThreeGlobe from 'three-globe'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'

const ARCS = [
  { startLat: 55.75, startLng: 37.62, endLat: 40.71, endLng: -74.01 },
  { startLat: 39.90, startLng: 116.41, endLat: 35.68, endLng: 139.65 },
  { startLat: 51.51, startLng: -0.13, endLat: 48.86, endLng: 2.35 },
  { startLat: 1.35, startLng: 103.82, endLat: 28.61, endLng: 77.21 },
  { startLat: -23.55, startLng: -46.63, endLat: 40.71, endLng: -74.01 },
  { startLat: 55.75, startLng: 37.62, endLat: 41.01, endLng: 28.98 },
  { startLat: 37.77, startLng: -122.42, endLat: 40.71, endLng: -74.01 },
  { startLat: 39.90, startLng: 116.41, endLat: 1.35, endLng: 103.82 },
  { startLat: -33.87, startLng: 151.21, endLat: 35.68, endLng: 139.65 },
  { startLat: 25.20, startLng: 55.27, endLat: 51.51, endLng: -0.13 },
  { startLat: -26.20, startLng: 28.05, endLat: 48.86, endLng: 2.35 },
  { startLat: 19.08, startLng: 72.88, endLat: 25.20, endLng: 55.27 },
  { startLat: 55.75, startLng: 37.62, endLat: 51.51, endLng: -0.13 },
  { startLat: 37.77, startLng: -122.42, endLat: -23.55, endLng: -46.63 },
]

const RINGS = [
  { lat: 40.71, lng: -74.01 },
  { lat: 55.75, lng: 37.62 },
  { lat: 35.68, lng: 139.65 },
  { lat: 51.51, lng: -0.13 },
  { lat: 1.35, lng: 103.82 },
  { lat: 37.77, lng: -122.42 },
  { lat: 39.90, lng: 116.41 },
  { lat: -23.55, lng: -46.63 },
  { lat: 25.20, lng: 55.27 },
]

interface GlobeProps {
  onLoad?: () => void
}

export default function Globe({ onLoad }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 300

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(1, 1, 1)
    scene.add(dirLight)
    const backLight = new THREE.DirectionalLight(0x52525b, 0.4)
    backLight.position.set(-1, -0.5, -1)
    scene.add(backLight)

    // Build countries GeoJSON
    const countries = (feature(worldData as any, worldData.objects.countries) as any).features

    // three-globe instance
    const globe = new ThreeGlobe({
      waitForGlobeReady: true,
      animateIn: false,
    })
      .globeImageUrl(null as any)
      .showAtmosphere(true)
      .atmosphereColor('#18181b')
      .atmosphereAltitude(0.12)
      .polygonsData(countries)
      .polygonCapColor(() => '#09090b')
      .polygonSideColor(() => 'rgba(39,39,42,0.6)')
      .polygonStrokeColor(() => '#27272a')
      .polygonAltitude(0.005)
      .arcsData(ARCS)
      .arcColor(() => '#ef4444')
      .arcDashLength(0.35)
      .arcDashGap(0.15)
      .arcDashAnimateTime(2200)
      .arcAltitudeAutoScale(0.5)
      .arcStroke(0.45)
      .ringsData(RINGS)
      .ringColor(() => '#ef4444')
      .ringMaxRadius(4.5)
      .ringPropagationSpeed(2.5)
      .ringRepeatPeriod(1200)
      .pointsData(RINGS)
      .pointColor(() => '#ef4444')
      .pointRadius(0.45)
      .pointAltitude(0.02)

    // Set globe material (ocean color)
    const globeMat = globe.globeMaterial() as THREE.MeshPhongMaterial
    globeMat.color = new THREE.Color('#050505')
    globeMat.emissive = new THREE.Color('#000000')
    globeMat.shininess = 8
    globeMat.specular = new THREE.Color('#18181b')

    scene.add(globe)

    setLoaded(true)
    onLoad?.()

    // Outer atmosphere mesh
    const atmosGeo = new THREE.SphereGeometry(102, 64, 64)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x27272a,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmosGeo, atmosMat))

    // Drag to rotate
    let isDragging = false
    let prevMouse = { x: 0, y: 0 }
    let autoRotateSpeed = 0.12
    let velX = 0, velY = autoRotateSpeed

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true
      const p = 'touches' in e ? e.touches[0] : e
      prevMouse = { x: p.clientX, y: p.clientY }
      velX = 0
      velY = 0
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const p = 'touches' in e ? e.touches[0] : e
      const dx = (p.clientX - prevMouse.x) * 0.3
      const dy = (p.clientY - prevMouse.y) * 0.12
      velY = dx
      velX = dy
      prevMouse = { x: p.clientX, y: p.clientY }
    }
    const onUp = () => {
      isDragging = false
      setTimeout(() => { velY = autoRotateSpeed }, 600)
    }

    mount.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    mount.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)

    // Animation loop
    let frame: number
    const animate = () => {
      frame = requestAnimationFrame(animate)
      if (!isDragging) {
        velY += (autoRotateSpeed - velY) * 0.02
        velX *= 0.92
      }
      globe.rotation.y += velY * 0.005
      globe.rotation.x += velX * 0.005
      globe.rotation.x = Math.max(-0.5, Math.min(0.5, globe.rotation.x))
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      mount.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      mount.removeEventListener('touchstart', onDown)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full globe-wrap">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-xs text-zinc-600 tracking-widest">INITIALIZING GLOBE...</div>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />
    </div>
  )
}
