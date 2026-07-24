import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Scene } from './scene/Scene'
import { CadHandoffExport } from './ui/CadHandoffExport'
import { ControlsPanel } from './ui/ControlsPanel'
import { DimensionsTable } from './ui/DimensionsTable'
import { Disclaimer } from './ui/Disclaimer'
import { ElementEditor } from './ui/ElementEditor'
import { FlowControls, Legend } from './ui/FlowControls'
import { GuidedTour } from './ui/GuidedTour'
import { LayerPanel } from './ui/LayerPanel'
import { ModelImportExport } from './ui/ModelImportExport'
import { PartInfoCard } from './ui/PartInfoCard'
import { ReviewModeBar } from './ui/ReviewModeBar'
import { Toolbar } from './ui/Toolbar'
import { ValidationBanner } from './ui/ValidationBanner'
import { VersionSnapshots } from './ui/VersionSnapshots'
import { CameraPad } from './ui/CameraPad'
import { useViewerStore } from './state/useViewerStore'
import './App.css'

export default function App() {
  const theme = useViewerStore((s) => s.theme)
  const [panelOpen, setPanelOpen] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const bg = theme === 'dark' ? '#1c1e22' : '#e8e6e1'

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Inserto estufa a leña</h1>
          <p className="subtitle">Maqueta conceptual para revisión térmica</p>
        </div>
        <Toolbar />
      </header>
      <Disclaimer />
      <ValidationBanner />
      <div className="workspace">
        <div className="canvas-wrap">
          <Canvas
            camera={{ position: [90, 70, -90], fov: 40, near: 0.1, far: 2000 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, localClippingEnabled: true }}
            onCreated={({ scene }) => {
              scene.background = null
            }}
            style={{ background: bg }}
          >
            <Scene />
          </Canvas>
          <div className="canvas-overlay">
            <ReviewModeBar />
            <GuidedTour />
          </div>
          <CameraPad />
        </div>
        <aside className={`side-panel ${panelOpen ? 'open' : 'closed'}`}>
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
          </button>
          {panelOpen && (
            <div className="side-scroll">
              <PartInfoCard />
              <ControlsPanel />
              <FlowControls />
              <Legend />
              <LayerPanel />
              <ElementEditor />
              <DimensionsTable />
              <VersionSnapshots />
              <ModelImportExport />
              <CadHandoffExport />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
