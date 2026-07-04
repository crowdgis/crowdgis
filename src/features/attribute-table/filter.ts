import type { Feature } from 'geojson'

type CompOp = '=' | '!=' | '<' | '<=' | '>' | '>='

type Literal =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }

type FilterNode =
  | { type: 'and'; left: FilterNode; right: FilterNode }
  | { type: 'or'; left: FilterNode; right: FilterNode }
  | { type: 'comparison'; field: string; op: CompOp; value: Literal }

type Token =
  | { kind: 'ident'; value: string }
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'null' }
  | { kind: 'op'; value: CompOp }
  | { kind: 'and' }
  | { kind: 'or' }
  | { kind: 'lparen' }
  | { kind: 'rparen' }

const TOKEN_RE =
  /\s*(?:'([^']*)'|"([^"]*)"|(-?\d+(?:\.\d+)?)|(<=|>=|!=|<>|=|<|>|\(|\))|([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)|(\S))/g

function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  TOKEN_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TOKEN_RE.exec(expression))) {
    const [, sq, dq, num, op, word, junk] = match
    if (junk !== undefined) {
      throw new Error(`Unerwartetes Zeichen: "${junk}"`)
    } else if (sq !== undefined || dq !== undefined) {
      tokens.push({ kind: 'str', value: sq ?? dq })
    } else if (num !== undefined) {
      tokens.push({ kind: 'num', value: Number(num) })
    } else if (op !== undefined) {
      if (op === '(') tokens.push({ kind: 'lparen' })
      else if (op === ')') tokens.push({ kind: 'rparen' })
      else tokens.push({ kind: 'op', value: op === '<>' ? '!=' : (op as CompOp) })
    } else if (word !== undefined) {
      const upper = word.toUpperCase()
      if (upper === 'AND') tokens.push({ kind: 'and' })
      else if (upper === 'OR') tokens.push({ kind: 'or' })
      else if (upper === 'TRUE') tokens.push({ kind: 'bool', value: true })
      else if (upper === 'FALSE') tokens.push({ kind: 'bool', value: false })
      else if (upper === 'NULL') tokens.push({ kind: 'null' })
      else tokens.push({ kind: 'ident', value: word })
    }
  }
  return tokens
}

/**
 * Parses a small SQL-like WHERE expression, e.g. `bewohner > 100 AND jahr = 2020`.
 * Supports =, !=, <>, <, <=, >, >=, AND/OR and parentheses for grouping.
 */
export function parseFilter(expression: string): FilterNode {
  const tokens = tokenize(expression)
  if (tokens.length === 0) throw new Error('Leerer Filter')
  let pos = 0
  const peek = () => tokens[pos]
  const consume = () => tokens[pos++]

  function parseOr(): FilterNode {
    let node = parseAnd()
    while (peek()?.kind === 'or') {
      consume()
      node = { type: 'or', left: node, right: parseAnd() }
    }
    return node
  }

  function parseAnd(): FilterNode {
    let node = parsePrimary()
    while (peek()?.kind === 'and') {
      consume()
      node = { type: 'and', left: node, right: parsePrimary() }
    }
    return node
  }

  function parsePrimary(): FilterNode {
    if (peek()?.kind === 'lparen') {
      consume()
      const node = parseOr()
      if (peek()?.kind !== 'rparen') throw new Error('Schliessende Klammer fehlt')
      consume()
      return node
    }
    return parseComparison()
  }

  function parseComparison(): FilterNode {
    const field = consume()
    if (!field || field.kind !== 'ident') throw new Error('Feldname erwartet')
    const op = consume()
    if (!op || op.kind !== 'op')
      throw new Error(`Vergleichsoperator erwartet nach "${field.value}"`)
    const literal = consume()
    if (!literal) throw new Error('Wert erwartet')
    let value: Literal
    if (literal.kind === 'str') value = { type: 'string', value: literal.value }
    else if (literal.kind === 'num') value = { type: 'number', value: literal.value }
    else if (literal.kind === 'bool') value = { type: 'boolean', value: literal.value }
    else if (literal.kind === 'null') value = { type: 'null' }
    else throw new Error('Wert erwartet')
    return { type: 'comparison', field: field.value, op: op.value, value }
  }

  const result = parseOr()
  if (pos < tokens.length) throw new Error('Unerwartete Zeichen am Ende des Filters')
  return result
}

function looseEquals(propValue: unknown, literal: Literal): boolean {
  if (literal.type === 'null') return propValue === null || propValue === undefined
  if (literal.type === 'boolean') return propValue === literal.value
  if (literal.type === 'number') {
    const num = typeof propValue === 'number' ? propValue : Number(propValue)
    return !Number.isNaN(num) && num === literal.value
  }
  return propValue !== null && propValue !== undefined && String(propValue) === literal.value
}

function evaluateComparison(propValue: unknown, op: CompOp, literal: Literal): boolean {
  if (op === '=' || op === '!=') {
    const equal = looseEquals(propValue, literal)
    return op === '=' ? equal : !equal
  }
  const left = typeof propValue === 'number' ? propValue : Number(propValue)
  const right = literal.type === 'number' ? literal.value : Number('value' in literal ? literal.value : NaN)
  if (Number.isNaN(left) || Number.isNaN(right)) return false
  switch (op) {
    case '<':
      return left < right
    case '<=':
      return left <= right
    case '>':
      return left > right
    case '>=':
      return left >= right
  }
}

function evaluateNode(node: FilterNode, properties: Record<string, unknown>): boolean {
  switch (node.type) {
    case 'and':
      return evaluateNode(node.left, properties) && evaluateNode(node.right, properties)
    case 'or':
      return evaluateNode(node.left, properties) || evaluateNode(node.right, properties)
    case 'comparison':
      return evaluateComparison(properties[node.field], node.op, node.value)
  }
}

/**
 * Filters features by a WHERE-style expression. An empty expression returns
 * all features unchanged; an invalid one returns no features plus an error
 * message meant for display next to the filter input.
 */
export function applyFilter(
  features: Feature[],
  expression: string,
): { features: Feature[]; error: string | null } {
  const trimmed = expression.trim()
  if (!trimmed) return { features, error: null }

  let node: FilterNode
  try {
    node = parseFilter(trimmed)
  } catch (e) {
    return { features: [], error: e instanceof Error ? e.message : 'Ungültiger Filter' }
  }

  return {
    features: features.filter((f) => evaluateNode(node, f.properties ?? {})),
    error: null,
  }
}
