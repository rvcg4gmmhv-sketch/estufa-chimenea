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
  onSelect: () => void
  explodeOffset: THREE.Vector3
  opacity: number
  showEdges: boolean
  showLabel: boolean
}

export function Fireplace({
  fireplace,
  visibility,
  showDimensions,
  selected,
  onSelect,
  explodeOffset,
  opacity,
  showEdges,
  showLabel,
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
    selected,
    envelope: 'masonry',
  })
  const stackMat = createMaterial('duct', {
    opacity: ghost ? 0.12 : Math.min(0.7, opacity),
    transparent: true,
  })

  return (
    <group position={explodeOffset} onClick={(e) => { e.stopPropagation(); onSelect() }}>
      <mesh geometry={cavity} material={mat} />
      <mesh geometry={stackGeo} material={stackMat} position={stackPos} />
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
      {showLabel && (
        <Html position={[fireplace.frontWidth / 2 + 8, fireplace.frontHeight * 0.55, 8]} center>
          <span className="envelope-label masonry">1 · Cavidad chimenea</span>
        </Html>
      )}
      <DimensionOverlays fireplace={fireplace} visible={showDimensions} />
    </group>
  )
}
