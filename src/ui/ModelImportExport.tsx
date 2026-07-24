import type { DesignModel } from '../config/modelSchema'
import { useViewerStore } from '../state/useViewerStore'

function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ModelImportExport() {
  const model = useViewerStore((s) => s.model)
  const importModel = useViewerStore((s) => s.importModel)
  const setReviewNotes = useViewerStore((s) => s.setReviewNotes)

  return (
    <section className="panel">
      <h2>Importar / exportar</h2>
      <label className="field">
        Notas de revisión
        <textarea
          rows={3}
          value={model.reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Acuerdos con el ingeniero…"
        />
      </label>
      <div className="btn-group wrap">
        <button
          type="button"
          onClick={() =>
            download(
              `estufa-model-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(model, null, 2),
            )
          }
        >
          Exportar JSON del modelo
        </button>
        <label className="file-btn">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const parsed = JSON.parse(text) as DesignModel
                if (!parsed.fireplace || !parsed.layers) {
                  alert('JSON inválido: falta fireplace o layers.')
                  return
                }
                importModel(parsed)
              } catch {
                alert('No se pudo leer el JSON.')
              }
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </section>
  )
}
