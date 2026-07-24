/** Convención de ejes del visor (cm). Documentar en README. */
export const COORDINATES = {
  /** Ancho: positivo a la derecha visto de frente */
  x: 'ancho',
  /** Altura: positivo hacia arriba */
  y: 'altura',
  /** Profundidad: Z=0 en el plano frontal; positivo hacia el fondo */
  z: 'profundidad',
  unit: 'cm' as const,
  labels: {
    front: 'Frente',
    back: 'Fondo',
    hallway: 'Pasillo',
  },
} as const
