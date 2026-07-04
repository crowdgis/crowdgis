/**
 * German UI terms and their Chinese explanations, shown only inside the
 * glossary sidebar panel (see `GlossaryPanel.tsx`).
 */
export interface GlossaryEntry {
  de: string
  zh: string
  category: string
}

export const GLOSSARY_CATEGORIES = [
  'Karte & Ebenen',
  'Werkzeuge',
  'Daten',
  'Feature-Wünsche',
] as const

export const GLOSSARY: GlossaryEntry[] = [
  // Karte & Ebenen
  { de: 'Ebenen', zh: '图层：地图上已加载的数据层列表', category: 'Karte & Ebenen' },
  { de: 'Basiskarten', zh: '底图：可切换的背景地图样式', category: 'Karte & Ebenen' },
  { de: 'Basiskarte', zh: '底图', category: 'Karte & Ebenen' },
  { de: 'Basiskarte wählen', zh: '选择底图', category: 'Karte & Ebenen' },
  { de: 'Koordinatenanzeige', zh: '坐标显示', category: 'Karte & Ebenen' },
  { de: 'WGS84', zh: 'WGS84：世界通用经纬度坐标', category: 'Karte & Ebenen' },
  { de: 'LV95', zh: 'LV95：瑞士国家坐标系', category: 'Karte & Ebenen' },
  { de: 'Auf Ebene zoomen', zh: '缩放到该图层的范围', category: 'Karte & Ebenen' },
  { de: 'Ebene entfernen', zh: '删除该图层', category: 'Karte & Ebenen' },

  // Werkzeuge
  { de: 'Skizzieren', zh: '绘制：在地图上手绘点、线、面', category: 'Werkzeuge' },
  { de: 'Messen', zh: '测量：计算距离或面积', category: 'Werkzeuge' },
  { de: 'Messungen', zh: '测量结果列表', category: 'Werkzeuge' },
  { de: 'Puffer', zh: '缓冲区：围绕图层生成指定距离的区域', category: 'Werkzeuge' },
  { de: 'Puffer erstellen', zh: '创建缓冲区', category: 'Werkzeuge' },
  { de: 'Ebene für Puffer wählen', zh: '选择用于生成缓冲区的图层', category: 'Werkzeuge' },
  { de: 'Pufferabstand in Metern', zh: '缓冲距离（米）', category: 'Werkzeuge' },
  { de: 'Farbe', zh: '颜色', category: 'Werkzeuge' },
  { de: 'Linienstärke', zh: '线宽', category: 'Werkzeuge' },
  { de: 'Textmarker setzen', zh: '放置文字标注', category: 'Werkzeuge' },
  { de: 'Beschriftung anhängen', zh: '将标注附加到已有对象', category: 'Werkzeuge' },
  { de: 'Rückgängig', zh: '撤销上一步', category: 'Werkzeuge' },
  { de: 'Wiederholen', zh: '重做（恢复撤销的操作）', category: 'Werkzeuge' },
  { de: 'Fertig', zh: '完成', category: 'Werkzeuge' },
  { de: 'Als GeoJSON exportieren', zh: '导出为 GeoJSON 文件', category: 'Werkzeuge' },
  { de: 'Alle löschen', zh: '删除所有绘制对象', category: 'Werkzeuge' },
  { de: 'PNG (nur Zeichnung)', zh: '导出 PNG（仅包含绘制内容）', category: 'Werkzeuge' },
  { de: 'PNG (ganze Karte)', zh: '导出 PNG（整张地图）', category: 'Werkzeuge' },

  // Daten
  { de: 'Daten', zh: '数据', category: 'Daten' },
  { de: 'Daten laden', zh: '加载本地地理数据文件', category: 'Daten' },
  { de: 'Attributtabelle', zh: '属性表：图层对象的数据表格', category: 'Daten' },
  { de: 'Attributtabelle öffnen', zh: '打开属性表', category: 'Daten' },
  { de: 'Attributtabelle schliessen', zh: '关闭属性表', category: 'Daten' },

  // Feature-Wünsche
  { de: 'Feature-Wünsche', zh: '功能需求：学生提交与投票的功能建议', category: 'Feature-Wünsche' },
  { de: 'Neuer Wunsch', zh: '提交新的功能需求', category: 'Feature-Wünsche' },
  { de: 'Board', zh: '需求看板：所有功能需求的总览', category: 'Feature-Wünsche' },
  { de: 'Schliessen', zh: '关闭', category: 'Feature-Wünsche' },
  { de: 'Upvoten', zh: '点赞支持该需求', category: 'Feature-Wünsche' },
  { de: 'Titel', zh: '标题', category: 'Feature-Wünsche' },
  { de: 'Beschreibung', zh: '描述', category: 'Feature-Wünsche' },
  { de: 'Kürzel (öffentlich)', zh: '昵称（公开显示）', category: 'Feature-Wünsche' },
  { de: 'Kurscode', zh: '课程代码', category: 'Feature-Wünsche' },
  { de: 'ZHAW-E-Mail (bleibt privat)', zh: 'ZHAW 邮箱（保密，不公开）', category: 'Feature-Wünsche' },
  { de: 'Ergänzung (optional)', zh: '补充说明（可选）', category: 'Feature-Wünsche' },
  { de: 'Rückfrage des Agenten', zh: '助手提出的澄清问题', category: 'Feature-Wünsche' },
  { de: 'Verlauf', zh: '历史记录', category: 'Feature-Wünsche' },
]

export const GLOSSARY_MAP: Map<string, GlossaryEntry> = new Map(
  GLOSSARY.map((entry) => [entry.de, entry]),
)
