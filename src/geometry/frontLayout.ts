import type { DesignModel, FireplaceDimensions, InsertFit } from '../config/modelSchema'
import { CHAMBER_INSET, chamberWidth } from './insertBounds'

/** Layout frontal conceptual (cm): rejilla caliente → puerta → rejilla fría → ventilador bajo cámara. */
export interface FrontLayout {
  chamberW: number
  chamberFrontZ: number
  /** Abertura de puerta sobre la cámara */
  door: {
    width: number
    height: number
    yBottom: number
    yTop: number
    zFrame: number
    zLeaf: number
    hingeX: number
  }
  grilleTop: { width: number; height: number; y: number; z: number }
  grilleBottom: { width: number; height: number; y: number; z: number }
  fan: { width: number; height: number; depth: number; y: number; z: number }
  /** Toma lateral (pasillo) → tramo horizontal → cara del plenum */
  exteriorIntake: {
    y: number
    z: number
    radius: number
    /** Extremo exterior (hacia pasillo) */
    outerX: number
    /** Extremo que llega a la cara del plenum */
    innerX: number
    length: number
  }
  plenum: { width: number; height: number; depth: number; y: number; z: number }
  frameOuter: { width: number; height: number; z: number }
  /** En garganta, coaxial con el ducto — no en fachada */
  hoodSeal: { y: number; z: number; radius: number }
  secondaryDistributor: { y: number; z: number; width: number }
}

export function computeFrontLayout(
  fp: FireplaceDimensions,
  fit: InsertFit,
): FrontLayout {
  const chamberW = chamberWidth(fp, fit)
  const chamberFrontZ = fit.frontSetback + CHAMBER_INSET

  // Bandas frontales dentro de la boca (~55 cm)
  const grilleTopH = 5
  const grilleBottomH = 5.5
  const gap = 1.2
  const doorYBottom = fit.bottomClearance + grilleBottomH + gap + 1.5
  const doorYTop = fp.frontHeight - fit.topClearance - grilleTopH - gap
  const doorH = Math.max(22, doorYTop - doorYBottom)
  const doorW = Math.min(chamberW * 0.88, fp.frontWidth * 0.62)

  const doorZFrame = chamberFrontZ - 0.4
  const doorZLeaf = doorZFrame - 1.8

  return {
    chamberW,
    chamberFrontZ,
    door: {
      width: doorW,
      height: doorH,
      yBottom: doorYBottom,
      yTop: doorYBottom + doorH,
      zFrame: doorZFrame,
      zLeaf: doorZLeaf,
      hingeX: -doorW / 2,
    },
    grilleTop: {
      width: Math.min(fp.frontWidth * 0.7, chamberW + 8),
      height: grilleTopH,
      y: fp.frontHeight - fit.topClearance - grilleTopH / 2 - 0.5,
      z: -1.2,
    },
    grilleBottom: {
      width: Math.min(fp.frontWidth * 0.7, chamberW + 8),
      height: grilleBottomH,
      y: fit.bottomClearance + grilleBottomH / 2 + 0.3,
      z: -1.2,
    },
    fan: {
      width: chamberW * 0.75,
      height: 7,
      depth: 12,
      y: fit.bottomClearance + 4.5,
      z: chamberFrontZ + 8,
    },
    plenum: (() => {
      const width = chamberW * 0.7
      const height = 5
      const depth = 10
      const y = fit.bottomClearance + 9
      // Detrás del ventilador, bajo la cámara
      const z = chamberFrontZ + 18
      return { width, height, depth, y, z }
    })(),
    exteriorIntake: (() => {
      const plenumW = chamberW * 0.7
      const y = fit.bottomClearance + 9
      const z = chamberFrontZ + 18
      const plenumLeft = -plenumW / 2
      const outerX = -(chamberW / 2 + 14)
      const innerX = plenumLeft - 0.5
      return {
        y,
        z,
        radius: 2.2,
        outerX,
        innerX,
        length: Math.abs(innerX - outerX),
      }
    })(),
    frameOuter: {
      width: fp.frontWidth + 8,
      height: fp.frontHeight + 6,
      z: -3.5,
    },
    hoodSeal: {
      // Coaxial con el conducto en la garganta (no con el marco frontal)
      y: fp.throatHeight - 8,
      z: fp.lintelDepth + fp.throatDepth / 2,
      radius: 8,
    },
    secondaryDistributor: {
      y: doorYBottom + doorH * 0.82,
      z: chamberFrontZ + (fp.depth - fit.frontSetback - fit.rearClearance) * 0.55,
      width: chamberW * 0.95,
    },
  }
}

export function frontLayoutFromModel(model: DesignModel): FrontLayout {
  return computeFrontLayout(model.fireplace, model.insertFit)
}
