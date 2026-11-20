/**
 * Build the format-1 plugin market index for this package.
 *
 * Usage: node market/build-index.mjs
 *
 * Reads package.json, locale/en.json, locale/zh.json and icon.svg from the package
 * root, keeps the versions already listed in market/index.json, prepends the
 * current version, and writes market/index.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MARKET_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = dirname(MARKET_DIR)
const INDEX_FILE = join(MARKET_DIR, 'index.json')

/** Index identity; edit these two when you publish under your own name. */
const INDEX_TITLE = { en: "John Xiao's DSH plugins", zh: 'John Xiao 的 DSH 插件' }
const INDEX_DESCRIPTION = {
  en: 'Notifications and small conveniences for DeepSeek Harness.',
  zh: 'DeepSeek Harness 的通知与小工具。',
}

const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const pkg = readJson('package.json')
const metaEn = readJson('locale/en.json').meta
const metaZh = readJson('locale/zh.json').meta
const iconSvg = readFileSync(join(ROOT, 'icon.svg'))

if (!pkg.engines?.dsh) throw new Error('package.json needs engines.dsh so the market can show compatibility')
if (!metaEn?.title || !metaEn?.description) throw new Error('locale/en.json needs meta.title and meta.description')

/** Keep the published history of this plugin so older versions stay installable. */
const previous = existsSync(INDEX_FILE) ? JSON.parse(readFileSync(INDEX_FILE, 'utf8')) : undefined
const previousEntry = previous?.plugins?.find((plugin) => plugin.name === pkg.name)
const previousVersions = (previousEntry?.versions ?? []).filter((version) => version.version !== pkg.version)

const entry = {
  name: pkg.name,
  title: { en: metaEn.title, zh: metaZh?.title ?? metaEn.title },
  description: { en: metaEn.description, zh: metaZh?.description ?? metaEn.description },
  icon: `data:image/svg+xml;base64,${iconSvg.toString('base64')}`,
  ...(typeof pkg.author === 'string' ? { author: pkg.author } : {}),
  metadata: {
    category: 'interface',
    labels: [],
    keywords: Array.isArray(pkg.keywords) ? pkg.keywords : [],
  },
  versions: [
    {
      version: pkg.version,
      publishTimestamp: Math.floor(Date.now() / 1000),
      source: { type: 'npm' },
      engines: { dsh: pkg.engines.dsh },
    },
    ...previousVersions,
  ],
}

const index = {
  format: 1,
  title: INDEX_TITLE,
  description: INDEX_DESCRIPTION,
  metadata: {
    categories: { interface: { title: { en: 'Interface', zh: '介面与布局' } } },
    labels: {},
  },
  plugins: [entry, ...(previous?.plugins ?? []).filter((plugin) => plugin.name !== pkg.name)],
}

writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`wrote ${INDEX_FILE}`)
console.log(`  ${pkg.name}@${pkg.version}  versions listed: ${String(entry.versions.length)}`)
