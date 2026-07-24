import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CircuitId, DesignModel } from '../config/modelSchema'
import { elementPortWorld } from '../geometry/elementBuilders'
import { layerPortWorld } from '../geometry/insertBuilders'
import { CIRCUIT_COLORS } from '../materials/materials'

interface Props {
  model: DesignModel
  explode: number
  animate: boolean
  activeCircuits: Array<Exclude<CircuitId, 'none'>> | 'all'
}

function resolvePort(
  model: DesignModel,
  ownerId: string,
  portId: string,
  explode: number,
): THREE.Vector3 | null {
  const layer = model.layers.find((l) => l.id === ownerId)
  if (layer) {
    const ports = layerPortWorld(layer, model)
    const p = ports[portId]
    if (!p) return null
    return p
      .clone()
      .add(
        new THREE.Vector3(
          layer.explodeOffset.x * explode,
          layer.explodeOffset.y * explode,
          layer.explodeOffset.z * explode,
        ),
      )
  }
  const el = model.elements.find((e) => e.id === ownerId)
  if (el) {
    const ports = elementPortWorld(el)
    const p = ports[portId]
    if (!p) return null
    return p
      .clone()
      .add(
        new THREE.Vector3(
          el.explodeOffset.x * explode,
          el.explodeOffset.y * explode,
          el.explodeOffset.z * explode,
        ),
      )
  }
  return null
}

function CircuitFlow({
  points,
  color,
  animate,
}: {
  points: THREE.Vector3[]
  color: string
  animate: boolean
}) {
  const curve = useMemo(() => {
    if (points.length < 2) return null
    return new THREE.CatmullRomCurve3(points)
  }, [points])

  const dots = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (!animate || !curve || !dots.current) return
    dots.current.children.forEach((child, i) => {
      const speed = 0.08
      const t = ((performance.now() * 0.001 * speed + i / dots.current!.children.length) % 1)
      const p = curve.getPoint(t)
      child.position.copy(p)
    })
    void dt
  })

  if (!curve || points.length < 2) return null

  const linePts = curve.getPoints(32)

  return (
    <group>
      <Line points={linePts} color={color} lineWidth={2} transparent opacity={0.55} />
      <group ref={dots}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1.1, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function FlowSystem({ model, explode, animate, activeCircuits }: Props) {
  const paths = useMemo(() => {
    const circuits: Array<Exclude<CircuitId, 'none'>> =
      activeCircuits === 'all' ? ['combustion', 'gases', 'heating'] : activeCircuits

    const ownerVisible = (ownerId: string) => {
      const layer = model.layers.find((l) => l.id === ownerId)
      if (layer) return layer.visible
      const el = model.elements.find((e) => e.id === ownerId)
      if (el) return el.visible
      return true
    }

    return circuits.map((circuit) => {
      const edges = model.flowEdges.filter(
        (e) =>
          e.circuit === circuit &&
          ownerVisible(e.from.ownerId) &&
          ownerVisible(e.to.ownerId),
      )
      const segs: { points: THREE.Vector3[]; cold?: boolean }[] = []
      for (const edge of edges) {
        const a = resolvePort(model, edge.from.ownerId, edge.from.portId, explode)
        const b = resolvePort(model, edge.to.ownerId, edge.to.portId, explode)
        if (a && b) {
          segs.push({
            points: [a, b],
            cold:
              circuit === 'heating' &&
              (edge.id === 'h0' ||
                edge.from.ownerId === 'grilleBottom' ||
                edge.id === 'h1n'),
          })
        }
      }
      const color =
        circuit === 'combustion'
          ? CIRCUIT_COLORS.combustion
          : circuit === 'gases'
            ? CIRCUIT_COLORS.gases
            : CIRCUIT_COLORS.heatingHot
      return { circuit, color, segs }
    })
  }, [model, explode, activeCircuits])

  return (
    <group>
      {paths.map((p) =>
        p.segs.map((seg, i) => (
          <CircuitFlow
            key={`${p.circuit}-${i}`}
            points={seg.points}
            color={seg.cold ? CIRCUIT_COLORS.heatingCold : p.color}
            animate={animate}
          />
        )),
      )}
    </group>
  )
}
