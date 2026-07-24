import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '../state/useViewerStore'

const LOOK_AT = new THREE.Vector3(0, 28, 22)
const { ACTION } = CameraControlsImpl

const PRESETS: Record<string, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  front: {
    position: new THREE.Vector3(0, 32, -120),
    target: LOOK_AT.clone(),
  },
  side: {
    position: new THREE.Vector3(120, 32, 22),
    target: LOOK_AT.clone(),
  },
  top: {
    position: new THREE.Vector3(0, 150, 24),
    target: LOOK_AT.clone(),
  },
  iso: {
    position: new THREE.Vector3(95, 72, -95),
    target: LOOK_AT.clone(),
  },
  reset: {
    position: new THREE.Vector3(95, 72, -95),
    target: LOOK_AT.clone(),
  },
}

/** Controles suaves: orbitar, pan y dolly con damping y botones externos. */
export function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const { gl } = useThree()
  const cameraView = useViewerStore((s) => s.cameraView)
  const cameraNonce = useViewerStore((s) => s.cameraNonce)
  const cameraAction = useViewerStore((s) => s.cameraAction)
  const cameraActionNonce = useViewerStore((s) => s.cameraActionNonce)

  useEffect(() => {
    const el = gl.domElement
    const prevent = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', prevent, { passive: false })
    return () => el.removeEventListener('wheel', prevent)
  }, [gl])

  useEffect(() => {
    const c = controls.current
    if (!c || !cameraView) return
    const preset = PRESETS[cameraView] ?? PRESETS.iso
    const { position: p, target: t } = preset
    void c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true)
  }, [cameraView, cameraNonce])

  useEffect(() => {
    const c = controls.current
    if (!c || !cameraAction) return
    if (cameraAction === 'zoomIn') {
      void c.dolly(20, true)
    } else if (cameraAction === 'zoomOut') {
      void c.dolly(-24, true)
    } else if (cameraAction === 'fit') {
      const p = PRESETS.iso.position
      const t = PRESETS.iso.target
      void c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true)
    } else if (cameraAction === 'orbitLeft') {
      void c.rotate(-Math.PI / 10, 0, true)
    } else if (cameraAction === 'orbitRight') {
      void c.rotate(Math.PI / 10, 0, true)
    } else if (cameraAction === 'orbitUp') {
      void c.rotate(0, -Math.PI / 14, true)
    } else if (cameraAction === 'orbitDown') {
      void c.rotate(0, Math.PI / 14, true)
    }
  }, [cameraAction, cameraActionNonce])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      mouseButtons={{
        left: ACTION.ROTATE,
        middle: ACTION.TRUCK,
        right: ACTION.TRUCK,
        wheel: ACTION.DOLLY,
      }}
      touches={{
        one: ACTION.TOUCH_ROTATE,
        two: ACTION.TOUCH_DOLLY_TRUCK,
        three: ACTION.TOUCH_TRUCK,
      }}
      minDistance={18}
      maxDistance={320}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.48}
      dollySpeed={0.9}
      truckSpeed={1.6}
      azimuthRotateSpeed={0.7}
      polarRotateSpeed={0.6}
      smoothTime={0.25}
      draggingSmoothTime={0.15}
      restThreshold={0.01}
      infinityDolly={false}
    />
  )
}
