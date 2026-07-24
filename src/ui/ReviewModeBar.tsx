import { REVIEW_PRESETS } from '../config/reviewPresets'
import { useViewerStore } from '../state/useViewerStore'

const ENVELOPES = [
  { id: 'masonry', label: '1 · Chimenea', color: '#a67c52' },
  { id: 'shell', label: '2 · Carcasa', color: '#3d7a8c' },
  { id: 'chamber', label: '3 · Cámara', color: '#2a2e33' },
] as const

export function ReviewModeBar() {
  const reviewMode = useViewerStore((s) => s.reviewMode)
  const applyReviewMode = useViewerStore((s) => s.applyReviewMode)
  const setLayerVisible = useViewerStore((s) => s.setLayerVisible)
  const layers = useViewerStore((s) => s.model.layers)

  return (
    <div className="review-bar">
      <span className="panel-title">Modos de revisión</span>
      <div className="btn-group wrap">
        {REVIEW_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={reviewMode === p.id ? 'active' : ''}
            title={p.description}
            onClick={() => applyReviewMode(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <span className="panel-title envelope-bar-title">Envolventes</span>
      <div className="btn-group wrap envelope-toggles">
        {ENVELOPES.map((e) => {
          const visible = layers.find((l) => l.id === e.id)?.visible ?? true
          return (
            <label
              key={e.id}
              className={`envelope-chip ${visible ? 'on' : ''}`}
              title={visible ? `Ocultar ${e.label}` : `Mostrar ${e.label}`}
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={(ev) => setLayerVisible(e.id, ev.target.checked)}
              />
              <span className="swatch" style={{ background: e.color }} />
              {e.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}
