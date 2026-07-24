import { useViewerStore } from '../state/useViewerStore'

const TOUR = [
  {
    title: 'Cavidad existente',
    text: 'Revisa la chimenea antigua con cotas. Usa ghost u ocultar el ducto de 6 m si aleja la cámara.',
    apply: () => {
      const s = useViewerStore.getState()
      s.setFireplaceVisibility('solid')
      s.setShowDimensions(true)
      s.setShowFlows(false)
      s.setExplode(0)
      s.setCameraView('side')
    },
  },
  {
    title: 'Inserto ensamblado',
    text: 'El inserto conceptual encaja en la cavidad. Selecciona piezas para ver su función.',
    apply: () => {
      const s = useViewerStore.getState()
      s.applyReviewMode('fit')
      s.setCameraView('iso')
    },
  },
  {
    title: 'Corte',
    text: 'Activa el modo corte y mueve el plano para ver el interior.',
    apply: () => {
      const s = useViewerStore.getState()
      s.setClipEnabled(true)
      s.setClipAxis('x')
      s.setClipPosition(0)
      s.setShowFlows(false)
      s.setCameraView('iso')
    },
  },
  {
    title: 'Circuitos de flujo',
    text: 'Tres circuitos separados: combustión (azul), gases (naranja) y calefacción (celeste/amarillo).',
    apply: () => {
      const s = useViewerStore.getState()
      s.setClipEnabled(false)
      s.applyReviewMode('combustion')
    },
  },
  {
    title: 'Vista explotada',
    text: 'Separa las capas de forma ordenada para entender la relación espacial.',
    apply: () => {
      useViewerStore.getState().applyReviewMode('exploded')
    },
  },
]

export function GuidedTour() {
  const step = useViewerStore((s) => s.guidedTourStep)
  const setGuidedTourStep = useViewerStore((s) => s.setGuidedTourStep)

  if (step === null) {
    return (
      <button type="button" className="tour-start" onClick={() => { TOUR[0].apply(); setGuidedTourStep(0) }}>
        Recorrido guiado
      </button>
    )
  }

  const current = TOUR[step]
  return (
    <div className="tour-card">
      <strong>
        Paso {step + 1}/{TOUR.length}: {current.title}
      </strong>
      <p>{current.text}</p>
      <div className="btn-group">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => {
            const n = step - 1
            TOUR[n].apply()
            setGuidedTourStep(n)
          }}
        >
          Anterior
        </button>
        {step < TOUR.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const n = step + 1
              TOUR[n].apply()
              setGuidedTourStep(n)
            }}
          >
            Siguiente
          </button>
        ) : (
          <button type="button" onClick={() => setGuidedTourStep(null)}>
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}
