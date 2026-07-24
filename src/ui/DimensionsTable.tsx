import { inclineLength } from '../config/validateModel'
import { useViewerStore } from '../state/useViewerStore'

export function DimensionsTable() {
  const fireplace = useViewerStore((s) => s.model.fireplace)
  const insertFit = useViewerStore((s) => s.model.insertFit)
  const updateFireplace = useViewerStore((s) => s.updateFireplace)
  const updateInsertFit = useViewerStore((s) => s.updateInsertFit)
  const resetModel = useViewerStore((s) => s.resetModel)

  const incline = inclineLength(fireplace)

  return (
    <section className="panel">
      <h2>Dimensiones</h2>
      <h3>Chimenea</h3>
      <div className="dim-grid">
        {(
          [
            ['frontWidth', 'Ancho frontal'],
            ['backWidth', 'Ancho posterior'],
            ['depth', 'Profundidad'],
            ['frontHeight', 'Altura boca'],
            ['backWallHeight', 'Pared posterior'],
            ['lintelDepth', 'Dintel horizontal'],
            ['throatDepth', 'Garganta (prof.)'],
            ['throatHeight', 'Altura garganta'],
            ['chimneyHeight', 'Chimenea vertical'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field compact">
            {label}
            <input
              type="number"
              step={0.5}
              value={fireplace[key]}
              onChange={(e) => updateFireplace({ [key]: Number(e.target.value) })}
            />
            <span className="origin">{fireplace.origins[key] ?? '—'}</span>
          </label>
        ))}
      </div>
      <p className="muted">
        Proyección inclinada (derivada): {fireplace.inclineHorizontal.toFixed(1)} cm · Longitud
        inclinada ≈ {incline.toFixed(1)} cm
      </p>
      <h3>Encaje del inserto</h3>
      <div className="dim-grid">
        {(
          [
            ['sideClearance', 'Holgura lateral'],
            ['bottomClearance', 'Holgura inferior'],
            ['topClearance', 'Holgura bajo dintel'],
            ['roofClearance', 'Holgura bajo inclinada'],
            ['frontSetback', 'Retroceso frontal'],
            ['rearClearance', 'Holgura trasera'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field compact">
            {label}
            <input
              type="number"
              step={0.5}
              value={insertFit[key]}
              onChange={(e) => updateInsertFit({ [key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={resetModel}>
        Restablecer valores
      </button>
    </section>
  )
}
