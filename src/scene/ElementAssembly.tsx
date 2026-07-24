import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { DesignElement } from '../config/modelSchema'
import { buildElementGeometry } from '../geometry/elementBuilders'
import { createMaterial } from '../materials/materials'

interface Props {
  elements: DesignElement[]
  explode: number
  selectedId: string | null
  hoveredId: string | null
  showLabels: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  clippingPlanes?: THREE.Plane[]
}

function ElementMesh({
  el,
  explode,
  selected,
  hovered,
  showLabels,
  onSelect,
  onHover,
  clippingPlanes,
}: {
  el: DesignElement
  explode: number
  selected: boolean
  hovered: boolean
  showLabels: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
  clippingPlanes?: THREE.Plane[]
}) {
  const geo = useMemo(() => buildElementGeometry(el), [el])
  const mat = useMemo(() => {
    const m = createMaterial(el.materialKey, {
      selected: selected || hovered,
      opacity: selected || hovered ? 1 : 0.9,
    })
    if (clippingPlanes?.length) {
      m.clippingPlanes = clippingPlanes
      m.clipShadows = true
    }
    return m
  }, [el.materialKey, selected, hovered, clippingPlanes])

  if (!el.visible) return null

  const showPartLabel = showLabels || hovered

  return (
    <group
      position={[
        el.position.x + el.explodeOffset.x * explode,
        el.position.y + el.explodeOffset.y * explode,
        el.position.z + el.explodeOffset.z * explode,
      ]}
      rotation={[
        THREE.MathUtils.degToRad(el.rotation.x),
        THREE.MathUtils.degToRad(el.rotation.y),
        THREE.MathUtils.degToRad(el.rotation.z),
      ]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <mesh geometry={geo} material={mat} />
      {showPartLabel && (
        <Html
          position={[0, el.scale.y / 2 + 3, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`part-label${hovered && !showLabels ? ' hover' : ''}`}>
            {el.name}
          </span>
        </Html>
      )}
    </group>
  )
}

export function ElementAssembly({
  elements,
  explode,
  selectedId,
  hoveredId,
  showLabels,
  onSelect,
  onHover,
  clippingPlanes,
}: Props) {
  return (
    <group>
      {elements.map((el) => (
        <ElementMesh
          key={el.id}
          el={el}
          explode={explode}
          selected={selectedId === el.id}
          hovered={hoveredId === el.id}
          showLabels={showLabels}
          onSelect={() => onSelect(el.id)}
          onHover={(v) => onHover(v ? el.id : null)}
          clippingPlanes={clippingPlanes}
        />
      ))}
    </group>
  )
}
