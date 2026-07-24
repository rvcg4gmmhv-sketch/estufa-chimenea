import type { DesignModel, LayerDef } from './modelSchema'

export const DISCLAIMER =
  'Modelo conceptual. Las dimensiones de fabricación, sellos, materiales, caudales y temperaturas deben ser calculados, ensayados y validados por profesionales competentes antes de cualquier prototipo físico'

/** Perfil reconciliado: 10 + 13 + 26 = 49; inclinada √(26²+41²)≈48,5; garganta Y=64 */
export function createDefaultFireplace() {
  return {
    frontWidth: 72,
    backWidth: 50,
    depth: 49,
    frontHeight: 55,
    backWallHeight: 23,
    lintelDepth: 10,
    throatDepth: 13,
    throatHeight: 64,
    chimneyHeight: 600,
    inclineHorizontal: 26,
    origins: {
      frontWidth: 'measured' as const,
      backWidth: 'measured' as const,
      depth: 'measured' as const,
      frontHeight: 'measured' as const,
      backWallHeight: 'measured' as const,
      lintelDepth: 'measured' as const,
      throatDepth: 'measured' as const,
      throatHeight: 'measured' as const,
      chimneyHeight: 'schematic' as const,
      inclineHorizontal: 'derived' as const,
    },
  }
}

function layer(
  partial: Omit<LayerDef, 'visible'> & { visible?: boolean },
): LayerDef {
  return { visible: true, ...partial }
}

export function createDefaultLayers(): LayerDef[] {
  return [
    layer({
      id: 'masonry',
      name: 'Albañilería y refractarios existentes',
      function: 'Cavidad de la chimenea antigua que aloja el inserto.',
      circuit: 'none',
      materialKey: 'masonry',
      explodeOffset: { x: 0, y: 0, z: 10 },
    }),
    layer({
      id: 'frame',
      name: 'Marco frontal exterior',
      function:
        'Remate visual entre cassette y chimenea. No cierra la cámara; integra rejillas y cierre superior del aire limpio.',
      circuit: 'none',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 0, z: -22 },
    }),
    layer({
      id: 'hoodSeal',
      name: 'Cierre superior conceptual (campana)',
      function:
        'Sello esquemático en la garganta: el aire limpio no escapa por la antigua campana; rodea el ducto de humo (no es remate de fachada).',
      circuit: 'heating',
      materialKey: 'insulation',
      explodeOffset: { x: 0, y: 8, z: 6 },
    }),
    layer({
      id: 'shell',
      name: 'Carcasa / camisa convectiva',
      function:
        'Canaliza aire limpio alrededor de la cámara. Rebaje diagonal bajo el cielo inclinado (sin excavación).',
      circuit: 'heating',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 0, z: 0 },
      ports: [
        { id: 'air_in_bottom', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde ventilador' },
        { id: 'air_out_front', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A rejilla superior' },
        { id: 'air_out_side', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A pasillo' },
        { id: 'natural_path', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Convección natural' },
      ],
    }),
    layer({
      id: 'chamber',
      name: 'Cámara de combustión',
      function: 'Volumen primario de combustión; la puerta cierra solo esta abertura.',
      circuit: 'gases',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 2, z: 2 },
      ports: [
        { id: 'gas_out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Hacia postcombustión' },
        { id: 'primary_in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Aire primario' },
      ],
    }),
    layer({
      id: 'lining',
      name: 'Revestimiento refractario interior',
      function: 'Protege térmicamente la cámara (esquemático).',
      circuit: 'gases',
      materialKey: 'refractory',
      explodeOffset: { x: 0, y: 0, z: 3 },
    }),
    layer({
      id: 'doorFrame',
      name: 'Marco de puerta (cámara)',
      function: 'Marco propio unido a la cámara; junta hermética conceptual. No cierra contra la albañilería.',
      circuit: 'combustion',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 0, z: -8 },
    }),
    layer({
      id: 'door',
      name: 'Puerta hermética y vidrio cerámico',
      function:
        'Hoja con vidrio, bisagras y cierre conceptual. Cierra solo la cámara; puede abrirse para revisar interferencias.',
      circuit: 'combustion',
      materialKey: 'glass',
      explodeOffset: { x: 0, y: 0, z: -26 },
      ports: [
        { id: 'curtain_in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Cortina sobre vidrio' },
      ],
    }),
    layer({
      id: 'outletFront',
      name: 'Rejilla superior — aire caliente',
      function: 'Salida frontal de aire limpio caliente hacia la habitación (sobre la puerta).',
      circuit: 'heating',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 14, z: -12 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde camisa' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A la habitación' },
      ],
    }),
    layer({
      id: 'grilleBottom',
      name: 'Rejilla inferior — aire frío',
      function: 'Entrada frontal de aire de la habitación al circuito de convección (bajo la puerta).',
      circuit: 'heating',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: -12, z: -12 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde habitación' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Al ventilador' },
      ],
    }),
    layer({
      id: 'cleanFan',
      name: 'Ventilador de aire limpio',
      function:
        'Bajo la cámara, detrás de la rejilla inferior. Solo aire de habitación; separado de la combustión. Si se detiene, permanece recorrido de convección natural.',
      circuit: 'heating',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: -16, z: -6 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde rejilla inferior' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A camisa' },
        { id: 'bypass', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Convección natural' },
      ],
    }),
    layer({
      id: 'exteriorIntake',
      name: 'Toma exterior de aire de combustión',
      function:
        'Entrada lateral (lado pasillo) estanca hasta el plenum; no pasa por el ventilador de calefacción.',
      circuit: 'combustion',
      materialKey: 'duct',
      explodeOffset: { x: -12, y: -4, z: 0 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Exterior / pasillo' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Al plenum' },
      ],
    }),
    layer({
      id: 'plenum',
      name: 'Plenum inferior de combustión',
      function: 'Recibe solo aire de combustión exterior; reparte a primario, secundario y cortina.',
      circuit: 'combustion',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: -10, z: 4 },
      ports: [
        { id: 'ext_in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde toma exterior' },
        { id: 'primary_out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Primario' },
        { id: 'secondary_out_left', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Sec. izq.' },
        { id: 'secondary_out_right', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Sec. der.' },
        { id: 'curtain_out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A cortina' },
      ],
    }),
    layer({
      id: 'primary',
      name: 'Canal de aire primario',
      function: 'Lleva aire de combustión a la base de la cámara.',
      circuit: 'combustion',
      materialKey: 'duct',
      explodeOffset: { x: 0, y: -6, z: 6 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde plenum' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A cámara' },
      ],
    }),
    layer({
      id: 'secondary',
      name: 'Canales laterales de aire secundario',
      function:
        'Adosados a ambos costados de la cámara; suben desde el plenum hasta el distribuidor bajo el deflector.',
      circuit: 'combustion',
      materialKey: 'duct',
      explodeOffset: { x: 0, y: 4, z: 2 },
      ports: [
        { id: 'in_left', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Entrada izq.' },
        { id: 'in_right', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Entrada der.' },
        { id: 'out_left', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A distribuidor izq.' },
        { id: 'out_right', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A distribuidor der.' },
      ],
    }),
    layer({
      id: 'secDistributor',
      name: 'Distribuidor superior de aire secundario',
      function: 'Recoge los canales laterales bajo el deflector y alimenta la postcombustión.',
      circuit: 'combustion',
      materialKey: 'duct',
      explodeOffset: { x: 0, y: 10, z: 6 },
      ports: [
        { id: 'in_left', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde canal izq.' },
        { id: 'in_right', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde canal der.' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A postcombustión' },
      ],
    }),
    layer({
      id: 'curtain',
      name: 'Cortina de aire sobre el vidrio',
      function: 'Desciende por la cara interior del vidrio desde el borde superior de la puerta.',
      circuit: 'combustion',
      materialKey: 'duct',
      explodeOffset: { x: 0, y: 8, z: -14 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde plenum' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Sobre vidrio' },
      ],
    }),
    layer({
      id: 'baffle',
      name: 'Deflector y postcombustión',
      function: 'Retiene gases y favorece la combustión secundaria.',
      circuit: 'gases',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 12, z: 8 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde cámara' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A intercambiador' },
        { id: 'sec_air', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Aire secundario' },
      ],
    }),
    layer({
      id: 'exchanger',
      name: 'Intercambiador en cuña posterior',
      function: 'Transfiere calor de los gases al aire limpio (contacto térmico, sin mezcla).',
      circuit: 'gases',
      materialKey: 'steel',
      explodeOffset: { x: 0, y: 4, z: 16 },
      ports: [
        { id: 'gas_in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Gases in' },
        { id: 'gas_out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A ducto' },
      ],
    }),
    layer({
      id: 'flue',
      name: 'Conducto estanco de evacuación',
      function: 'Evacua gases hacia la chimenea de forma estanca (esquemático).',
      circuit: 'gases',
      materialKey: 'duct',
      explodeOffset: { x: 0, y: 20, z: 6 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde intercambiador' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'A chimenea' },
      ],
    }),
    layer({
      id: 'outletSide',
      name: 'Salida lateral hacia el pasillo',
      function: 'Derivación opcional de aire limpio caliente hacia el pasillo.',
      circuit: 'heating',
      materialKey: 'steel',
      optional: true,
      visible: false,
      explodeOffset: { x: 22, y: 6, z: 4 },
      ports: [
        { id: 'in', role: 'in', local: { x: 0, y: 0, z: 0 }, label: 'Desde camisa' },
        { id: 'out', role: 'out', local: { x: 0, y: 0, z: 0 }, label: 'Al pasillo' },
      ],
    }),
  ]
}

export function createDefaultFlowEdges(): DesignModel['flowEdges'] {
  return [
    // Combustión
    {
      id: 'c0',
      circuit: 'combustion',
      from: { ownerId: 'exteriorIntake', portId: 'out' },
      to: { ownerId: 'plenum', portId: 'ext_in' },
      label: 'Toma exterior → plenum',
    },
    {
      id: 'c1',
      circuit: 'combustion',
      from: { ownerId: 'plenum', portId: 'primary_out' },
      to: { ownerId: 'primary', portId: 'in' },
      label: 'Primario',
    },
    {
      id: 'c1b',
      circuit: 'combustion',
      from: { ownerId: 'primary', portId: 'out' },
      to: { ownerId: 'chamber', portId: 'primary_in' },
      label: 'Primario → cámara',
      allowCrossCircuit: true,
    },
    {
      id: 'c2a',
      circuit: 'combustion',
      from: { ownerId: 'plenum', portId: 'secondary_out_left' },
      to: { ownerId: 'secondary', portId: 'in_left' },
      label: 'Sec. izq.',
    },
    {
      id: 'c2b',
      circuit: 'combustion',
      from: { ownerId: 'plenum', portId: 'secondary_out_right' },
      to: { ownerId: 'secondary', portId: 'in_right' },
      label: 'Sec. der.',
    },
    {
      id: 'c2c',
      circuit: 'combustion',
      from: { ownerId: 'secondary', portId: 'out_left' },
      to: { ownerId: 'secDistributor', portId: 'in_left' },
      label: 'Canal → distribuidor izq.',
    },
    {
      id: 'c2d',
      circuit: 'combustion',
      from: { ownerId: 'secondary', portId: 'out_right' },
      to: { ownerId: 'secDistributor', portId: 'in_right' },
      label: 'Canal → distribuidor der.',
    },
    {
      id: 'c3',
      circuit: 'combustion',
      from: { ownerId: 'secDistributor', portId: 'out' },
      to: { ownerId: 'baffle', portId: 'sec_air' },
      label: 'Sec. → postcombustión',
      allowCrossCircuit: true,
    },
    {
      id: 'c4a',
      circuit: 'combustion',
      from: { ownerId: 'plenum', portId: 'curtain_out' },
      to: { ownerId: 'curtain', portId: 'in' },
      label: 'A cortina',
    },
    {
      id: 'c4b',
      circuit: 'combustion',
      from: { ownerId: 'curtain', portId: 'out' },
      to: { ownerId: 'door', portId: 'curtain_in' },
      label: 'Cortina sobre vidrio',
    },
    // Gases
    {
      id: 'g1',
      circuit: 'gases',
      from: { ownerId: 'chamber', portId: 'gas_out' },
      to: { ownerId: 'baffle', portId: 'in' },
      label: 'Gases',
    },
    {
      id: 'g2',
      circuit: 'gases',
      from: { ownerId: 'baffle', portId: 'out' },
      to: { ownerId: 'exchanger', portId: 'gas_in' },
      label: 'A intercambiador',
    },
    {
      id: 'g3',
      circuit: 'gases',
      from: { ownerId: 'exchanger', portId: 'gas_out' },
      to: { ownerId: 'flue', portId: 'in' },
      label: 'Evacuación',
    },
    // Calefacción
    {
      id: 'h0',
      circuit: 'heating',
      from: { ownerId: 'grilleBottom', portId: 'out' },
      to: { ownerId: 'cleanFan', portId: 'in' },
      label: 'Aire frío → ventilador',
    },
    {
      id: 'h1',
      circuit: 'heating',
      from: { ownerId: 'cleanFan', portId: 'out' },
      to: { ownerId: 'shell', portId: 'air_in_bottom' },
      label: 'Ventilador → camisa',
    },
    {
      id: 'h1n',
      circuit: 'heating',
      from: { ownerId: 'cleanFan', portId: 'bypass' },
      to: { ownerId: 'shell', portId: 'natural_path' },
      label: 'Convección natural',
    },
    {
      id: 'h2',
      circuit: 'heating',
      from: { ownerId: 'shell', portId: 'air_out_front' },
      to: { ownerId: 'outletFront', portId: 'in' },
      label: 'Camisa → rejilla superior',
    },
    {
      id: 'h3',
      circuit: 'heating',
      from: { ownerId: 'shell', portId: 'air_out_side' },
      to: { ownerId: 'outletSide', portId: 'in' },
      label: 'Salida pasillo',
    },
  ]
}

export function createDefaultModel(): DesignModel {
  return {
    version: 2,
    unit: 'cm',
    disclaimer: DISCLAIMER,
    fireplace: createDefaultFireplace(),
    insertFit: {
      sideClearance: 2,
      bottomClearance: 1,
      topClearance: 2,
      roofClearance: 2.5,
      frontSetback: 1,
      rearClearance: 3,
    },
    layers: createDefaultLayers(),
    elements: [],
    flowEdges: createDefaultFlowEdges(),
    reviewNotes: '',
  }
}

export const DEFAULT_MODEL = createDefaultModel()
