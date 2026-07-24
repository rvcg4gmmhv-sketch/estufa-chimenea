import { Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import type { FireplaceDimensions } from '../config/modelSchema'

interface Props {
  fireplace: FireplaceDimensions
  visible: boolean
}

function DimLabel({
  position,
  text,
}: {
  position: [number, number, number]
  text: string
}) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <span className="dim-label">{text}</span>
    </Html>
  )
}

/** Overlay de cotas principales de la cavidad. */
export function DimensionOverlays({ fireplace: fp, visible }: Props) {
  const lines = useMemo(() => {
    const zT = fp.lintelDepth + fp.throatDepth
    return {
      frontWidth: [
        [-fp.frontWidth / 2, -3, 0],
        [fp.frontWidth / 2, -3, 0],
      ] as [[number, number, number], [number, number, number]],
      depth: [
        [fp.frontWidth / 2 + 4, -3, 0],
        [fp.frontWidth / 2 + 4, -3, fp.depth],
      ] as [[number, number, number], [number, number, number]],
      frontHeight: [
        [-fp.frontWidth / 2 - 4, 0, 0],
        [-fp.frontWidth / 2 - 4, fp.frontHeight, 0],
      ] as [[number, number, number], [number, number, number]],
      throatHeight: [
        [fp.backWidth / 2 + 6, 0, zT],
        [fp.backWidth / 2 + 6, fp.throatHeight, zT],
      ] as [[number, number, number], [number, number, number]],
      backWall: [
        [fp.backWidth / 2 + 3, 0, fp.depth],
        [fp.backWidth / 2 + 3, fp.backWallHeight, fp.depth],
      ] as [[number, number, number], [number, number, number]],
    }
  }, [fp])

  if (!visible) return null

  return (
    <group>
      <Line points={lines.frontWidth} color="#6b7280" lineWidth={1} />
      <DimLabel position={[0, -5, 0]} text={`${fp.frontWidth} cm`} />
      <Line points={lines.depth} color="#6b7280" lineWidth={1} />
      <DimLabel
        position={[fp.frontWidth / 2 + 8, -5, fp.depth / 2]}
        text={`${fp.depth} cm`}
      />
      <Line points={lines.frontHeight} color="#6b7280" lineWidth={1} />
      <DimLabel
        position={[-fp.frontWidth / 2 - 8, fp.frontHeight / 2, 0]}
        text={`${fp.frontHeight} cm`}
      />
      <Line points={lines.throatHeight} color="#6b7280" lineWidth={1} />
      <DimLabel
        position={[fp.backWidth / 2 + 12, fp.throatHeight / 2, fp.lintelDepth + fp.throatDepth]}
        text={`${fp.throatHeight} cm`}
      />
      <Line points={lines.backWall} color="#6b7280" lineWidth={1} />
      <DimLabel
        position={[fp.backWidth / 2 + 8, fp.backWallHeight / 2, fp.depth]}
        text={`${fp.backWallHeight} cm`}
      />
      <DimLabel
        position={[0, fp.throatHeight + 4, fp.lintelDepth + fp.throatDepth / 2]}
        text={`garganta ${fp.throatDepth} cm`}
      />
      <DimLabel
        position={[-fp.backWidth / 2 - 6, 4, fp.depth]}
        text={`fondo ${fp.backWidth} cm`}
      />
    </group>
  )
}
