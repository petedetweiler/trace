import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tablerRoot = resolve(packageRoot, 'node_modules/@tabler/icons')
const tablerPackage = JSON.parse(await readFile(resolve(tablerRoot, 'package.json'), 'utf8'))
const iconPackage = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'))
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'icon-manifest.json'), 'utf8'))
const notices = await readFile(resolve(packageRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8')

if (iconPackage.license !== 'MIT') throw new Error('@traceflow/icons must remain MIT licensed.')
if (tablerPackage.license !== 'MIT') throw new Error('@tabler/icons must remain MIT licensed.')
if (tablerPackage.version !== '3.46.0') throw new Error('The audited Tabler version changed unexpectedly.')
if (!notices.includes(`Tabler Icons ${tablerPackage.version}`) || !notices.includes('MIT License')) {
  throw new Error('The Tabler version and MIT license must remain in THIRD_PARTY_NOTICES.md.')
}

const referencedNames = [
  ...manifest.essential,
  ...Object.values(manifest.aliases),
  ...Object.values(manifest.concepts),
]
if (referencedNames.some((name) => String(name).startsWith('brand-'))) {
  throw new Error('Brand and trademark icons must not enter Traceflow first-party packs.')
}

console.log(`Verified @traceflow/icons and Tabler Icons ${tablerPackage.version} as MIT licensed.`)
