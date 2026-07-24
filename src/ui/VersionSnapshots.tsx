import { useState } from 'react'
import { useViewerStore } from '../state/useViewerStore'

export function VersionSnapshots() {
  const snapshots = useViewerStore((s) => s.snapshots)
  const saveSnapshot = useViewerStore((s) => s.saveSnapshot)
  const restoreSnapshot = useViewerStore((s) => s.restoreSnapshot)
  const [name, setName] = useState('Revisión')

  return (
    <section className="panel">
      <h2>Versiones</h2>
      <div className="btn-group">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del snapshot"
        />
        <button
          type="button"
          onClick={() => {
            saveSnapshot(name || `Snapshot ${snapshots.length + 1}`)
            setName('Revisión')
          }}
        >
          Guardar snapshot
        </button>
      </div>
      <ul className="layer-list">
        {snapshots.map((s) => (
          <li key={s.id}>
            <button type="button" className="linkish" onClick={() => restoreSnapshot(s.id)}>
              {s.name} · {new Date(s.createdAt).toLocaleString()}
            </button>
          </li>
        ))}
        {!snapshots.length && <li className="muted">Sin snapshots aún</li>}
      </ul>
    </section>
  )
}
