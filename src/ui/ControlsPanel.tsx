import { useViewerStore } from '../state/useViewerStore'

export function ControlsPanel() {
  const fireplaceVisibility = useViewerStore((s) => s.fireplaceVisibility)
  const setFireplaceVisibility = useViewerStore((s) => s.setFireplaceVisibility)
  const showDimensions = useViewerStore((s) => s.showDimensions)
  const setShowDimensions = useViewerStore((s) => s.setShowDimensions)
  const showLabels = useViewerStore((s) => s.showLabels)
  const setShowLabels = useViewerStore((s) => s.setShowLabels)
  const showFlows = useViewerStore((s) => s.showFlows)
  const setShowFlows = useViewerStore((s) => s.setShowFlows)
  const shellOpacity = useViewerStore((s) => s.shellOpacity)
  const setShellOpacity = useViewerStore((s) => s.setShellOpacity)
  const masonryOpacity = useViewerStore((s) => s.masonryOpacity)
  const setMasonryOpacity = useViewerStore((s) => s.setMasonryOpacity)
  const chamberOpacity = useViewerStore((s) => s.chamberOpacity)
  const setChamberOpacity = useViewerStore((s) => s.setChamberOpacity)
  const envelopeSeparate = useViewerStore((s) => s.envelopeSeparate)
  const setEnvelopeSeparate = useViewerStore((s) => s.setEnvelopeSeparate)
  const showEnvelopeEdges = useViewerStore((s) => s.showEnvelopeEdges)
  const setShowEnvelopeEdges = useViewerStore((s) => s.setShowEnvelopeEdges)
  const showEnvelopeLabels = useViewerStore((s) => s.showEnvelopeLabels)
  const setShowEnvelopeLabels = useViewerStore((s) => s.setShowEnvelopeLabels)
  const explode = useViewerStore((s) => s.explode)
  const setExplode = useViewerStore((s) => s.setExplode)
  const clipEnabled = useViewerStore((s) => s.clipEnabled)
  const setClipEnabled = useViewerStore((s) => s.setClipEnabled)
  const clipAxis = useViewerStore((s) => s.clipAxis)
  const setClipAxis = useViewerStore((s) => s.setClipAxis)
  const clipPosition = useViewerStore((s) => s.clipPosition)
  const setClipPosition = useViewerStore((s) => s.setClipPosition)
  const theme = useViewerStore((s) => s.theme)
  const setTheme = useViewerStore((s) => s.setTheme)
  const outletSideVisible =
    useViewerStore((s) => s.model.layers.find((l) => l.id === 'outletSide')?.visible) ??
    false
  const setLayerVisible = useViewerStore((s) => s.setLayerVisible)

  return (
    <section className="panel">
      <h2>Controles</h2>
      <label className="field">
        Chimenea existente
        <select
          value={fireplaceVisibility}
          onChange={(e) =>
            setFireplaceVisibility(e.target.value as typeof fireplaceVisibility)
          }
        >
          <option value="solid">Sólida</option>
          <option value="ghost">Ghost</option>
          <option value="hidden">Oculta</option>
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={outletSideVisible}
          onChange={(e) => setLayerVisible('outletSide', e.target.checked)}
        />
        Salida lateral al pasillo (opcional)
      </label>
      <p className="muted" style={{ marginTop: '-0.15rem', marginBottom: '0.45rem' }}>
        Desactívala si no planeas implementarla; también oculta su flujo.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={showDimensions}
          onChange={(e) => setShowDimensions(e.target.checked)}
        />
        Mostrar cotas
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(e) => setShowLabels(e.target.checked)}
        />
        Mostrar etiquetas
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={showFlows}
          onChange={(e) => setShowFlows(e.target.checked)}
        />
        Mostrar recorridos de aire
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={clipEnabled}
          onChange={(e) => setClipEnabled(e.target.checked)}
        />
        Modo corte
      </label>
      {clipEnabled && (
        <>
          <label className="field">
            Eje de corte
            <select
              value={clipAxis}
              onChange={(e) => setClipAxis(e.target.value as typeof clipAxis)}
            >
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </label>
          <label className="field">
            Posición del plano ({clipPosition.toFixed(2)})
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={clipPosition}
              onChange={(e) => setClipPosition(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <label className="field">
        Opacidad chimenea ({Math.round(masonryOpacity * 100)}%)
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={masonryOpacity}
          onChange={(e) => setMasonryOpacity(Number(e.target.value))}
        />
      </label>
      <label className="field">
        Opacidad carcasa ({Math.round(shellOpacity * 100)}%)
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={shellOpacity}
          onChange={(e) => setShellOpacity(Number(e.target.value))}
        />
      </label>
      <label className="field">
        Opacidad cámara ({Math.round(chamberOpacity * 100)}%)
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={chamberOpacity}
          onChange={(e) => setChamberOpacity(Number(e.target.value))}
        />
      </label>
      <label className="field">
        Separar envolventes ({Math.round(envelopeSeparate * 100)}%)
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={envelopeSeparate}
          onChange={(e) => setEnvelopeSeparate(Number(e.target.value))}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={showEnvelopeEdges}
          onChange={(e) => setShowEnvelopeEdges(e.target.checked)}
        />
        Contornos de envolventes
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={showEnvelopeLabels}
          onChange={(e) => setShowEnvelopeLabels(e.target.checked)}
        />
        Etiquetas de envolventes
      </label>
      <label className="field">
        Vista explotada ({Math.round(explode * 100)}%)
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={explode}
          onChange={(e) => setExplode(Number(e.target.value))}
        />
      </label>
      <label className="field">
        Tema
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </label>
    </section>
  )
}
