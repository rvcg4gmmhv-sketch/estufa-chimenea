import * as THREE from 'three'
import type { MaterialKey } from '../config/modelSchema'

/** Colores didácticos fijos de las tres envolventes. */
export const ENVELOPE_COLORS = {
  masonry: '#a67c52',
  masonryEdge: '#6b4e32',
  masonrySelected: '#c4996a',
  shell: '#3d7a8c',
  shellEdge: '#1e4a58',
  shellSelected: '#5a9aab',
  chamber: '#2a2e33',
  chamberEdge: '#0d0f12',
  chamberSelected: '#3d4450',
} as const

export function createMaterial(
  key: MaterialKey,
  opts?: {
    opacity?: number
    transparent?: boolean
    selected?: boolean
    /** Fuerza color de envolvente didáctica */
    envelope?: 'masonry' | 'shell' | 'chamber'
  },
): THREE.Material {
  const selected = opts?.selected
  const opacity = opts?.opacity ?? 1
  const transparent = opts?.transparent || opacity < 0.99

  const base: THREE.MeshStandardMaterialParameters = {
    transparent,
    opacity,
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.DoubleSide,
  }

  if (opts?.envelope === 'masonry') {
    return new THREE.MeshStandardMaterial({
      ...base,
      color: selected ? ENVELOPE_COLORS.masonrySelected : ENVELOPE_COLORS.masonry,
      roughness: 0.92,
      metalness: 0.04,
    })
  }
  if (opts?.envelope === 'shell') {
    return new THREE.MeshStandardMaterial({
      ...base,
      color: selected ? ENVELOPE_COLORS.shellSelected : ENVELOPE_COLORS.shell,
      metalness: 0.45,
      roughness: 0.4,
    })
  }
  if (opts?.envelope === 'chamber') {
    return new THREE.MeshStandardMaterial({
      ...base,
      color: selected ? ENVELOPE_COLORS.chamberSelected : ENVELOPE_COLORS.chamber,
      metalness: 0.35,
      roughness: 0.55,
    })
  }

  switch (key) {
    case 'masonry':
      return new THREE.MeshStandardMaterial({
        ...base,
        color: selected ? ENVELOPE_COLORS.masonrySelected : ENVELOPE_COLORS.masonry,
        roughness: 0.9,
        metalness: 0.05,
      })
    case 'refractory':
      return new THREE.MeshStandardMaterial({
        ...base,
        color: selected ? '#d9b48a' : '#b8956c',
        roughness: 0.85,
      })
    case 'steel':
      return new THREE.MeshStandardMaterial({
        ...base,
        color: selected ? '#9aa3ad' : '#5c6570',
        metalness: 0.55,
        roughness: 0.35,
      })
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: selected ? '#b8d4e8' : '#7aa0b8',
        transparent: true,
        opacity: selected ? 0.45 : 0.28,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.6,
        thickness: 0.5,
        side: THREE.DoubleSide,
      })
    case 'duct':
      return new THREE.MeshStandardMaterial({
        ...base,
        color: selected ? '#7a8f9e' : '#4a5c68',
        metalness: 0.4,
        roughness: 0.4,
      })
    case 'insulation':
      return new THREE.MeshStandardMaterial({
        ...base,
        color: selected ? '#cfc6b0' : '#a89f88',
        roughness: 0.95,
      })
    default:
      return new THREE.MeshStandardMaterial({ ...base, color: '#888' })
  }
}

export const CIRCUIT_COLORS = {
  combustion: '#2f6fed',
  gases: '#e25a2c',
  heatingCold: '#6ec8e6',
  heatingHot: '#e6b84d',
} as const
