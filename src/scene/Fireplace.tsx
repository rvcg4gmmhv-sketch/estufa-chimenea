import { useMemo } from 'react'
import * as THREE from 'three'
import type { FireplaceDimensions, FireplaceVisibility } from '../config/modelSchema'
import {
  buildFireplaceCavityGeometry,
  chimneyStackGeometry,
  chimneyStackPosition,
} from '../geometry/fireplaceCavity'
import { createMaterial, ENVELOPE_COLORS } from '../materials/materials'
import { DimensionOverlays } from '../geometry/dimensionOverlays'
import { Html } from '@react-three/drei'

interface Props {
  fireplace: FireplaceDimensions
  visibility: FireplaceVisibility
  showDimensions: boolean
  selected: boolean
  hovered: boolean
  showLabels: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
  explodeOffset: THREE.Vector3
  opacity: number
  showEdges: boolean
  showEnvelopeLabel: boolean
}

export function Fireplace({
  fireplace,
  visibility,
  showDimensions,
  selected,
  hovered,
  showLabels,
  onSelect,
  onHover,
  explodeOffset,
  opacity,
  showEdges,
  showEnvelopeLabel,
}: Props) {
  const cavity = useMemo(
    () => buildFireplaceCavityGeometry(fireplace),
    [fireplace],
  )
  const stackGeo = useMemo(() => chimneyStackGeometry(fireplace), [fireplace])
  const stackPos = useMemo(() => chimneyStackPosition(fireplace), [fireplace])
  const edges = useMemo(() => new THREE.EdgesGeometry(cavity, 20), [cavity])

  if (visibility === 'hidden') {
    return showDimensions ? (
      <DimensionOverlays fireplace={fireplace} visible={showDimensions} />
    ) : null
  }

  const ghost = visibility === 'ghost'
  const matOpacity = ghost ? Math.min(opacity, 0.22) : opacity
  const mat = createMaterial('masonry', {
    opacity: matOpacity,
    transparent: true,
    selected: selected || hovered,
    envelope: 'masonry',
  })
  const stackMat = createMaterial('duct', {
    opacity: ghost ? 0.12 : Math.min(0.7, opacity),
    transparent: true,
  })

  const showPartLabel = (showLabels || hovered) && !showEnvelopeLabel

  const pointerProps = {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onHover(true)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onHover(false)
      document.body.style.cursor = 'auto'
    },
  }

  return (
    <group
      position={explodeOffset}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <mesh geometry={cavity} material={mat} {...pointerProps} />
      <mesh geometry={stackGeo} material={stackMat} position={stackPos} {...pointerProps} />
      {(ghost || showEdges) && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial
            color={ENVELOPE_COLORS.masonryEdge}
            transparent
            opacity={ghost ? 0.65 : 0.85}
            depthTest
          />
        </lineSegments>
      )}
      {showEnvelopeLabel && (
        <Html
          position={[fireplace.frontWidth / 2 + 8, fireplace.frontHeight * 0.55, 8]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className="envelope-label masonry">1 · Cavidad chimenea</span>
        </Html>
      )}
      {showPartLabel && (
        <Html
          position={[fireplace.frontWidth / 2 + 8, fireplace.frontHeight * 0.55, 8]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`part-label${hovered && !showLabels ? ' hover' : ''}`}>
            Albañilería y refractarios existentes
          </span>
        </Html>
      )}
      <DimensionOverlays fireplace={fireplace} visible={showDimensions} />
    </group>
  )
}
