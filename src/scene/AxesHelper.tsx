import { Html } from '@react-three/drei'

export function SceneAxes() {
  return (
    <group>
      <axesHelper args={[20]} />
      <Html position={[22, 0, 0]} style={{ pointerEvents: 'none' }}>
        <span className="axis-label">X ancho</span>
      </Html>
      <Html position={[0, 22, 0]} style={{ pointerEvents: 'none' }}>
        <span className="axis-label">Y alto</span>
      </Html>
      <Html position={[0, 0, 22]} style={{ pointerEvents: 'none' }}>
        <span className="axis-label">Z fondo</span>
      </Html>
      <Html position={[0, -6, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="axis-label">Frente (Z=0)</span>
      </Html>
      <Html position={[40, 20, 20]} style={{ pointerEvents: 'none' }}>
        <span className="axis-label">Pasillo →</span>
      </Html>
    </group>
  )
}
