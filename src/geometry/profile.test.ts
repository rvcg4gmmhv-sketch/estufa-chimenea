/**
 * Comprobaciones ligeras del perfil reconciliado (ejecutar con: npx tsx src/geometry/profile.test.ts)
 */
import { createDefaultFireplace } from '../config/model'
import { derivedInclineHorizontal, inclineLength } from '../config/validateModel'

const fp = createDefaultFireplace()
const sum = fp.lintelDepth + fp.throatDepth + derivedInclineHorizontal(fp)
const len = inclineLength(fp)

const checks: Array<[string, boolean]> = [
  ['10 + 13 + 26 = 49', Math.abs(sum - 49) < 1e-6],
  ['inclineHorizontal derivado = 26', derivedInclineHorizontal(fp) === 26],
  ['altura garganta 64 > boca 55', fp.throatHeight > fp.frontHeight],
  ['longitud inclinada ≈ 48.5', Math.abs(len - Math.sqrt(26 ** 2 + 41 ** 2)) < 1e-6],
  ['longitud inclinada cerca de 48', Math.abs(len - 48) < 1],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

if (failed) {
  console.error(`${failed} comprobación(es) fallaron`)
  process.exit(1)
}

console.log('Perfil reconciliado verificado.')
