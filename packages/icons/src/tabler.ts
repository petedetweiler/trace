import { TABLER_VERSION, tablerCatalog, tablerIcons } from './generated/tabler'
import type { IconPack } from './types'

export type { IconCatalogEntry, IconDefinition, IconElement, IconPack, IconRegistry } from './types'
export { TABLER_VERSION, tablerCatalog, tablerIcons } from './generated/tabler'

export const tablerIconPack: IconPack = {
  prefix: 'tabler',
  name: 'Tabler Icons',
  version: TABLER_VERSION,
  license: 'MIT',
  icons: tablerIcons,
  catalog: tablerCatalog,
}
