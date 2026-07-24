import { useViewerStore } from '../state/useViewerStore'

export function Toolbar() {
  const setCameraView = useViewerStore((s) => s.setCameraView)
  const flowAnimation = useViewerStore((s) => s.flowAnimation)
  const setFlowAnimation = useViewerStore((s) => s.setFlowAnimation)
  const doorOpen = useViewerStore((s) => s.doorOpen)
  const toggleDoor = useViewerStore((s) => s.toggleDoor)
  const undo = useViewerStore((s) => s.undo)
  const redo = useViewerStore((s) => s.redo)

  return (
    <div className="toolbar">
      <div className="btn-group">
        <button type="button" onClick={() => setCameraView('front')}>Vista frontal</button>
        <button type="button" onClick={() => setCameraView('side')}>Vista lateral</button>
        <button type="button" onClick={() => setCameraView('top')}>Vista superior</button>
        <button type="button" onClick={() => setCameraView('iso')}>Vista isométrica</button>
        <button type="button" onClick={() => setCameraView('reset')}>Restablecer</button>
      </div>
      <div className="btn-group">
        <button type="button" className={doorOpen ? 'active' : ''} onClick={toggleDoor}>
          {doorOpen ? 'Cerrar puerta' : 'Abrir puerta'}
        </button>
        <button type="button" onClick={() => setFlowAnimation(!flowAnimation)}>
          {flowAnimation ? 'Pausar flujos' : 'Activar flujos'}
        </button>
        <button type="button" onClick={undo}>Deshacer</button>
        <button type="button" onClick={redo}>Rehacer</button>
      </div>
    </div>
  )
}
