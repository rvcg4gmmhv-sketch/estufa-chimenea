import * as THREE from 'three'
import type { FireplaceDimensions } from '../config/modelSchema'

/** Puntos del perfil lateral en el plano ZY (origen: frente en Z=0, suelo Y=0). */
export function sideProfilePoints(fp: FireplaceDimensions): THREE.Vector2[] {
  const zLintel = fp.lintelDepth
  const zThroatEnd = fp.lintelDepth + fp.throatDepth
  const zBack = fp.depth

  // Contorno cerrado (sentido horario visto desde +X): suelo → frente → dintel → garganta → inclinada → pared → suelo
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0, fp.frontHeight),
    new THREE.Vector2(zLintel, fp.frontHeight),
    // Sube al nivel de garganta en el borde delantero de la garganta
    new THREE.Vector2(zLintel, fp.throatHeight),
    new THREE.Vector2(zThroatEnd, fp.throatHeight),
    new THREE.Vector2(zBack, fp.backWallHeight),
    new THREE.Vector2(zBack, 0),
  ]
}

/**
 * Construye la cavidad como malla de paredes (interior visible).
 * Planta trapezoidal: ancho interpola frontWidth → backWidth según Z.
 */
export function buildFireplaceCavityGeometry(fp: FireplaceDimensions): THREE.BufferGeometry {
  const zLintel = fp.lintelDepth
  const zThroatEnd = zLintel + fp.throatDepth
  const zBack = fp.depth

  // Ancho half en función de z
  const halfW = (z: number) => {
    const t = z / Math.max(fp.depth, 1e-6)
    return THREE.MathUtils.lerp(fp.frontWidth / 2, fp.backWidth / 2, t)
  }

  type Pt = { x: number; y: number; z: number }
  const ring = (z: number, yBottom: number, yTop: number): [Pt, Pt, Pt, Pt] => {
    const hw = halfW(z)
    return [
      { x: -hw, y: yBottom, z },
      { x: hw, y: yBottom, z },
      { x: hw, y: yTop, z },
      { x: -hw, y: yTop, z },
    ]
  }

  // Secciones clave a lo largo de Z
  const sections: { z: number; yBottom: number; yTop: number }[] = [
    { z: 0, yBottom: 0, yTop: fp.frontHeight },
    { z: zLintel, yBottom: 0, yTop: fp.frontHeight },
    // En la garganta el techo sube a throatHeight (apertura hacia chimenea se modela aparte)
    { z: zLintel + 0.01, yBottom: 0, yTop: fp.throatHeight },
    { z: zThroatEnd, yBottom: 0, yTop: fp.throatHeight },
    { z: zBack, yBottom: 0, yTop: fp.backWallHeight },
  ]

  // Añadir puntos intermedios en la inclinada para suavizar
  const inclineSteps = 4
  for (let i = 1; i < inclineSteps; i++) {
    const t = i / inclineSteps
    const z = THREE.MathUtils.lerp(zThroatEnd, zBack, t)
    const yTop = THREE.MathUtils.lerp(fp.throatHeight, fp.backWallHeight, t)
    sections.splice(sections.length - 1, 0, { z, yBottom: 0, yTop })
  }

  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  const pushQuad = (a: Pt, b: Pt, c: Pt, d: Pt) => {
    const base = positions.length / 3
    const ab = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z)
    const ad = new THREE.Vector3(d.x - a.x, d.y - a.y, d.z - a.z)
    const n = new THREE.Vector3().crossVectors(ab, ad).normalize()
    // Orientar normales hacia el interior de la cavidad (aprox. hacia centro)
    const mid = new THREE.Vector3(
      (a.x + b.x + c.x + d.x) / 4,
      (a.y + b.y + c.y + d.y) / 4,
      (a.z + b.z + c.z + d.z) / 4,
    )
    const toCenter = new THREE.Vector3(-mid.x, fp.frontHeight / 2 - mid.y, fp.depth / 2 - mid.z)
    if (n.dot(toCenter) < 0) n.negate()

    for (const p of [a, b, c, d]) {
      positions.push(p.x, p.y, p.z)
      normals.push(n.x, n.y, n.z)
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }

  const rings = sections.map((s) => ring(s.z, s.yBottom, s.yTop))

  // Paredes laterales, suelo y techo entre secciones consecutivas
  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i]
    const r1 = rings[i + 1]
    // suelo
    pushQuad(r0[0], r0[1], r1[1], r1[0])
    // techo
    pushQuad(r0[3], r1[3], r1[2], r0[2])
    // izquierda (x-)
    pushQuad(r0[0], r1[0], r1[3], r0[3])
    // derecha (x+)
    pushQuad(r0[1], r0[2], r1[2], r1[1])
  }

  // Pared posterior
  const back = rings[rings.length - 1]
  pushQuad(back[0], back[3], back[2], back[1])

  // Marco frontal (labio hacia afuera, pared delgada)
  const front = rings[0]
  const lip = 4
  const fw = fp.frontWidth / 2 + lip
  const outer: [Pt, Pt, Pt, Pt] = [
    { x: -fw, y: 0, z: -0.5 },
    { x: fw, y: 0, z: -0.5 },
    { x: fw, y: fp.frontHeight + lip * 0.5, z: -0.5 },
    { x: -fw, y: fp.frontHeight + lip * 0.5, z: -0.5 },
  ]
  // Conectar marco exterior con apertura
  pushQuad(outer[0], front[0], front[3], outer[3]) // izq
  pushQuad(front[1], outer[1], outer[2], front[2]) // der
  pushQuad(front[3], front[2], outer[2], outer[3]) // arriba
  pushQuad(outer[0], outer[1], front[1], front[0]) // abajo

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function chimneyStackGeometry(fp: FireplaceDimensions): THREE.CylinderGeometry {
  const radius = Math.min(fp.throatDepth, fp.backWidth * 0.2) * 0.45
  return new THREE.CylinderGeometry(radius, radius * 1.05, fp.chimneyHeight, 16)
}

export function chimneyStackPosition(fp: FireplaceDimensions): THREE.Vector3 {
  const z = fp.lintelDepth + fp.throatDepth / 2
  return new THREE.Vector3(0, fp.throatHeight + fp.chimneyHeight / 2, z)
}
