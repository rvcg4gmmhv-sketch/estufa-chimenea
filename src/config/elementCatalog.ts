import type { CatalogType, DesignElement, MaterialKey } from './modelSchema'

export interface CatalogItem {
  type: CatalogType
  name: string
  function: string
  materialKey: MaterialKey
  defaultScale: { x: number; y: number; z: number }
  defaultCircuit: DesignElement['circuit']
}

export const ELEMENT_CATALOG: CatalogItem[] = [
  {
    type: 'fan',
    name: 'Ventilador conceptual',
    function: 'Impulso esquemático de aire (sin caudal ni potencia de fabricación).',
    materialKey: 'steel',
    defaultScale: { x: 8, y: 8, z: 6 },
    defaultCircuit: 'combustion',
  },
  {
    type: 'duct',
    name: 'Conducto recto',
    function: 'Tramo de ducto conceptual para admisión o distribución.',
    materialKey: 'duct',
    defaultScale: { x: 6, y: 6, z: 16 },
    defaultCircuit: 'combustion',
  },
  {
    type: 'elbow',
    name: 'Codo / transición',
    function: 'Cambio de dirección esquemático en un conducto.',
    materialKey: 'duct',
    defaultScale: { x: 8, y: 8, z: 8 },
    defaultCircuit: 'combustion',
  },
  {
    type: 'plenum',
    name: 'Plenum / caja',
    function: 'Volumen de distribución de aire (conceptual).',
    materialKey: 'steel',
    defaultScale: { x: 20, y: 8, z: 12 },
    defaultCircuit: 'combustion',
  },
  {
    type: 'grille',
    name: 'Rejilla / boca',
    function: 'Entrada o salida de aire visible.',
    materialKey: 'steel',
    defaultScale: { x: 16, y: 6, z: 3 },
    defaultCircuit: 'heating',
  },
  {
    type: 'baffle',
    name: 'Deflector genérico',
    function: 'Desvía gases o aire de forma esquemática.',
    materialKey: 'steel',
    defaultScale: { x: 24, y: 2, z: 12 },
    defaultCircuit: 'gases',
  },
  {
    type: 'box',
    name: 'Volumen genérico',
    function: 'Caja esquemática para marcar un componente pendiente de detalle.',
    materialKey: 'steel',
    defaultScale: { x: 12, y: 12, z: 12 },
    defaultCircuit: 'none',
  },
  {
    type: 'sensor',
    name: 'Punto de revisión',
    function: 'Marca un punto de interés para la revisión térmica.',
    materialKey: 'steel',
    defaultScale: { x: 3, y: 3, z: 3 },
    defaultCircuit: 'none',
  },
]

export function createElementFromCatalog(
  type: CatalogType,
  id: string,
  position = { x: 0, y: 10, z: 15 },
): DesignElement {
  const item = ELEMENT_CATALOG.find((c) => c.type === type)!
  return {
    id,
    catalogType: type,
    name: item.name,
    function: item.function,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { ...item.defaultScale },
    circuit: item.defaultCircuit,
    ports: [
      { id: 'in', role: 'in', local: { x: 0, y: 0, z: -item.defaultScale.z / 2 }, label: 'Entrada' },
      { id: 'out', role: 'out', local: { x: 0, y: 0, z: item.defaultScale.z / 2 }, label: 'Salida' },
    ],
    materialKey: item.materialKey,
    visible: true,
    explodeOffset: { x: 0, y: 8, z: 0 },
    conceptual: true,
    optional: true,
  }
}
