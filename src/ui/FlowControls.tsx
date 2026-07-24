import type { CircuitId } from '../config/modelSchema'
import { useViewerStore } from '../state/useViewerStore'
import { CIRCUIT_COLORS } from '../materials/materials'

export function FlowControls() {
  const activeCircuits = useViewerStore((s) => s.activeCircuits)
  const setActiveCircuits = useViewerStore((s) => s.setActiveCircuits)

  const mode =
    activeCircuits === 'all'
      ? 'all'
      : activeCircuits.length === 1
        ? activeCircuits[0]
        : 'custom'

  return (
    <section className="panel">
      <h2>Flujos</h2>
      <div className="radio-col">
        <label className="check">
          <input
            type="radio"
            name="flow"
            checked={mode === 'all'}
            onChange={() => setActiveCircuits('all')}
          />
          Todos los circuitos
        </label>
        {(
          [
            ['combustion', 'Combustión (azul)', CIRCUIT_COLORS.combustion],
            ['gases', 'Gases (naranja)', CIRCUIT_COLORS.gases],
            ['heating', 'Calefacción', CIRCUIT_COLORS.heatingHot],
          ] as const
        ).map(([id, label, color]) => (
          <label key={id} className="check">
            <input
              type="radio"
              name="flow"
              checked={mode === id}
              onChange={() => setActiveCircuits([id as Exclude<CircuitId, 'none'>])}
            />
            <span className="swatch" style={{ background: color }} />
            {label}
          </label>
        ))}
      </div>
    </section>
  )
}

export function Legend() {
  return (
    <section className="panel legend">
      <h2>Leyenda</h2>
      <p className="muted" style={{ marginBottom: '0.35rem' }}>
        Envolventes
      </p>
      <ul>
        <li>
          <span className="swatch" style={{ background: '#a67c52' }} />
          1 · Cavidad chimenea (obra existente)
        </li>
        <li>
          <span className="swatch" style={{ background: '#3d7a8c' }} />
          2 · Carcasa / camisa (aire limpio)
        </li>
        <li>
          <span className="swatch" style={{ background: '#2a2e33' }} />
          3 · Cámara de combustión
        </li>
      </ul>
      <p className="muted" style={{ margin: '0.55rem 0 0.35rem' }}>
        Circuitos de aire
      </p>
      <ul>
        <li>
          <span className="swatch" style={{ background: CIRCUIT_COLORS.combustion }} />
          A: Combustión — toma exterior → plenum → primario/secundario/cortina
        </li>
        <li>
          <span className="swatch" style={{ background: CIRCUIT_COLORS.gases }} />
          C: Gases — cámara → postcombustión → intercambiador → ducto
        </li>
        <li>
          <span className="swatch" style={{ background: CIRCUIT_COLORS.heatingCold }} />
          B: Aire limpio frío — habitación → rejilla inferior → ventilador
        </li>
        <li>
          <span className="swatch" style={{ background: CIRCUIT_COLORS.heatingHot }} />
          B: Aire limpio caliente — camisa → rejilla superior / pasillo
        </li>
      </ul>
      <p className="muted strong">
        Los tres circuitos nunca se mezclan. El contacto térmico por pared es válido; la
        intersección de volúmenes no.
      </p>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Modelo conceptual. Las dimensiones de fabricación, sellos, materiales, caudales y
        temperaturas deben ser calculados, ensayados y validados por profesionales competentes
        antes de cualquier prototipo físico.
      </p>
    </section>
  )
}
