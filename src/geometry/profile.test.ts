/**
 * Comprobaciones ligeras del perfil reconciliado (ejecutar con: npx tsx src/geometry/profile.test.ts)
 */
import { createDefaultFireplace, createDefaultModel } from '../config/model'
import { derivedInclineHorizontal, inclineLength } from '../config/validateModel'
import {
  chamferedSideProfile,
  loftZyProfileTapered,
  pieceWidthAtZ,
  widthAtZ,
} from './insertBounds'

const fp = createDefaultFireplace()
const sum = fp.lintelDepth + fp.throatDepth + derivedInclineHorizontal(fp)
const len = inclineLength(fp)
const model = createDefaultModel()
const fit = model.insertFit
const shellProfile = chamferedSideProfile(fp, fit, 0)
const zBack = fp.depth - fit.rearClearance
const shellBackW = pieceWidthAtZ(fp, fit, zBack, 0)
const cavityBackW = fp.backWidth

const checks: Array<[string, boolean]> = [
  ['10 + 13 + 26 = 49', Math.abs(sum - 49) < 1e-6],
  ['inclineHorizontal derivado = 26', derivedInclineHorizontal(fp) === 26],
  ['altura garganta 64 > boca 55', fp.throatHeight > fp.frontHeight],
  ['longitud inclinada ≈ 48.5', Math.abs(len - Math.sqrt(26 ** 2 + 41 ** 2)) < 1e-6],
  ['longitud inclinada cerca de 48', Math.abs(len - 48) < 1],
  ['carcasa fondo < cavidad fondo', shellBackW < cavityBackW - 0.5],
  [
    'carcasa frente ≤ cavidad frente − holguras',
    pieceWidthAtZ(fp, fit, fit.frontSetback, 0) <= fp.frontWidth - fit.sideClearance * 2 + 1e-6,
  ],
  [
    'widthAtZ fondo = back − clearances',
    Math.abs(widthAtZ(fp, fit, zBack) - (fp.backWidth - fit.sideClearance * 2)) < 1e-6,
  ],
]

const loft = loftZyProfileTapered(shellProfile, (z) => pieceWidthAtZ(fp, fit, z, 0))
checks.push(['loft carcasa tiene vértices', (loft.getAttribute('position')?.count ?? 0) > 8])

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

if (failed) {
  console.error(`${failed} comprobación(es) fallaron`)
  process.exit(1)
}

console.log(
  `Perfil reconciliado verificado. Carcasa fondo=${shellBackW.toFixed(1)} cm < cavidad fondo=${cavityBackW} cm`,
)
