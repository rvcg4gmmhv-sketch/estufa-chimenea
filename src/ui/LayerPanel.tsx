import { useViewerStore } from '../state/useViewerStore'

export function LayerPanel() {
  const layers = useViewerStore((s) => s.model.layers)
  const elements = useViewerStore((s) => s.model.elements)
  const selectedId = useViewerStore((s) => s.selectedId)
  const setLayerVisible = useViewerStore((s) => s.setLayerVisible)
  const setElementVisible = useViewerStore((s) => s.setElementVisible)
  const select = useViewerStore((s) => s.select)

  return (
    <section className="panel">
      <h2>Capas</h2>
      <ul className="layer-list">
        {layers.map((l) => (
          <li key={l.id} className={selectedId === l.id ? 'selected' : ''}>
            <label className="check">
              <input
                type="checkbox"
                checked={l.visible}
                onChange={(e) => setLayerVisible(l.id, e.target.checked)}
              />
              <button type="button" className="linkish" onClick={() => select(l.id)}>
                {l.name}
                {l.optional ? ' (opc.)' : ''}
              </button>
            </label>
          </li>
        ))}
      </ul>
      {elements.length > 0 && (
        <>
          <h3>Elementos añadidos</h3>
          <ul className="layer-list">
            {elements.map((el) => (
              <li key={el.id} className={selectedId === el.id ? 'selected' : ''}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={el.visible}
                    onChange={(e) => setElementVisible(el.id, e.target.checked)}
                  />
                  <button type="button" className="linkish" onClick={() => select(el.id)}>
                    {el.name}
                  </button>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
