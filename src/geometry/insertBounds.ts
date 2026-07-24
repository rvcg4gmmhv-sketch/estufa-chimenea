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
 * Extruye un perfil ZY a lo ancho X (centrado), con ancho medio aproximado.
 * El ancho varía poco: usamos el ancho en el centro de profundidad (esquemático).
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

/** Inset y ancho de la cámara (compartido con canales secundarios). */
export const CHAMBER_INSET = 5
export const CHAMBER_WIDTH_FACTOR = 0.72
export const SECONDARY_CHANNEL_THICKNESS = 2.8

export function chamberWidth(fp: FireplaceDimensions, fit: InsertFit): number {
  const midZ = fit.frontSetback + (fp.depth - fit.frontSetback - fit.rearClearance) * 0.45
  const midW = widthAtZ(fp, fit, midZ)
  return Math.max(16, midW * CHAMBER_WIDTH_FACTOR)
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
