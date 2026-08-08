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
  /**
   * Placa frontal metálica: cierra la boca de la chimenea, enmarca la puerta
   * de cámara y las rejillas; adosada al plano Z=0 de la obra.
   */
  facadePlate: {
    /** Ancho total (boca + labio sobre albañilería) */
    width: number
    /** Alto total */
    height: number
    /** Centro Y de la placa */
    cy: number
    /** Cara habitación (Z negativo) */
    zFace: number
    /** Espesor de la placa */
    thickness: number
    /** Abertura de puerta (hueco en placa) */
    doorCut: { width: number; height: number; cy: number }
    /** Abertura rejilla superior */
    grilleTopCut: { width: number; height: number; cy: number }
    /** Abertura rejilla inferior */
    grilleBottomCut: { width: number; height: number; cy: number }
  }
  /** @deprecated usar facadePlate */
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

  // Bandas frontales dentro de la boca (~55 cm), alineadas a la placa
  const lip = 3.5 // solapa sobre el frente de obra
  const plateW = fp.frontWidth + lip * 2
  const plateH = fp.frontHeight + lip * 2
  const plateCy = fp.frontHeight / 2
  const plateThickness = 2.2
  const zFace = -1.8 // cara habitación, adosada a Z=0

  const grilleTopH = 5
  const grilleBottomH = 5.5
  const band = 2.4 // montante entre aberturas
  const sideRail = 5.5

  const grilleTopY = fp.frontHeight - fit.topClearance - grilleTopH / 2 - 0.4
  const grilleBottomY = fit.bottomClearance + grilleBottomH / 2 + 0.4
  const doorYBottom = grilleBottomY + grilleBottomH / 2 + band
  const doorYTop = grilleTopY - grilleTopH / 2 - band
  const doorH = Math.max(22, doorYTop - doorYBottom)
  const doorW = Math.min(chamberW * 0.9, fp.frontWidth - sideRail * 2)
  const grilleW = Math.min(doorW + 4, fp.frontWidth - sideRail * 2)

  // Puerta enmarcada en la placa (casi coplanar con la fachada)
  const doorZFrame = zFace + plateThickness * 0.35
  const doorZLeaf = doorZFrame - 1.6

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
      width: grilleW,
      height: grilleTopH,
      y: grilleTopY,
      z: zFace + 0.3,
    },
    grilleBottom: {
      width: grilleW,
      height: grilleBottomH,
      y: grilleBottomY,
      z: zFace + 0.3,
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
    facadePlate: {
      width: plateW,
      height: plateH,
      cy: plateCy,
      zFace,
      thickness: plateThickness,
      doorCut: {
        width: doorW + 0.6,
        height: doorH + 0.6,
        cy: doorYBottom + doorH / 2,
      },
      grilleTopCut: {
        width: grilleW + 0.4,
        height: grilleTopH + 0.3,
        cy: grilleTopY,
      },
      grilleBottomCut: {
        width: grilleW + 0.4,
        height: grilleBottomH + 0.3,
        cy: grilleBottomY,
      },
    },
    frameOuter: {
      width: plateW,
      height: plateH,
      z: zFace,
    },
    hoodSeal: {
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
