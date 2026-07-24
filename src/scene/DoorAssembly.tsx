import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { DesignModel } from '../config/modelSchema'
import { frontLayoutFromModel } from '../geometry/frontLayout'
import { buildLayerPart } from '../geometry/insertBuilders'
import { createMaterial } from '../materials/materials'
import { useViewerStore } from '../state/useViewerStore'

/** Puerta animada: gira sobre bisagra izquierda sin chocar con marco exterior. */
export function DoorAssembly({
  model,
  explode,
  selected,
  showLabels,
  onSelect,
  clippingPlanes,
}: {
  model: DesignModel
  explode: number
  selected: boolean
  showLabels: boolean
  onSelect: () => void
  clippingPlanes?: THREE.Plane[]
}) {
  const doorOpen = useViewerStore((s) => s.doorOpen)
  const layer = model.layers.find((l) => l.id === 'door')
  const fl = useMemo(() => frontLayoutFromModel(model), [model])
  const parts = useMemo(() => (layer ? buildLayerPart(layer, model) : []), [layer, model])
  const pivot = useRef<THREE.Group>(null)
  const angle = useRef(0)

  useFrame((_, dt) => {
    if (!pivot.current) return
    // Bisagra a la izquierda: rotación +Y abre hacia el frente (Z negativo, hacia la habitación)
    const target = doorOpen ? Math.PI * 0.55 : 0
    angle.current = THREE.MathUtils.damp(angle.current, target, 6, dt)
    pivot.current.rotation.y = angle.current
  })

  if (!layer?.visible) return null

  const offset = new THREE.Vector3(
    layer.explodeOffset.x * explode,
    layer.explodeOffset.y * explode,
    layer.explodeOffset.z * explode,
  )

  const hingeWorld = new THREE.Vector3(fl.door.hingeX, (fl.door.yBottom + fl.door.yTop) / 2, fl.door.zLeaf)

  return (
    <group position={offset}>
      <group position={hingeWorld}>
        <group ref={pivot}>
          <group position={[-fl.door.hingeX, -(fl.door.yBottom + fl.door.yTop) / 2, 0]}>
            {parts.map((part, i) => {
              const key = part.materialOverride === 'glass' ? 'glass' : 'steel'
              const mat = createMaterial(key, {
                selected,
                opacity: part.materialOverride === 'seal' ? 0.45 : undefined,
                transparent: part.materialOverride === 'seal' || key === 'glass',
              })
              if (part.materialOverride === 'seal') {
                ;(mat as THREE.MeshStandardMaterial).color.set('#3d5a4c')
                ;(mat as THREE.MeshStandardMaterial).opacity = 0.4
                ;(mat as THREE.MeshStandardMaterial).transparent = true
              }
              if (clippingPlanes?.length) {
                mat.clippingPlanes = clippingPlanes
                mat.clipShadows = true
              }
              return (
                <mesh
                  key={i}
                  geometry={part.geometry}
                  material={mat}
                  position={part.position}
                  rotation={part.rotation}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                  }}
                />
              )
            })}
          </group>
        </group>
      </group>
      {showLabels && (
        <Html position={[0, fl.door.yTop + 4, fl.door.zLeaf]} center>
          <span className="part-label">Puerta y vidrio</span>
        </Html>
      )}
    </group>
  )
}
