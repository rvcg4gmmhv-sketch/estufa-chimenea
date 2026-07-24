import * as THREE from 'three'
import type { DesignElement } from '../config/modelSchema'

export function buildElementGeometry(el: DesignElement): THREE.BufferGeometry {
  const s = el.scale
  switch (el.catalogType) {
    case 'fan': {
      const geo = new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.z, 16)
      geo.rotateX(Math.PI / 2)
      return geo
    }
    case 'duct':
      return new THREE.BoxGeometry(s.x, s.y, s.z)
    case 'elbow': {
      const geo = new THREE.TorusGeometry(s.x / 3, s.y / 5, 8, 12, Math.PI / 2)
      return geo
    }
    case 'plenum':
      return new THREE.BoxGeometry(s.x, s.y, s.z)
    case 'grille':
      return new THREE.BoxGeometry(s.x, s.y, s.z)
    case 'baffle':
      return new THREE.BoxGeometry(s.x, s.y, s.z)
    case 'box':
      return new THREE.BoxGeometry(s.x, s.y, s.z)
    case 'sensor':
      return new THREE.SphereGeometry(Math.max(s.x, s.y, s.z) / 2, 12, 12)
    default:
      return new THREE.BoxGeometry(s.x, s.y, s.z)
  }
}

export function elementPortWorld(el: DesignElement): Record<string, THREE.Vector3> {
  const map: Record<string, THREE.Vector3> = {}
  const origin = new THREE.Vector3(el.position.x, el.position.y, el.position.z)
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(el.rotation.x),
    THREE.MathUtils.degToRad(el.rotation.y),
    THREE.MathUtils.degToRad(el.rotation.z),
  )
  for (const port of el.ports) {
    const local = new THREE.Vector3(port.local.x, port.local.y, port.local.z)
    local.applyEuler(euler)
    map[port.id] = origin.clone().add(local)
  }
  return map
}
