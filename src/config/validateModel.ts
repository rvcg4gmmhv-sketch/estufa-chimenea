import type { DesignModel, FlowEdge } from './modelSchema'

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
}

export function derivedInclineHorizontal(fp: DesignModel['fireplace']): number {
  return fp.depth - fp.lintelDepth - fp.throatDepth
}

export function inclineLength(fp: DesignModel['fireplace']): number {
  const h = derivedInclineHorizontal(fp)
  const rise = fp.throatHeight - fp.backWallHeight
  return Math.sqrt(h * h + rise * rise)
}

export function validateModel(model: DesignModel): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fp = model.fireplace

  const sum = fp.lintelDepth + fp.throatDepth + fp.inclineHorizontal
  if (Math.abs(sum - fp.depth) > 0.05) {
    issues.push({
      level: 'warning',
      message: `Perfil incoherente: dintel (${fp.lintelDepth}) + garganta (${fp.throatDepth}) + proyección inclinada (${fp.inclineHorizontal}) = ${sum.toFixed(1)} ≠ profundidad ${fp.depth}.`,
    })
  }

  if (fp.throatHeight <= fp.frontHeight) {
    issues.push({
      level: 'warning',
      message: 'La altura de garganta debería superar la boca frontal (croquis ≈ 64 cm > 55 cm).',
    })
  }

  if (fp.frontWidth <= fp.backWidth) {
    issues.push({
      level: 'warning',
      message: 'El ancho frontal debería ser mayor que el posterior (planta trapezoidal).',
    })
  }

  for (const key of ['frontWidth', 'backWidth', 'depth', 'frontHeight'] as const) {
    if (fp[key] <= 0) {
      issues.push({ level: 'error', message: `La cota ${key} debe ser positiva.` })
    }
  }

  const owners = new Set([
    ...model.layers.map((l) => l.id),
    ...model.elements.map((e) => e.id),
  ])

  for (const edge of model.flowEdges) {
    if (!owners.has(edge.from.ownerId) || !owners.has(edge.to.ownerId)) {
      issues.push({
        level: 'warning',
        message: `Conexión de flujo «${edge.id}» apunta a una pieza inexistente.`,
      })
    }
  }

  // Mezcla indebida: calefacción ↔ combustión/gases (salvo empalmes térmicos explícitos)
  const mixed = model.flowEdges.filter((e) => forbiddenMix(model, e))
  if (mixed.length) {
    issues.push({
      level: 'warning',
      message: `${mixed.length} conexión(es) comunicarían circuitos que deben permanecer separados (humo/combustión vs aire limpio). El contacto térmico por pared es válido; la mezcla de volúmenes no.`,
    })
  }

  const cross = model.flowEdges.filter((e) => circuitMismatch(model, e))
  if (cross.length) {
    issues.push({
      level: 'warning',
      message: `${cross.length} conexión(es) unen piezas de circuitos distintos sin marca de empalme permitido.`,
    })
  }

  // Ventilador no debe conectar al plenum de combustión
  for (const e of model.flowEdges) {
    const ids = [e.from.ownerId, e.to.ownerId]
    if (ids.includes('cleanFan') && (ids.includes('plenum') || ids.includes('exteriorIntake'))) {
      issues.push({
        level: 'error',
        message:
          'El ventilador de aire limpio no debe comunicarse con el plenum ni la toma de combustión.',
      })
    }
  }

  return issues
}

function forbiddenMix(model: DesignModel, edge: FlowEdge): boolean {
  if (edge.allowCrossCircuit) return false
  const from = findOwnerCircuit(model, edge.from.ownerId)
  const to = findOwnerCircuit(model, edge.to.ownerId)
  if (!from || !to) return false
  const pair = new Set([from, to])
  return (
    pair.has('heating') && (pair.has('combustion') || pair.has('gases'))
  )
}

function circuitMismatch(model: DesignModel, edge: FlowEdge): boolean {
  if (edge.allowCrossCircuit) return false
  const from = findOwnerCircuit(model, edge.from.ownerId)
  const to = findOwnerCircuit(model, edge.to.ownerId)
  if (!from || !to || from === 'none' || to === 'none') return false
  if (
    (from === 'combustion' && to === 'gases') ||
    (from === 'gases' && to === 'combustion')
  ) {
    return false
  }
  return from !== to || from !== edge.circuit || to !== edge.circuit
}

function findOwnerCircuit(model: DesignModel, id: string) {
  return (
    model.layers.find((l) => l.id === id)?.circuit ??
    model.elements.find((e) => e.id === id)?.circuit
  )
}
