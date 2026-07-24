import { useViewerStore } from '../state/useViewerStore'
import { CIRCUIT_COLORS } from '../materials/materials'

export function PartInfoCard() {
  const selectedId = useViewerStore((s) => s.selectedId)
  const model = useViewerStore((s) => s.model)

  if (!selectedId) {
    return (
      <section className="panel">
        <h2>Pieza</h2>
        <p className="muted">Selecciona una pieza en la escena o en la lista.</p>
      </section>
    )
  }

  const layer = model.layers.find((l) => l.id === selectedId)
  const element = model.elements.find((e) => e.id === selectedId)
  const item = layer ?? element
  if (!item) return null

  const circuit = item.circuit
  const color =
    circuit === 'combustion'
      ? CIRCUIT_COLORS.combustion
      : circuit === 'gases'
        ? CIRCUIT_COLORS.gases
        : circuit === 'heating'
          ? CIRCUIT_COLORS.heatingHot
          : '#888'

  return (
    <section className="panel">
      <h2>Pieza</h2>
      <p className="part-name">{item.name}</p>
      <p>{item.function}</p>
      <p>
        Circuito:{' '}
        <span className="circuit-pill" style={{ background: color }}>
          {circuit === 'none' ? 'ninguno' : circuit}
        </span>
      </p>
      {'optional' in item && item.optional ? <p className="muted">Opcional</p> : null}
      {'conceptual' in item && item.conceptual ? (
        <p className="muted">Elemento conceptual añadido</p>
      ) : null}
    </section>
  )
}
