import { ELEMENT_CATALOG } from '../config/elementCatalog'
import type { CatalogType } from '../config/modelSchema'
import { useViewerStore } from '../state/useViewerStore'

export function ElementEditor() {
  const selectedId = useViewerStore((s) => s.selectedId)
  const elements = useViewerStore((s) => s.model.elements)
  const addElement = useViewerStore((s) => s.addElement)
  const duplicateElement = useViewerStore((s) => s.duplicateElement)
  const removeElement = useViewerStore((s) => s.removeElement)
  const updateElement = useViewerStore((s) => s.updateElement)
  const addFlowEdge = useViewerStore((s) => s.addFlowEdge)

  const selected = elements.find((e) => e.id === selectedId)

  return (
    <section className="panel">
      <h2>Elementos</h2>
      <p className="muted">
        Agrega piezas conceptuales (p. ej. ventiladores en tubos de admisión). No son datos de
        fabricación.
      </p>
      <label className="field">
        Agregar desde catálogo
        <select
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value as CatalogType
            if (v) {
              addElement(v)
              e.target.value = ''
            }
          }}
        >
          <option value="" disabled>
            Elegir tipo…
          </option>
          {ELEMENT_CATALOG.map((c) => (
            <option key={c.type} value={c.type}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <div className="element-edit">
          <p className="part-name">{selected.name}</p>
          <label className="field">
            Nombre
            <input
              value={selected.name}
              onChange={(e) => updateElement(selected.id, { name: e.target.value })}
            />
          </label>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <label key={axis} className="field">
              Posición {axis.toUpperCase()} (cm)
              <input
                type="number"
                step={0.5}
                value={selected.position[axis]}
                onChange={(e) =>
                  updateElement(selected.id, {
                    position: {
                      ...selected.position,
                      [axis]: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
          {(['x', 'y', 'z'] as const).map((axis) => (
            <label key={`r${axis}`} className="field">
              Rotación {axis.toUpperCase()} (°)
              <input
                type="number"
                step={5}
                value={selected.rotation[axis]}
                onChange={(e) =>
                  updateElement(selected.id, {
                    rotation: {
                      ...selected.rotation,
                      [axis]: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
          <label className="field">
            Circuito
            <select
              value={selected.circuit}
              onChange={(e) =>
                updateElement(selected.id, {
                  circuit: e.target.value as typeof selected.circuit,
                })
              }
            >
              <option value="combustion">Combustión</option>
              <option value="gases">Gases</option>
              <option value="heating">Calefacción</option>
              <option value="none">Ninguno</option>
            </select>
          </label>
          {selected.circuit !== 'none' && (
            <button
              type="button"
              onClick={() => {
                const circuit = selected.circuit
                if (circuit === 'none') return
                const target =
                  circuit === 'heating'
                    ? { ownerId: 'shell', portId: 'air_in' }
                    : circuit === 'combustion'
                      ? { ownerId: 'plenum', portId: 'ext_in' }
                      : { ownerId: 'flue', portId: 'in' }
                addFlowEdge(
                  circuit,
                  { ownerId: selected.id, portId: 'out' },
                  target,
                  `${selected.name} → sistema`,
                )
              }}
            >
              Conectar salida al circuito
            </button>
          )}
          <div className="btn-group">
            <button type="button" onClick={() => duplicateElement(selected.id)}>
              Duplicar
            </button>
            <button type="button" className="danger" onClick={() => removeElement(selected.id)}>
              Eliminar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
