import type { FeatureModule } from '../types'
import { GlossaryPanel } from './GlossaryPanel'
import { GlossaryTooltip } from './GlossaryTooltip'

const chineseGlossaryFeature: FeatureModule = {
  id: 'chinese-glossary',
  label: 'Chinesisches Glossar',
  SidebarPanel: GlossaryPanel,
  Overlay: GlossaryTooltip,
}

export default chineseGlossaryFeature
