import * as THREE from 'three'
import type { FireplaceDimensions, InsertFit } from '../config/modelSchema'
import { derivedInclineHorizontal } from '../config/validateModel'

/** Dimensiones interiores útiles del inserto a partir de clearances. */
export function insertBounds(fp: FireplaceDimensions, fit: InsertFit) {
  const widthFront = fp.frontWidth - fit.sideClearance * 2
  const widthBack = fp.backWidth - fit.sideClearance * 2
  const depth = fp.depth - fit.frontSetback - fit.rearClearance
  const height = fp.frontHeight - fit.bottomClearance - fit.topClearance
  const z0 = fit.frontSetback
  const y0 = fit.bottomClearance
  return { widthFront, widthBack, depth, height, z0, y0 }
}

export function widthAtZ(
  fp: FireplaceDimensions,
  fit: InsertFit,
  z: number,
): number {
  const b = insertBounds(fp, fit)
  const t = (z - b.z0) / Math.max(b.depth, 1e-6)
  return b.widthFront + (b.widthBack - b.widthFront) * Math.min(1, Math.max(0, t))
}

/** Altura del cielo interior de la cavidad en Z (plano inclinado + dintel). */
export function cavityCeilingY(fp: FireplaceDimensions, z: number): number {
  const zLintel = fp.lintelDepth
  const zThroatEnd = zLintel + fp.throatDepth
  if (z <= zLintel) return fp.frontHeight
  if (z <= zThroatEnd) return fp.throatHeight
  const inclineH = fp.inclineHorizontal || derivedInclineHorizontal(fp)
  const t = THREE.MathUtils.clamp((z - zThroatEnd) / Math.max(inclineH, 1e-6), 0, 1)
  return THREE.MathUtils.lerp(fp.throatHeight, fp.backWallHeight, t)
}

/** Techo usable del inserto: bajo dintel al frente; sigue la inclinada atrás con holgura. */
export function insertRoofY(
  fp: FireplaceDimensions,
  fit: InsertFit,
  z: number,
): number {
  const underLintel = fp.frontHeight - fit.topClearance
  const underIncline = cavityCeilingY(fp, z) - fit.roofClearance
  // En la zona de garganta el cielo “abre” hacia arriba; el inserto no sube ahí.
  if (z <= fp.lintelDepth + fp.throatDepth) {
    return Math.min(underLintel, underIncline)
  }
  return Math.min(underLintel, underIncline)
}

/**
 * Perfil lateral ZY de una pieza con rebaje diagonal (sigue el cielo de la cavidad).
 * inset: reduce holguras hacia dentro (cámara, revestimiento).
 */
export function chamferedSideProfile(
  fp: FireplaceDimensions,
  fit: InsertFit,
  inset = 0,
): THREE.Vector2[] {
  const z0 = fit.frontSetback + inset
  const zBack = fp.depth - fit.rearClearance - inset
  const y0 = fit.bottomClearance + inset * 0.5
  const yFront = fp.frontHeight - fit.topClearance - inset

  // Punto donde la inclinada (con holgura) baja del techo frontal
  let zBreak = z0
  const samples = 48
  for (let i = 0; i <= samples; i++) {
    const z = THREE.MathUtils.lerp(z0, zBack, i / samples)
    const roof = insertRoofY(fp, fit, z) - inset
    if (roof < yFront - 0.05) {
      zBreak = z
      break
    }
    zBreak = z
  }

  const yRear = Math.max(y0 + 4, insertRoofY(fp, fit, zBack) - inset)

  // Si el quiebre queda casi al fondo, aún así forzar un punto intermedio en la inclinada
  const zMid = THREE.MathUtils.lerp(Math.max(zBreak, fp.lintelDepth + fp.throatDepth), zBack, 0.45)
  const yMid = Math.max(y0 + 4, insertRoofY(fp, fit, zMid) - inset)

  const pts: THREE.Vector2[] = [
    new THREE.Vector2(z0, y0),
    new THREE.Vector2(z0, yFront),
  ]

  if (zBreak > z0 + 1) {
    pts.push(new THREE.Vector2(zBreak, yFront))
  }
  if (zMid > zBreak + 1 && zMid < zBack - 1) {
    pts.push(new THREE.Vector2(zMid, yMid))
  }
  pts.push(new THREE.Vector2(zBack, yRear))
  pts.push(new THREE.Vector2(zBack, y0))

  return pts
}

/**
 * Extruye un perfil ZY a lo ancho X (centrado), con ancho constante.
 * Preferir {@link loftZyProfileTapered} para carcasa/cámara dentro de la planta trapezoidal.
 */
export function extrudeZyProfile(
  profile: THREE.Vector2[],
  width: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(profile[0].x, profile[0].y)
  for (let i = 1; i < profile.length; i++) {
    shape.lineTo(profile[i].x, profile[i].y)
  }
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: false,
    curveSegments: 1,
  })
  // shape (z,y) → mundo: X = extrusión centrada, Y = y, Z = z
  geo.rotateY(-Math.PI / 2)
  geo.translate(width / 2, 0, 0)
  geo.computeVertexNormals()
  return geo
}

/** Y mín/máx del polígono ZY (x=z, y=y) en una estación Z. */
export function profileYExtentAtZ(
  profile: THREE.Vector2[],
  z: number,
): { yMin: number; yMax: number } | null {
  const ys: number[] = []
  const n = profile.length
  for (let i = 0; i < n; i++) {
    const a = profile[i]
    const b = profile[(i + 1) % n]
    const dz = b.x - a.x
    if (Math.abs(dz) < 1e-9) {
      if (Math.abs(a.x - z) < 1e-6) {
        ys.push(a.y, b.y)
      }
      continue
    }
    const t = (z - a.x) / dz
    if (t < -1e-6 || t > 1 + 1e-6) continue
    ys.push(a.y + (b.y - a.y) * THREE.MathUtils.clamp(t, 0, 1))
  }
  if (ys.length < 2) return null
  return { yMin: Math.min(...ys), yMax: Math.max(...ys) }
}

/** Inset y factores de ancho (compartidos con builders / canales). */
export const CHAMBER_INSET = 5
export const CHAMBER_WIDTH_FACTOR = 0.72
export const SECONDARY_CHANNEL_THICKNESS = 2.8

/** Ancho de pieza a lo largo de Z: planta del inserto menos inset lateral extra. */
export function pieceWidthAtZ(
  fp: FireplaceDimensions,
  fit: InsertFit,
  z: number,
  sideInset = 0,
): number {
  return Math.max(8, widthAtZ(fp, fit, z) - sideInset * 2)
}

export function chamberWidthAtZ(
  fp: FireplaceDimensions,
  fit: InsertFit,
  z: number,
): number {
  return Math.max(16, widthAtZ(fp, fit, z) * CHAMBER_WIDTH_FACTOR)
}

export function chamberWidth(fp: FireplaceDimensions, fit: InsertFit): number {
  const midZ = fit.frontSetback + (fp.depth - fit.frontSetback - fit.rearClearance) * 0.45
  return chamberWidthAtZ(fp, fit, midZ)
}

/**
 * Sólido con el mismo perfil ZY (rebaje) y ancho que sigue la planta trapezoidal.
 * widthAtZFn(z) = ancho total en X; centerXAtZFn opcional (default 0).
 */
export function loftZyProfileTapered(
  profile: THREE.Vector2[],
  widthAtZFn: (z: number) => number,
  stations = 12,
  centerXAtZFn: (z: number) => number = () => 0,
): THREE.BufferGeometry {
  const zMin = Math.min(...profile.map((p) => p.x))
  const zMax = Math.max(...profile.map((p) => p.x))

  type Ring = { z: number; yMin: number; yMax: number; hw: number; cx: number }
  const rings: Ring[] = []

  const pushRing = (z: number) => {
    const ext = profileYExtentAtZ(profile, z)
    if (!ext || ext.yMax - ext.yMin < 0.5) return
    if (rings.some((r) => Math.abs(r.z - z) < 0.05)) return
    const w = Math.max(4, widthAtZFn(z))
    rings.push({
      z,
      yMin: ext.yMin,
      yMax: ext.yMax,
      hw: w / 2,
      cx: centerXAtZFn(z),
    })
  }

  for (let i = 0; i <= stations; i++) {
    pushRing(THREE.MathUtils.lerp(zMin, zMax, i / stations))
  }
  for (const p of profile) pushRing(p.x)
  rings.sort((a, b) => a.z - b.z)

  if (rings.length < 2) {
    return extrudeZyProfile(profile, Math.max(4, widthAtZFn((zMin + zMax) / 2)))
  }

  const positions: number[] = []
  const indices: number[] = []

  const pushV = (x: number, y: number, z: number) => {
    positions.push(x, y, z)
    return positions.length / 3 - 1
  }

  const ringIdx: number[][] = []
  for (const r of rings) {
    ringIdx.push([
      pushV(r.cx - r.hw, r.yMin, r.z),
      pushV(r.cx + r.hw, r.yMin, r.z),
      pushV(r.cx + r.hw, r.yMax, r.z),
      pushV(r.cx - r.hw, r.yMax, r.z),
    ])
  }

  const quad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c, a, c, d)
  }

  for (let i = 0; i < ringIdx.length - 1; i++) {
    const A = ringIdx[i]
    const B = ringIdx[i + 1]
    quad(A[0], B[0], B[1], A[1])
    quad(A[1], B[1], B[2], A[2])
    quad(A[2], B[2], B[3], A[3])
    quad(A[3], B[3], B[0], A[0])
  }

  const F = ringIdx[0]
  const R = ringIdx[ringIdx.length - 1]
  quad(F[0], F[1], F[2], F[3])
  quad(R[1], R[0], R[3], R[2])

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export interface SecondaryChannelLayout {
  chamberW: number
  thickness: number
  /** Centro X del canal izquierdo / derecho (cara interior tocando la cámara) */
  leftX: number
  rightX: number
  zIn: number
  zOut: number
  yIn: number
  yOut: number
  profile: THREE.Vector2[]
}

/** Layout de canales laterales pegados a la cámara (contacto estanco conceptual). */
export function secondaryChannelLayout(
  fp: FireplaceDimensions,
  fit: InsertFit,
): SecondaryChannelLayout {
  const chamberW = chamberWidth(fp, fit)
  const thickness = SECONDARY_CHANNEL_THICKNESS
  const profile = chamferedSideProfile(fp, fit, CHAMBER_INSET)

  // Misma envolvente ZY que la cámara; entrada baja / salida alta en el tramo útil
  const zMin = Math.min(...profile.map((p) => p.x))
  const zMax = Math.max(...profile.map((p) => p.x))
  const yMin = Math.min(...profile.map((p) => p.y))
  const yMax = Math.max(...profile.map((p) => p.y))

  const zIn = THREE.MathUtils.lerp(zMin, zMax, 0.25)
  const zOut = THREE.MathUtils.lerp(zMin, zMax, 0.78)
  const yIn = THREE.MathUtils.lerp(yMin, yMax, 0.22)
  const yOut = THREE.MathUtils.lerp(yMin, yMax, 0.88)

  // Cara interior del canal = cara exterior de la cámara
  const leftX = -(chamberW / 2 + thickness / 2)
  const rightX = chamberW / 2 + thickness / 2

  return {
    chamberW,
    thickness,
    leftX,
    rightX,
    zIn,
    zOut,
    yIn,
    yOut,
    profile,
  }
}
