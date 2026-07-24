import { REVIEW_PRESETS } from '../config/reviewPresets'
import { useViewerStore } from '../state/useViewerStore'

export function ReviewModeBar() {
  const reviewMode = useViewerStore((s) => s.reviewMode)
  const applyReviewMode = useViewerStore((s) => s.applyReviewMode)

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
    </div>
  )
}
