import { Html, Line } from '@react-three/drei'
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

type Seg = {
  points: THREE.Vector3[]
  cold?: boolean
  label?: string
  labelAt?: 'start' | 'end'
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

/** Inserta un punto intermedio para curvas más legibles en tramos largos. */
function withBend(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3[] {
  const mid = a.clone().lerp(b, 0.5)
  const dist = a.distanceTo(b)
  if (dist < 12) return [a, b]
  // Ligera curvatura hacia “fuera” del cassette (frente / pasillo)
  const outward = new THREE.Vector3(
    Math.sign(a.x + b.x) * Math.min(6, dist * 0.08),
    Math.max(a.y, b.y) * 0.02,
    Math.min(a.z, b.z) - dist * 0.06,
  )
  mid.add(outward)
  return [a, mid, b]
}

function CircuitFlow({
  points,
  color,
  animate,
  label,
  labelAt,
}: {
  points: THREE.Vector3[]
  color: string
  animate: boolean
  label?: string
  labelAt?: 'start' | 'end'
}) {
  const curve = useMemo(() => {
    if (points.length < 2) return null
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
  }, [points])

  const dots = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!animate || !curve || !dots.current) return
    const n = dots.current.children.length
    dots.current.children.forEach((child, i) => {
      const speed = 0.07
      const t = (performance.now() * 0.001 * speed + i / n) % 1
      child.position.copy(curve.getPoint(t))
    })
  })

  if (!curve || points.length < 2) return null

  const linePts = curve.getPoints(48)
  const labelPos =
    labelAt === 'start' ? points[0] : labelAt === 'end' ? points[points.length - 1] : null

  return (
    <group>
      <Line points={linePts} color={color} lineWidth={2.5} transparent opacity={0.65} />
      <group ref={dots}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1.25, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.92} />
          </mesh>
        ))}
      </group>
      {label && labelPos && (
        <Html position={labelPos} center style={{ pointerEvents: 'none' }}>
          <span className="flow-endpoint-label">{label}</span>
        </Html>
      )}
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

    const shellVisible = ownerVisible('shell')

    return circuits.map((circuit) => {
      const edges = model.flowEdges.filter(
        (e) =>
          e.circuit === circuit &&
          ownerVisible(e.from.ownerId) &&
          ownerVisible(e.to.ownerId),
      )
      const segs: Seg[] = []
      for (const edge of edges) {
        const a = resolvePort(model, edge.from.ownerId, edge.from.portId, explode)
        const b = resolvePort(model, edge.to.ownerId, edge.to.portId, explode)
        if (!a || !b) continue

        const cold =
          circuit === 'heating' &&
          (edge.id.startsWith('h_room_in') ||
            edge.id === 'h_grille' ||
            edge.id === 'h0' ||
            edge.id === 'h1n' ||
            edge.from.ownerId === 'grilleBottom')

        const label =
          edge.id === 'h_room_in'
            ? '← Habitación (frío)'
            : edge.id === 'h_room_out'
              ? 'Habitación (caliente) →'
              : edge.id === 'c_ext'
                ? '← Pasillo / exterior'
                : edge.id === 'h3_out'
                  ? 'Pasillo →'
                  : edge.id === 'g4'
                    ? '↑ Chimenea'
                    : undefined

        const labelAt =
          edge.id === 'h_room_in' || edge.id === 'c_ext'
            ? 'start'
            : edge.id === 'h_room_out' || edge.id === 'h3_out' || edge.id === 'g4'
              ? 'end'
              : undefined

        segs.push({
          points: withBend(a, b),
          cold,
          label,
          labelAt,
        })
      }

      // Sin camisa metálica: puente ventilador → rejilla caliente por el hueco conceptual
      if (circuit === 'heating' && !shellVisible && ownerVisible('cleanFan') && ownerVisible('outletFront')) {
        const fanOut = resolvePort(model, 'cleanFan', 'out', explode)
        const topIn = resolvePort(model, 'outletFront', 'in', explode)
        if (fanOut && topIn) {
          const mid = fanOut.clone().lerp(topIn, 0.55)
          mid.z += 10
          mid.y += 8
          segs.push({
            points: [fanOut, mid, topIn],
            cold: false,
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
            label={seg.label}
            labelAt={seg.labelAt}
          />
        )),
      )}
    </group>
  )
}
