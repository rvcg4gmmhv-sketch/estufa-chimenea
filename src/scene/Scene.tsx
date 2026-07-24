import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '../state/useViewerStore'
import { ElementAssembly } from './ElementAssembly'
import { Fireplace } from './Fireplace'
import { FlowSystem } from './FlowSystem'
import { InsertAssembly } from './InsertAssembly'
import { SceneAxes } from './AxesHelper'
import { CameraRig } from './CameraRig'

export function Scene() {
  const model = useViewerStore((s) => s.model)
  const fireplaceVisibility = useViewerStore((s) => s.fireplaceVisibility)
  const showDimensions = useViewerStore((s) => s.showDimensions)
  const showLabels = useViewerStore((s) => s.showLabels)
  const showFlows = useViewerStore((s) => s.showFlows)
  const flowAnimation = useViewerStore((s) => s.flowAnimation)
  const activeCircuits = useViewerStore((s) => s.activeCircuits)
  const shellOpacity = useViewerStore((s) => s.shellOpacity)
  const masonryOpacity = useViewerStore((s) => s.masonryOpacity)
  const chamberOpacity = useViewerStore((s) => s.chamberOpacity)
  const envelopeSeparate = useViewerStore((s) => s.envelopeSeparate)
  const showEnvelopeEdges = useViewerStore((s) => s.showEnvelopeEdges)
  const showEnvelopeLabels = useViewerStore((s) => s.showEnvelopeLabels)
  const explode = useViewerStore((s) => s.explode)
  const selectedId = useViewerStore((s) => s.selectedId)
  const clipEnabled = useViewerStore((s) => s.clipEnabled)
  const clipAxis = useViewerStore((s) => s.clipAxis)
  const clipPosition = useViewerStore((s) => s.clipPosition)
  const select = useViewerStore((s) => s.select)
  const theme = useViewerStore((s) => s.theme)
  const { gl } = useThree()

  useEffect(() => {
    gl.localClippingEnabled = clipEnabled
  }, [gl, clipEnabled])

  const clippingPlanes = useMemo(() => {
    if (!clipEnabled) return []
    const n = new THREE.Vector3(
      clipAxis === 'x' ? 1 : 0,
      clipAxis === 'y' ? 1 : 0,
      clipAxis === 'z' ? 1 : 0,
    )
    // clipPosition -1..1 mapped to scene extents
    const extent = clipAxis === 'y' ? 70 : clipAxis === 'z' ? 50 : 40
    const constant = -(clipPosition * extent)
    return [new THREE.Plane(n, constant)]
  }, [clipEnabled, clipAxis, clipPosition])

  const masonry = model.layers.find((l) => l.id === 'masonry')
  const masonryExplode = new THREE.Vector3(
    (masonry?.explodeOffset.x ?? 0) * explode,
    (masonry?.explodeOffset.y ?? 0) * explode,
    (masonry?.explodeOffset.z ?? 0) * explode - envelopeSeparate * 10,
  )

  return (
    <>
      <color attach="background" args={[theme === 'dark' ? '#1c1e22' : '#e8e6e1']} />
      <ambientLight intensity={theme === 'dark' ? 0.4 : 0.55} />
      <directionalLight position={[80, 120, -60]} intensity={1.1} castShadow />
      <directionalLight position={[-60, 40, 40]} intensity={0.35} />
      <CameraRig />
      <SceneAxes />
      <group onClick={() => select(null)}>
        {masonry?.visible !== false && (
          <Fireplace
            fireplace={model.fireplace}
            visibility={fireplaceVisibility}
            showDimensions={showDimensions}
            selected={selectedId === 'masonry'}
            onSelect={() => select('masonry')}
            explodeOffset={masonryExplode}
            opacity={masonryOpacity}
            showEdges={showEnvelopeEdges}
            showLabel={showEnvelopeLabels}
          />
        )}
        <InsertAssembly
          model={model}
          explode={explode}
          envelopeSeparate={envelopeSeparate}
          shellOpacity={shellOpacity}
          chamberOpacity={chamberOpacity}
          showEnvelopeEdges={showEnvelopeEdges}
          showEnvelopeLabels={showEnvelopeLabels}
          selectedId={selectedId}
          showLabels={showLabels}
          onSelect={select}
          clippingPlanes={clippingPlanes}
        />
        <ElementAssembly
          elements={model.elements}
          explode={explode}
          selectedId={selectedId}
          showLabels={showLabels}
          onSelect={select}
          clippingPlanes={clippingPlanes}
        />
        {showFlows && (
          <FlowSystem
            model={model}
            explode={explode}
            animate={flowAnimation}
            activeCircuits={activeCircuits}
          />
        )}
      </group>
    </>
  )
}
