import type { DesignModel } from '../config/modelSchema'
import { inclineLength } from '../config/validateModel'

export interface CadSpec {
  schemaVersion: number
  exportedAt: string
  unit: 'cm'
  disclaimer: string
  note: string
  fireplace: DesignModel['fireplace']
  derived: {
    inclineLengthCm: number
    inclineHorizontalCm: number
  }
  insertFit: DesignModel['insertFit']
  layers: Array<{
    id: string
    name: string
    function: string
    circuit: string
    optional?: boolean
  }>
  elements: DesignModel['elements']
  flowEdges: DesignModel['flowEdges']
  reviewNotes: string
}

export function buildCadSpec(model: DesignModel): CadSpec {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    unit: 'cm',
    disclaimer: model.disclaimer,
    note: 'Especificación de referencia conceptual. No es un plano de fabricación ni un sólido CAD. Remodelar en CAD con espesores, uniones y validación profesional.',
    fireplace: model.fireplace,
    derived: {
      inclineLengthCm: inclineLength(model.fireplace),
      inclineHorizontalCm: model.fireplace.inclineHorizontal,
    },
    insertFit: model.insertFit,
    layers: model.layers.map((l) => ({
      id: l.id,
      name: l.name,
      function: l.function,
      circuit: l.circuit,
      optional: l.optional,
    })),
    elements: model.elements,
    flowEdges: model.flowEdges,
    reviewNotes: model.reviewNotes,
  }
}

export function buildCadReportMarkdown(spec: CadSpec): string {
  const lines = [
    '# Especificación conceptual para CAD',
    '',
    `Exportado: ${spec.exportedAt}`,
    '',
    `> ${spec.disclaimer}`,
    '',
    spec.note,
    '',
    '## Chimenea existente (cm)',
    '',
    `| Cota | Valor | Origen |`,
    `| --- | --- | --- |`,
    `| Ancho frontal | ${spec.fireplace.frontWidth} | ${spec.fireplace.origins.frontWidth} |`,
    `| Ancho posterior | ${spec.fireplace.backWidth} | ${spec.fireplace.origins.backWidth} |`,
    `| Profundidad | ${spec.fireplace.depth} | ${spec.fireplace.origins.depth} |`,
    `| Altura boca | ${spec.fireplace.frontHeight} | ${spec.fireplace.origins.frontHeight} |`,
    `| Pared posterior | ${spec.fireplace.backWallHeight} | ${spec.fireplace.origins.backWallHeight} |`,
    `| Dintel | ${spec.fireplace.lintelDepth} | ${spec.fireplace.origins.lintelDepth} |`,
    `| Garganta | ${spec.fireplace.throatDepth} | ${spec.fireplace.origins.throatDepth} |`,
    `| Altura garganta | ${spec.fireplace.throatHeight} | ${spec.fireplace.origins.throatHeight} |`,
    `| Proyección inclinada | ${spec.derived.inclineHorizontalCm.toFixed(1)} | derived |`,
    `| Longitud inclinada | ${spec.derived.inclineLengthCm.toFixed(1)} | derived |`,
    '',
    '## Capas',
    '',
    ...spec.layers.map(
      (l) => `- **${l.name}** (\`${l.id}\`): ${l.function} · circuito: ${l.circuit}`,
    ),
    '',
    '## Elementos añadidos',
    '',
    spec.elements.length
      ? spec.elements
          .map(
            (e) =>
              `- **${e.name}** (\`${e.id}\`, ${e.catalogType}): pos (${e.position.x}, ${e.position.y}, ${e.position.z}) · circuito ${e.circuit}`,
          )
          .join('\n')
      : '_Ninguno_',
    '',
    '## Circuitos (conexiones)',
    '',
    ...spec.flowEdges.map(
      (e) =>
        `- [${e.circuit}] ${e.from.ownerId}.${e.from.portId} → ${e.to.ownerId}.${e.to.portId}${e.label ? ` (${e.label})` : ''}`,
    ),
    '',
    '## Notas de revisión',
    '',
    spec.reviewNotes || '_Sin notas_',
    '',
  ]
  return lines.join('\n')
}
