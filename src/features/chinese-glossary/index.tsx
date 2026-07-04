import type { FeatureModule } from '../types'
import { GlossaryPanel } from './GlossaryPanel'

const chineseGlossaryFeature: FeatureModule = {
  id: 'chinese-glossary',
  label: 'Chinesisches Glossar',
  SidebarPanel: GlossaryPanel,
}

export default chineseGlossaryFeature
