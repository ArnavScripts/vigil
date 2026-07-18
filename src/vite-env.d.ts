/// <reference types="vite/client" />

declare module 'world-atlas/countries-110m.json' {
  const data: {
    type: string
    objects: { countries: any; land: any }
    arcs: any[]
    bbox: number[]
    transform: any
  }
  export default data
}
