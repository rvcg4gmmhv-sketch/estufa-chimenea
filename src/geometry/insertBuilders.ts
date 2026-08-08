import * as THREE from 'three'
import type { DesignModel, LayerDef } from '../config/modelSchema'
import { frontLayoutFromModel } from './frontLayout'
import {
  CHAMBER_INSET,
  chamferedSideProfile,
  chamberWidth,
  chamberWidthAtZ,
  insertBounds,
  insertRoofY,
  loftZyProfileTapered,
  pieceWidthAtZ,
  secondaryChannelLayout,
  widthAtZ,
} from './insertBounds'

export interface BuiltPart {
  geometry: THREE.BufferGeometry
  position: THREE.Vector3
  rotation?: THREE.Euler
  /** Marca piezas de la hoja de puerta (animables) */
  doorLeaf?: boolean
  materialOverride?: 'steel' | 'glass' | 'seal'
}

function grilleGeometry(w: number, h: number, bars = 5): THREE.BufferGeometry {
  const group: THREE.BufferGeometry[] = []
  const frame = new THREE.BoxGeometry(w, h, 1.2)
  group.push(frame)
  const gap = w / (bars + 1)
  for (let i = 1; i <= bars; i++) {
    const bar = new THREE.BoxGeometry(0.6, h * 0.85, 0.4)
    bar.translate(-w / 2 + gap * i, 0, 0.5)
    group.push(bar)
  }
  // Merge simply: return frame only + we'll add bars as separate parts
  return frame
}

/** Genera geometría esquemática por capa. */
export function buildLayerPart(layer: LayerDef, model: DesignModel): BuiltPart[] {
  const fp = model.fireplace
  const fit = model.insertFit
  const b = insertBounds(fp, fit)
  const midZ = b.z0 + b.depth * 0.45
  const midW = widthAtZ(fp, fit, midZ)
  const fl = frontLayoutFromModel(model)

  switch (layer.id) {
    case 'masonry':
      return []
    case 'frame': {
      // Placa frontal: cierra la boca de la obra, con huecos para puerta y rejillas
      const p = fl.facadePlate
      const z = p.zFace + p.thickness / 2
      const zSeal = 0.15 // junta contra Z=0 de la albañilería
      const left = -p.width / 2
      const right = p.width / 2
      const bottom = p.cy - p.height / 2
      const top = p.cy + p.height / 2

      const doorL = -p.doorCut.width / 2
      const doorR = p.doorCut.width / 2
      const doorB = p.doorCut.cy - p.doorCut.height / 2
      const doorT = p.doorCut.cy + p.doorCut.height / 2

      const gtL = -p.grilleTopCut.width / 2
      const gtR = p.grilleTopCut.width / 2
      const gtB = p.grilleTopCut.cy - p.grilleTopCut.height / 2
      const gtT = p.grilleTopCut.cy + p.grilleTopCut.height / 2

      const gbL = -p.grilleBottomCut.width / 2
      const gbR = p.grilleBottomCut.width / 2
      const gbB = p.grilleBottomCut.cy - p.grilleBottomCut.height / 2
      const gbT = p.grilleBottomCut.cy + p.grilleBottomCut.height / 2

      const th = p.thickness
      const parts: BuiltPart[] = []

      const panel = (w: number, h: number, x: number, y: number, depth = th, zz = z) => {
        if (w < 0.3 || h < 0.3) return
        parts.push({
          geometry: new THREE.BoxGeometry(w, h, depth),
          position: new THREE.Vector3(x, y, zz),
          materialOverride: 'steel',
        })
      }

      // Franja superior (sobre rejilla caliente)
      panel(p.width, top - gtT, 0, (top + gtT) / 2)
      // Franja entre rejilla caliente y puerta
      panel(p.width, gtB - doorT, 0, (gtB + doorT) / 2)
      // Franja entre puerta y rejilla fría
      panel(p.width, doorB - gbT, 0, (doorB + gbT) / 2)
      // Franja inferior (bajo rejilla fría)
      panel(p.width, gbB - bottom, 0, (gbB + bottom) / 2)

      // Laterales a la altura de cada abertura (cierran el hueco de la boca)
      const midBand = (y0: number, y1: number, cutL: number, cutR: number) => {
        const h = y1 - y0
        const cy = (y0 + y1) / 2
        panel(cutL - left, h, (left + cutL) / 2, cy)
        panel(right - cutR, h, (cutR + right) / 2, cy)
      }
      midBand(gtB, gtT, gtL, gtR)
      midBand(doorB, doorT, doorL, doorR)
      midBand(gbB, gbT, gbL, gbR)

      // Bisel / labio perimetral hacia la habitación (remate estético)
      const lipD = 1.2
      const lipZ = p.zFace - lipD / 2
      const lipT = 1.4
      panel(p.width + 0.4, lipT, 0, top + lipT / 2 - 0.2, lipD, lipZ)
      panel(p.width + 0.4, lipT, 0, bottom - lipT / 2 + 0.2, lipD, lipZ)
      panel(lipT, p.height - 0.4, left - lipT / 2 + 0.1, p.cy, lipD, lipZ)
      panel(lipT, p.height - 0.4, right + lipT / 2 - 0.1, p.cy, lipD, lipZ)

      // Junta hermética conceptual placa ↔ obra (cara posterior)
      parts.push({
        geometry: new THREE.BoxGeometry(fp.frontWidth + 1, fp.frontHeight + 1, 0.5),
        position: new THREE.Vector3(0, fp.frontHeight / 2, zSeal),
        materialOverride: 'seal',
      })

      // Marco embutido alrededor del hueco de puerta (adosado a la placa)
      const reveal = 1.6
      const rz = p.zFace + th * 0.15
      panel(p.doorCut.width + reveal * 2, reveal, 0, doorT + reveal / 2, th * 0.7, rz)
      panel(p.doorCut.width + reveal * 2, reveal, 0, doorB - reveal / 2, th * 0.7, rz)
      panel(reveal, p.doorCut.height, doorL - reveal / 2, p.doorCut.cy, th * 0.7, rz)
      panel(reveal, p.doorCut.height, doorR + reveal / 2, p.doorCut.cy, th * 0.7, rz)

      return parts
    }
    case 'hoodSeal': {
      const geo = new THREE.TorusGeometry(fl.hoodSeal.radius, 1.8, 8, 20)
      geo.rotateX(Math.PI / 2)
      return [
        {
          geometry: geo,
          position: new THREE.Vector3(0, fl.hoodSeal.y, fl.hoodSeal.z),
        },
      ]
    }
    case 'shell': {
      const profile = chamferedSideProfile(fp, fit, 0)
      return [
        {
          geometry: loftZyProfileTapered(profile, (z) => pieceWidthAtZ(fp, fit, z, 0)),
          position: new THREE.Vector3(0, 0, 0),
        },
      ]
    }
    case 'chamber': {
      const profile = chamferedSideProfile(fp, fit, CHAMBER_INSET)
      return [
        {
          geometry: loftZyProfileTapered(profile, (z) => chamberWidthAtZ(fp, fit, z)),
          position: new THREE.Vector3(0, 0, 0),
        },
      ]
    }
    case 'lining': {
      const profile = chamferedSideProfile(fp, fit, 7)
      return [
        {
          geometry: loftZyProfileTapered(
            profile,
            (z) => Math.max(12, chamberWidthAtZ(fp, fit, z) * 0.9),
          ),
          position: new THREE.Vector3(0, 0, 0),
        },
      ]
    }
    case 'doorFrame': {
      // Marco en la placa + manguito hasta la cara de la cámara (cierra el hueco del aire limpio)
      const { door } = fl
      const tw = 1.8
      const depth = 2.4
      const z = door.zFrame
      const cy = (door.yBottom + door.yTop) / 2
      const parts: BuiltPart[] = [
        {
          geometry: new THREE.BoxGeometry(door.width + tw * 2, tw, depth),
          position: new THREE.Vector3(0, door.yTop + tw / 2, z),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(door.width + tw * 2, tw, depth),
          position: new THREE.Vector3(0, door.yBottom - tw / 2, z),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(tw, door.height, depth),
          position: new THREE.Vector3(-door.width / 2 - tw / 2, cy, z),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(tw, door.height, depth),
          position: new THREE.Vector3(door.width / 2 + tw / 2, cy, z),
          materialOverride: 'steel',
        },
        // Junta hermética puerta ↔ marco
        {
          geometry: new THREE.BoxGeometry(door.width + 0.8, door.height + 0.8, 0.35),
          position: new THREE.Vector3(0, cy, door.zLeaf + 0.9),
          materialOverride: 'seal',
        },
      ]
      // Túnel estanco placa → cámara (evita que el aire limpio escape por la abertura)
      const tunnelEnd = fl.chamberFrontZ + 0.5
      const tunnelLen = Math.max(4, tunnelEnd - z)
      const tunnelZ = z + tunnelLen / 2
      const tw2 = 1.4
      parts.push(
        {
          geometry: new THREE.BoxGeometry(door.width + tw2 * 2, tw2, tunnelLen),
          position: new THREE.Vector3(0, door.yTop + tw2 / 2, tunnelZ),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(door.width + tw2 * 2, tw2, tunnelLen),
          position: new THREE.Vector3(0, door.yBottom - tw2 / 2, tunnelZ),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(tw2, door.height, tunnelLen),
          position: new THREE.Vector3(-door.width / 2 - tw2 / 2, cy, tunnelZ),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(tw2, door.height, tunnelLen),
          position: new THREE.Vector3(door.width / 2 + tw2 / 2, cy, tunnelZ),
          materialOverride: 'steel',
        },
      )
      return parts
    }
    case 'door': {
      const { door } = fl
      const cy = (door.yBottom + door.yTop) / 2
      const leaf: BuiltPart[] = [
        {
          geometry: new THREE.BoxGeometry(door.width, door.height, 1.4),
          position: new THREE.Vector3(0, cy, 0),
          doorLeaf: true,
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.BoxGeometry(door.width * 0.78, door.height * 0.72, 0.5),
          position: new THREE.Vector3(0, cy, -0.5),
          doorLeaf: true,
          materialOverride: 'glass',
        },
        // Bisagras conceptuales (lado izquierdo)
        {
          geometry: new THREE.CylinderGeometry(0.7, 0.7, 2.2, 10),
          position: new THREE.Vector3(-door.width / 2 + 0.5, cy + door.height * 0.28, 0.4),
          rotation: new THREE.Euler(0, 0, Math.PI / 2),
          doorLeaf: true,
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.CylinderGeometry(0.7, 0.7, 2.2, 10),
          position: new THREE.Vector3(-door.width / 2 + 0.5, cy - door.height * 0.28, 0.4),
          rotation: new THREE.Euler(0, 0, Math.PI / 2),
          doorLeaf: true,
          materialOverride: 'steel',
        },
        // Cierre conceptual (lado derecho)
        {
          geometry: new THREE.BoxGeometry(1.5, 4, 1.2),
          position: new THREE.Vector3(door.width / 2 - 1, cy, -0.2),
          doorLeaf: true,
          materialOverride: 'steel',
        },
      ]
      return leaf
    }
    case 'outletFront': {
      const g = fl.grilleTop
      const parts: BuiltPart[] = [
        { geometry: grilleGeometry(g.width, g.height), position: new THREE.Vector3(0, g.y, g.z) },
      ]
      for (let i = 1; i <= 5; i++) {
        const bar = new THREE.BoxGeometry(0.55, g.height * 0.8, 0.35)
        parts.push({
          geometry: bar,
          position: new THREE.Vector3(-g.width / 2 + (g.width / 6) * i, g.y, g.z + 0.5),
        })
      }
      return parts
    }
    case 'grilleBottom': {
      const g = fl.grilleBottom
      const parts: BuiltPart[] = [
        { geometry: grilleGeometry(g.width, g.height), position: new THREE.Vector3(0, g.y, g.z) },
      ]
      for (let i = 1; i <= 5; i++) {
        const bar = new THREE.BoxGeometry(0.55, g.height * 0.8, 0.35)
        parts.push({
          geometry: bar,
          position: new THREE.Vector3(-g.width / 2 + (g.width / 6) * i, g.y, g.z + 0.5),
        })
      }
      return parts
    }
    case 'cleanFan': {
      const f = fl.fan
      return [
        {
          geometry: new THREE.BoxGeometry(f.width, f.height, f.depth),
          position: new THREE.Vector3(0, f.y, f.z),
          materialOverride: 'steel',
        },
        {
          geometry: new THREE.CylinderGeometry(f.height * 0.35, f.height * 0.35, 2, 16),
          position: new THREE.Vector3(0, f.y, f.z - f.depth / 2 + 1),
          rotation: new THREE.Euler(Math.PI / 2, 0, 0),
          materialOverride: 'steel',
        },
        // Separación estanca conceptual (techo del compartimento ventilador)
        {
          geometry: new THREE.BoxGeometry(f.width + 2, 0.8, f.depth + 2),
          position: new THREE.Vector3(0, f.y + f.height / 2 + 0.6, f.z),
          materialOverride: 'seal',
        },
      ]
    }
    case 'exteriorIntake': {
      const e = fl.exteriorIntake
      const midX = (e.outerX + e.innerX) / 2
      // Tramo horizontal pasillo → plenum
      const run = new THREE.CylinderGeometry(e.radius, e.radius, e.length, 12)
      run.rotateZ(Math.PI / 2)
      // Collar / boca exterior (hacia pasillo)
      const mouth = new THREE.CylinderGeometry(e.radius * 1.35, e.radius * 1.15, 2.5, 12)
      mouth.rotateZ(Math.PI / 2)
      // Manguito que se clava en la cara del plenum
      const stub = new THREE.CylinderGeometry(e.radius * 0.95, e.radius * 0.95, 3, 10)
      stub.rotateZ(Math.PI / 2)
      return [
        {
          geometry: run,
          position: new THREE.Vector3(midX, e.y, e.z),
        },
        {
          geometry: mouth,
          position: new THREE.Vector3(e.outerX - 0.5, e.y, e.z),
        },
        {
          geometry: stub,
          position: new THREE.Vector3(e.innerX + 0.5, e.y, e.z),
        },
      ]
    }
    case 'plenum': {
      const p = fl.plenum
      return [
        {
          geometry: new THREE.BoxGeometry(p.width, p.height, p.depth),
          position: new THREE.Vector3(0, p.y, p.z),
        },
      ]
    }
    case 'primary': {
      const p = fl.plenum
      // Sale del frente del plenum hacia el interior de la cámara
      const zEnd = fl.chamberFrontZ + 8
      const zStart = p.z - p.depth / 2
      const len = Math.max(10, zStart - zEnd + 4)
      const zMid = (zStart + zEnd) / 2
      return [
        {
          geometry: new THREE.BoxGeometry(6, 3.5, len),
          position: new THREE.Vector3(0, p.y + p.height / 2 + 1.8, zMid),
        },
      ]
    }
    case 'secondary': {
      const layout = secondaryChannelLayout(fp, fit)
      const t = layout.thickness
      return [
        {
          geometry: loftZyProfileTapered(
            layout.profile,
            () => t,
            12,
            (z) => -(chamberWidthAtZ(fp, fit, z) / 2 + t / 2),
          ),
          position: new THREE.Vector3(0, 0, 0),
        },
        {
          geometry: loftZyProfileTapered(
            layout.profile,
            () => t,
            12,
            (z) => chamberWidthAtZ(fp, fit, z) / 2 + t / 2,
          ),
          position: new THREE.Vector3(0, 0, 0),
        },
      ]
    }
    case 'secDistributor': {
      const d = fl.secondaryDistributor
      return [
        {
          geometry: new THREE.BoxGeometry(d.width, 2.5, 5),
          position: new THREE.Vector3(0, d.y, d.z),
        },
      ]
    }
    case 'curtain': {
      const { door } = fl
      return [
        {
          geometry: new THREE.BoxGeometry(door.width * 0.85, 1.2, 1.5),
          position: new THREE.Vector3(0, door.yTop - 1.5, door.zLeaf + 1.2),
        },
        {
          geometry: new THREE.BoxGeometry(door.width * 0.75, door.height * 0.55, 0.4),
          position: new THREE.Vector3(0, (door.yBottom + door.yTop) / 2, door.zLeaf + 1.5),
        },
      ]
    }
    case 'baffle': {
      const z = b.z0 + b.depth * 0.52
      const roof = insertRoofY(fp, fit, z) - 3
      const cw = chamberWidth(fp, fit)
      return [
        {
          geometry: new THREE.BoxGeometry(cw * 0.92, 2.5, b.depth * 0.18),
          position: new THREE.Vector3(0, roof - 2, z),
        },
      ]
    }
    case 'exchanger': {
      const zFront = fp.lintelDepth + fp.throatDepth + 2
      const zBack = fp.depth - fit.rearClearance - 1
      const y0 = b.y0 + 8
      const profile = [
        new THREE.Vector2(zFront, y0),
        new THREE.Vector2(zFront, Math.max(y0 + 2, insertRoofY(fp, fit, zFront) - 4)),
        new THREE.Vector2(zBack, Math.max(y0 + 2, insertRoofY(fp, fit, zBack) - 3)),
        new THREE.Vector2(zBack, y0),
      ]
      return [
        {
          geometry: loftZyProfileTapered(
            profile,
            (z) => Math.max(10, widthAtZ(fp, fit, z) * 0.48),
          ),
          position: new THREE.Vector3(0, 0, 0),
        },
      ]
    }
    case 'flue': {
      return [
        {
          geometry: new THREE.CylinderGeometry(4, 4.5, 28, 12),
          position: new THREE.Vector3(0, fl.hoodSeal.y, fl.hoodSeal.z),
        },
      ]
    }
    case 'outletSide': {
      const z = b.z0 + b.depth * 0.3
      const roof = insertRoofY(fp, fit, z) - 6
      return [
        {
          geometry: new THREE.BoxGeometry(5, 8, 8),
          position: new THREE.Vector3(midW * 0.52, Math.min(roof, b.y0 + b.height * 0.5), z),
        },
      ]
    }
    default:
      return [
        {
          geometry: new THREE.BoxGeometry(8, 8, 8),
          position: new THREE.Vector3(0, 20, 20),
        },
      ]
  }
}

function partWorldBase(part: BuiltPart): THREE.Vector3 {
  part.geometry.computeBoundingBox()
  const bb = part.geometry.boundingBox
  if (!bb) return part.position.clone()
  const c = new THREE.Vector3()
  bb.getCenter(c)
  if (Math.abs(part.position.x) > 1e-3 && Math.abs(part.position.y) < 1e-3) {
    return new THREE.Vector3(part.position.x, c.y, c.z)
  }
  return c.add(part.position)
}

/** Puertos anclados al layout frontal / geometría. */
export function layerPortWorld(
  layer: LayerDef,
  model: DesignModel,
): Record<string, THREE.Vector3> {
  const fl = frontLayoutFromModel(model)
  const fp = model.fireplace
  const fit = model.insertFit
  const map: Record<string, THREE.Vector3> = {}

  switch (layer.id) {
    case 'grilleBottom':
      // Habitación (Z negativo) → boca de rejilla → hacia el ventilador
      map.room = new THREE.Vector3(0, fl.grilleBottom.y - 1, -36)
      map.in = new THREE.Vector3(0, fl.grilleBottom.y, -16)
      map.out = new THREE.Vector3(0, fl.grilleBottom.y, fl.fan.z - fl.fan.depth / 2 - 1)
      return map
    case 'cleanFan':
      map.in = new THREE.Vector3(0, fl.fan.y, fl.fan.z - fl.fan.depth / 2)
      map.out = new THREE.Vector3(0, fl.fan.y + 2, fl.fan.z + fl.fan.depth / 2)
      map.bypass = new THREE.Vector3(0, fl.fan.y + 3, fl.fan.z + 2)
      return map
    case 'outletFront':
      // Desde camisa → rejilla → habitación
      map.in = new THREE.Vector3(0, fl.grilleTop.y, fl.grilleTop.z + 5)
      map.out = new THREE.Vector3(0, fl.grilleTop.y, -10)
      map.room = new THREE.Vector3(0, fl.grilleTop.y + 2, -36)
      return map
    case 'shell': {
      map.air_in_bottom = new THREE.Vector3(0, fl.fan.y + 4, fl.fan.z + fl.fan.depth / 2 + 2)
      map.air_out_front = new THREE.Vector3(0, fl.grilleTop.y - 1, fl.chamberFrontZ + 2)
      map.air_out_side = new THREE.Vector3(fl.chamberW * 0.55, fl.grilleTop.y - 8, fl.chamberFrontZ + 12)
      map.natural_path = new THREE.Vector3(0, fl.fan.y + 6, fl.fan.z + 4)
      return map
    }
    case 'exteriorIntake':
      // Extiende hacia el pasillo (X negativo) antes de entrar al cassette
      map.in = new THREE.Vector3(fl.exteriorIntake.outerX - 16, fl.exteriorIntake.y, fl.exteriorIntake.z)
      map.out = new THREE.Vector3(fl.exteriorIntake.innerX, fl.exteriorIntake.y, fl.exteriorIntake.z)
      return map
    case 'flue': {
      map.in = new THREE.Vector3(0, fl.hoodSeal.y - 8, fl.hoodSeal.z)
      map.out = new THREE.Vector3(0, fl.hoodSeal.y + 36, fl.hoodSeal.z)
      return map
    }
    case 'plenum': {
      const p = fl.plenum
      map.ext_in = new THREE.Vector3(-p.width / 2, p.y, p.z)
      map.primary_out = new THREE.Vector3(0, p.y + p.height / 2, p.z - p.depth / 2 + 2)
      map.secondary_out_left = new THREE.Vector3(-p.width * 0.4, p.y + 2, p.z)
      map.secondary_out_right = new THREE.Vector3(p.width * 0.4, p.y + 2, p.z)
      map.curtain_out = new THREE.Vector3(0, p.y + p.height / 2, p.z - p.depth / 2)
      return map
    }
    case 'primary': {
      const p = fl.plenum
      map.in = new THREE.Vector3(0, p.y + p.height / 2 + 1, p.z - 2)
      map.out = new THREE.Vector3(0, p.y + p.height / 2 + 2, fl.chamberFrontZ + 14)
      return map
    }
    case 'secondary': {
      const layout = secondaryChannelLayout(fp, fit)
      map.in_left = new THREE.Vector3(layout.leftX, layout.yIn, layout.zIn)
      map.in_right = new THREE.Vector3(layout.rightX, layout.yIn, layout.zIn)
      map.out_left = new THREE.Vector3(layout.leftX, layout.yOut, layout.zOut)
      map.out_right = new THREE.Vector3(layout.rightX, layout.yOut, layout.zOut)
      return map
    }
    case 'secDistributor': {
      const d = fl.secondaryDistributor
      map.in_left = new THREE.Vector3(-d.width * 0.35, d.y, d.z)
      map.in_right = new THREE.Vector3(d.width * 0.35, d.y, d.z)
      map.out = new THREE.Vector3(0, d.y + 1, d.z + 2)
      return map
    }
    case 'curtain':
      map.in = new THREE.Vector3(0, fl.door.yTop - 2, fl.door.zLeaf + 4)
      map.out = new THREE.Vector3(0, fl.door.yTop - 2, fl.door.zLeaf + 1.2)
      return map
    case 'door':
      map.curtain_in = new THREE.Vector3(0, fl.door.yTop - 2, fl.door.zLeaf + 0.5)
      return map
    case 'chamber': {
      const layout = secondaryChannelLayout(fp, fit)
      map.gas_out = new THREE.Vector3(0, layout.yOut + 2, layout.zOut)
      map.primary_in = new THREE.Vector3(0, fit.bottomClearance + 14, fl.chamberFrontZ + 14)
      return map
    }
    case 'baffle': {
      const parts = buildLayerPart(layer, model)
      const base = partWorldBase(parts[0]!)
      map.in = base.clone().add(new THREE.Vector3(0, -1, -2))
      map.out = base.clone().add(new THREE.Vector3(0, 1, 4))
      map.sec_air = base.clone().add(new THREE.Vector3(0, 0, -1))
      return map
    }
    case 'outletSide': {
      const parts = buildLayerPart(layer, model)
      const base = partWorldBase(parts[0]!)
      map.in = base.clone().add(new THREE.Vector3(-4, 0, 0))
      map.out = base.clone().add(new THREE.Vector3(22, 0, 0))
      return map
    }
    default: {
      const parts = buildLayerPart(layer, model)
      let base = new THREE.Vector3()
      if (parts[0]) base = partWorldBase(parts[0])
      for (const port of layer.ports ?? []) {
        map[port.id] = base.clone().add(new THREE.Vector3(port.local.x, port.local.y, port.local.z))
      }
      return map
    }
  }
}
