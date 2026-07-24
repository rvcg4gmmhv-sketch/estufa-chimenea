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
  showLabels: boolean
  onSelect: (id: string) => void
  clippingPlanes?: THREE.Plane[]
}

function ElementMesh({
  el,
  explode,
  selected,
  showLabels,
  onSelect,
  clippingPlanes,
}: {
  el: DesignElement
  explode: number
  selected: boolean
  showLabels: boolean
  onSelect: () => void
  clippingPlanes?: THREE.Plane[]
}) {
  const geo = useMemo(() => buildElementGeometry(el), [el])
  const mat = useMemo(() => {
    const m = createMaterial(el.materialKey, { selected, opacity: selected ? 1 : 0.9 })
    if (clippingPlanes?.length) {
      m.clippingPlanes = clippingPlanes
      m.clipShadows = true
    }
    return m
  }, [el.materialKey, selected, clippingPlanes])

  if (!el.visible) return null

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
    >
      <mesh geometry={geo} material={mat} />
      {showLabels && (
        <Html position={[0, el.scale.y / 2 + 3, 0]} center>
          <span className="part-label">{el.name}</span>
        </Html>
      )}
    </group>
  )
}

export function ElementAssembly({
  elements,
  explode,
  selectedId,
  showLabels,
  onSelect,
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
          showLabels={showLabels}
          onSelect={() => onSelect(el.id)}
          clippingPlanes={clippingPlanes}
        />
      ))}
    </group>
  )
}
