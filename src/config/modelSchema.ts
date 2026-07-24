export type CircuitId = 'combustion' | 'gases' | 'heating' | 'none'

export type DimensionOrigin = 'measured' | 'approximate' | 'derived' | 'schematic'

export type FireplaceVisibility = 'solid' | 'ghost' | 'hidden'

export type ClipAxis = 'x' | 'y' | 'z'

export type CatalogType =
  | 'fan'
  | 'duct'
  | 'elbow'
  | 'plenum'
  | 'grille'
  | 'baffle'
  | 'box'
  | 'sensor'

export type MaterialKey =
  | 'masonry'
  | 'refractory'
  | 'steel'
  | 'glass'
  | 'duct'
  | 'insulation'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface FlowPort {
  id: string
  role: 'in' | 'out'
  /** Offset local respecto al origen de la pieza */
  local: Vec3
  label?: string
}

export interface FlowEdge {
  id: string
  circuit: Exclude<CircuitId, 'none'>
  from: { ownerId: string; portId: string }
  to: { ownerId: string; portId: string }
  label?: string
  /** Aire secundario → postcombustión u otros empalmes térmicos intencionales */
  allowCrossCircuit?: boolean
}

export interface LayerDef {
  id: string
  name: string
  function: string
  circuit: CircuitId
  materialKey: MaterialKey
  visible: boolean
  optional?: boolean
  explodeOffset: Vec3
  ports?: FlowPort[]
}

export interface DesignElement {
  id: string
  catalogType: CatalogType
  name: string
  function: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  parentId?: string
  circuit: CircuitId
  ports: FlowPort[]
  materialKey: MaterialKey
  visible: boolean
  explodeOffset: Vec3
  optional?: boolean
  conceptual: boolean
}

export interface FireplaceDimensions {
  frontWidth: number
  backWidth: number
  depth: number
  frontHeight: number
  backWallHeight: number
  lintelDepth: number
  throatDepth: number
  throatHeight: number
  chimneyHeight: number
  /** Proyección horizontal del plano inclinado (derivada si coherente) */
  inclineHorizontal: number
  origins: Partial<Record<keyof Omit<FireplaceDimensions, 'origins'>, DimensionOrigin>>
}

export interface InsertFit {
  /** Holgura lateral aproximada respecto a la cavidad (cm) */
  sideClearance: number
  bottomClearance: number
  topClearance: number
  /** Holgura bajo el plano inclinado / cielo posterior */
  roofClearance: number
  frontSetback: number
  rearClearance: number
}

export type ReviewPresetId =
  | 'fit'
  | 'layersDidactic'
  | 'masonryAsShell'
  | 'frontClean'
  | 'frontCut'
  | 'sideCut'
  | 'facadeOnly'
  | 'cleanAirOnly'
  | 'combustionOnly'
  | 'separationCheck'
  | 'combustion'
  | 'exchange'
  | 'convection'
  | 'exploded'

export interface ModelSnapshot {
  id: string
  name: string
  createdAt: string
  model: DesignModel
}

export interface DesignModel {
  version: number
  unit: 'cm'
  disclaimer: string
  fireplace: FireplaceDimensions
  insertFit: InsertFit
  layers: LayerDef[]
  elements: DesignElement[]
  flowEdges: FlowEdge[]
  reviewNotes: string
}

export interface ViewerUiState {
  fireplaceVisibility: FireplaceVisibility
  showDimensions: boolean
  showLabels: boolean
  showFlows: boolean
  flowAnimation: boolean
  activeCircuits: Array<Exclude<CircuitId, 'none'>> | 'all'
  shellOpacity: number
  masonryOpacity: number
  chamberOpacity: number
  /** Separación suave solo de envolventes (chimenea / carcasa / cámara) */
  envelopeSeparate: number
  showEnvelopeEdges: boolean
  showEnvelopeLabels: boolean
  explode: number
  clipEnabled: boolean
  clipAxis: ClipAxis
  clipPosition: number
  selectedId: string | null
  reviewMode: ReviewPresetId | null
  guidedTourStep: number | null
  theme: 'light' | 'dark'
  doorOpen: boolean
}
