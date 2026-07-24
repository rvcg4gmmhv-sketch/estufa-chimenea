import { buildCadReportMarkdown, buildCadSpec } from '../export/buildCadSpec'
import { useViewerStore } from '../state/useViewerStore'

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CadHandoffExport() {
  const model = useViewerStore((s) => s.model)

  return (
    <section className="panel">
      <h2>Puente a CAD</h2>
      <p className="muted">
        Exporta una especificación de referencia para remodelar en CAD. No genera STEP/STL de
        fabricación ni espesores.
      </p>
      <div className="btn-group wrap">
        <button
          type="button"
          onClick={() => {
            const spec = buildCadSpec(model)
            download(
              `cad-spec-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(spec, null, 2),
              'application/json',
            )
          }}
        >
          Exportar especificación para CAD
        </button>
        <button
          type="button"
          onClick={() => {
            const spec = buildCadSpec(model)
            download(
              `cad-spec-${new Date().toISOString().slice(0, 10)}.md`,
              buildCadReportMarkdown(spec),
              'text/markdown',
            )
          }}
        >
          Exportar informe Markdown
        </button>
      </div>
    </section>
  )
}
