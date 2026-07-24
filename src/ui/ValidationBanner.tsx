import { useMemo } from 'react'
import { validateModel } from '../config/validateModel'
import { useViewerStore } from '../state/useViewerStore'

export function ValidationBanner() {
  const model = useViewerStore((s) => s.model)
  const issues = useMemo(() => validateModel(model), [model])

  if (!issues.length) return null

  return (
    <div className="validation-banner">
      {issues.map((issue, i) => (
        <p key={i} className={issue.level}>
          {issue.level === 'error' ? 'Error: ' : 'Aviso: '}
          {issue.message}
        </p>
      ))}
    </div>
  )
}
