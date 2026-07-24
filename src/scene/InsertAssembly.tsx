import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { DesignModel, LayerDef, MaterialKey } from '../config/modelSchema'
import { buildLayerPart } from '../geometry/insertBuilders'
import { createMaterial, ENVELOPE_COLORS } from '../materials/materials'
import { DoorAssembly } from './DoorAssembly'

interface Props {
  model: DesignModel
  explode: number
  envelopeSeparate: number
  shellOpacity: number
  chamberOpacity: number
  showEnvelopeEdges: boolean
  showEnvelopeLabels: boolean
  selectedId: string | null
  hoveredId: string | null
  showLabels: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  clippingPlanes?: THREE.Plane[]
}

function envelopeOffset(
  layerId: string,
  explode: number,
  explodeOffset: { x: number; y: number; z: number },
  envelopeSeparate: number,
): THREE.Vector3 {
  const base = new THREE.Vector3(
    explodeOffset.x * explode,
    explodeOffset.y * explode,
    explodeOffset.z * explode,
  )
  const s = envelopeSeparate
  if (s <= 0) return base
  if (layerId === 'shell') {
    base.z -= s * 5
    base.y += s * 2
  } else if (layerId === 'chamber') {
    base.z += s * 6
    base.y += s * 8
  }
  return base
}

function LayerMeshes({
  layer,
  model,
  explode,
  envelopeSeparate,
  shellOpacity,
  chamberOpacity,
  showEnvelopeEdges,
  showEnvelopeLabels,
  selected,
  hovered,
  showLabels,
  onSelect,
  onHover,
  clippingPlanes,
}: {
  layer: LayerDef
  model: DesignModel
  explode: number
  envelopeSeparate: number
  shellOpacity: number
  chamberOpacity: number
  showEnvelopeEdges: boolean
  showEnvelopeLabels: boolean
  selected: boolean
  hovered: boolean
  showLabels: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
  clippingPlanes?: THREE.Plane[]
}) {
  const parts = useMemo(() => buildLayerPart(layer, model), [layer, model])
  const offset = useMemo(
    () => envelopeOffset(layer.id, explode, layer.explodeOffset, envelopeSeparate),
    [layer.id, layer.explodeOffset, explode, envelopeSeparate],
  )
  const edgeGeos = useMemo(
    () =>
      layer.id === 'shell' || layer.id === 'chamber'
        ? parts.map((p) => new THREE.EdgesGeometry(p.geometry, 18))
        : [],
    [parts, layer.id],
  )

  if (!layer.visible || layer.id === 'masonry' || layer.id === 'door') return null

  const isEnvelope = layer.id === 'shell' || layer.id === 'chamber'
  const envelopeLabel =
    layer.id === 'shell'
      ? '2 · Carcasa / camisa'
      : layer.id === 'chamber'
        ? '3 · Cámara de combustión'
        : null

  const showPartLabel =
    (showLabels || hovered) && !(showEnvelopeLabels && isEnvelope)

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
    <group position={offset}>
      {parts.map((part, i) => {
        let matKey: MaterialKey = layer.materialKey
        if (part.materialOverride === 'glass') matKey = 'glass'
        if (part.materialOverride === 'steel') matKey = 'steel'
        if (part.materialOverride === 'seal') matKey = 'insulation'

        const opacity =
          layer.id === 'shell'
            ? shellOpacity
            : layer.id === 'chamber'
              ? chamberOpacity
              : part.materialOverride === 'seal'
                ? 0.4
                : matKey === 'glass'
                  ? undefined
                  : 1

        const mat = createMaterial(matKey, {
          opacity: opacity ?? 1,
          transparent: (opacity !== undefined && opacity < 0.99) || matKey === 'glass',
          selected: selected || hovered,
          envelope: isEnvelope ? (layer.id as 'shell' | 'chamber') : undefined,
        })
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
            {...pointerProps}
          />
        )
      })}
      {showEnvelopeEdges &&
        isEnvelope &&
        edgeGeos.map((geo, i) => (
          <lineSegments
            key={`edge-${i}`}
            geometry={geo}
            position={parts[i]?.position}
            rotation={parts[i]?.rotation}
          >
            <lineBasicMaterial
              color={
                layer.id === 'shell' ? ENVELOPE_COLORS.shellEdge : ENVELOPE_COLORS.chamberEdge
              }
              transparent
              opacity={0.9}
            />
          </lineSegments>
        ))}
      {showEnvelopeLabels && envelopeLabel && parts[0] && (
        <Html
          position={
            parts[0].position.lengthSq() > 1
              ? parts[0].position.clone().add(new THREE.Vector3(0, 8, 0))
              : new THREE.Vector3(0, layer.id === 'shell' ? 38 : 22, 5)
          }
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`envelope-label ${layer.id}`}>{envelopeLabel}</span>
        </Html>
      )}
      {showPartLabel && parts[0] && (
        <Html
          position={
            parts[0].position.lengthSq() > 1
              ? parts[0].position.clone().add(new THREE.Vector3(0, 5, 0))
              : new THREE.Vector3(0, 25, 5)
          }
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`part-label${hovered && !showLabels ? ' hover' : ''}`}>
            {layer.name}
          </span>
        </Html>
      )}
    </group>
  )
}

export function InsertAssembly({
  model,
  explode,
  envelopeSeparate,
  shellOpacity,
  chamberOpacity,
  showEnvelopeEdges,
  showEnvelopeLabels,
  selectedId,
  hoveredId,
  showLabels,
  onSelect,
  onHover,
  clippingPlanes,
}: Props) {
  return (
    <group>
      {model.layers.map((layer) => (
        <LayerMeshes
          key={layer.id}
          layer={layer}
          model={model}
          explode={explode}
          envelopeSeparate={envelopeSeparate}
          shellOpacity={shellOpacity}
          chamberOpacity={chamberOpacity}
          showEnvelopeEdges={showEnvelopeEdges}
          showEnvelopeLabels={showEnvelopeLabels}
          selected={selectedId === layer.id}
          hovered={hoveredId === layer.id}
          showLabels={showLabels}
          onSelect={() => onSelect(layer.id)}
          onHover={(v) => onHover(v ? layer.id : null)}
          clippingPlanes={clippingPlanes}
        />
      ))}
      <DoorAssembly
        model={model}
        explode={explode}
        selected={selectedId === 'door'}
        hovered={hoveredId === 'door'}
        showLabels={showLabels}
        onSelect={() => onSelect('door')}
        onHover={(v) => onHover(v ? 'door' : null)}
        clippingPlanes={clippingPlanes}
      />
    </group>
  )
}
