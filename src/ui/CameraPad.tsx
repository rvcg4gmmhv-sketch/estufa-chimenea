import { useViewerStore } from '../state/useViewerStore'

export function CameraPad() {
  const requestCameraAction = useViewerStore((s) => s.requestCameraAction)
  const setCameraView = useViewerStore((s) => s.setCameraView)

  return (
    <div className="camera-pad" aria-label="Controles de cámara">
      <div className="camera-pad-orbit">
        <button
          type="button"
          className="cam-btn"
          title="Girar arriba"
          onClick={() => requestCameraAction('orbitUp')}
        >
          ▲
        </button>
        <div className="cam-row">
          <button
            type="button"
            className="cam-btn"
            title="Girar izquierda"
            onClick={() => requestCameraAction('orbitLeft')}
          >
            ◀
          </button>
          <button
            type="button"
            className="cam-btn cam-fit"
            title="Encajar vista"
            onClick={() => {
              requestCameraAction('fit')
              setCameraView('iso')
            }}
          >
            ⌂
          </button>
          <button
            type="button"
            className="cam-btn"
            title="Girar derecha"
            onClick={() => requestCameraAction('orbitRight')}
          >
            ▶
          </button>
        </div>
        <button
          type="button"
          className="cam-btn"
          title="Girar abajo"
          onClick={() => requestCameraAction('orbitDown')}
        >
          ▼
        </button>
      </div>
      <div className="camera-pad-zoom">
        <button
          type="button"
          className="cam-btn"
          title="Acercar"
          onClick={() => requestCameraAction('zoomIn')}
        >
          +
        </button>
        <button
          type="button"
          className="cam-btn"
          title="Alejar"
          onClick={() => requestCameraAction('zoomOut')}
        >
          −
        </button>
      </div>
      <p className="camera-hint">
        <strong>Girar:</strong> arrastrar · <strong>Mover:</strong> clic derecho o rueda
        pulsada · <strong>Zoom:</strong> rueda
        <br />
        <span className="muted">Táctil: 1 dedo gira · 2 dedos zoom y desplaza</span>
      </p>
    </div>
  )
}
