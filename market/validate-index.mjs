/**
 * Validate market/index.json with the same validator DSH uses.
 *
 * Usage: node market/validate-index.mjs [indexFile]
 *
 * The validator ships inside the DSH installation, so point DSH_INSTALL_DIR at it
 * when the environment does not already export it. Inside the Desktop app the
 * package lives in app.asar, so run this script with the DSH Electron binary and
 * ELECTRON_RUN_AS_NODE=1, for example:
 *
 *   $env:ELECTRON_RUN_AS_NODE = '1'
 *   & $env:DSH_NODE_EXECUTABLE market/validate-index.mjs
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const indexFile = process.argv[2] ?? join(HERE, 'index.json')
const installDir = process.env.DSH_INSTALL_DIR
if (!installDir) throw new Error('DSH_INSTALL_DIR is not set; point it at the installed @deepseek-ai/dsh package directory')

const validatorPath = createRequire(join(installDir, 'package.json')).resolve('@deepseek-ai/dsh-plugin-market-index')
const { parseMarketIndex } = createRequire(import.meta.url)(validatorPath)

const document = JSON.parse(readFileSync(indexFile, 'utf8'))
/** Any absolute https URL works as the base; a relative icon reference is resolved against it. */
const parsed = parseMarketIndex(document, 'https://example.com/plugin-index.json')

console.log(`valid format ${parsed.format}: ${String(parsed.plugins.length)} plugin(s) in ${indexFile}`)
for (const plugin of parsed.plugins) {
  const versions = plugin.versions.map((version) => version.version).join(', ')
  console.log(`  ${plugin.name}  versions: ${versions}`)
}
