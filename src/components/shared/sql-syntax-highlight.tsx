'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'

interface SqlSyntaxHighlightProps {
  code: string
  className?: string
}

type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'identifier'
  | 'whitespace'

interface Token {
  value: string
  kind: TokenKind
}

const SQL_KEYWORDS = new Set([
  'ADD',
  'ALTER',
  'AND',
  'AS',
  'ASC',
  'BEGIN',
  'BETWEEN',
  'BY',
  'CASE',
  'CHECK',
  'COMMIT',
  'COUNT',
  'CREATE',
  'CROSS',
  'CTE',
  'CURRENT',
  'DATABASE',
  'DEFAULT',
  'DELETE',
  'DESC',
  'DISTINCT',
  'DROP',
  'ELSE',
  'END',
  'EXEC',
  'EXISTS',
  'FROM',
  'FULL',
  'FUNCTION',
  'GROUP',
  'HAVING',
  'IF',
  'IN',
  'INDEX',
  'INNER',
  'INSERT',
  'INTO',
  'IS',
  'JOIN',
  'KEY',
  'LEFT',
  'LIKE',
  'LIMIT',
  'MAX',
  'MERGE',
  'MIN',
  'NOT',
  'NULL',
  'ON',
  'OR',
  'ORDER',
  'OUTER',
  'OVER',
  'PARTITION',
  'PRIMARY',
  'PROCEDURE',
  'RAISERROR',
  'REFERENCES',
  'RETURN',
  'RIGHT',
  'ROLLBACK',
  'ROW_NUMBER',
  'SELECT',
  'SET',
  'SUM',
  'TABLE',
  'THEN',
  'TOP',
  'TRIGGER',
  'UNION',
  'UNIQUE',
  'UPDATE',
  'VALUES',
  'VIEW',
  'WHEN',
  'WHERE',
  'WITH'
])

function tokenizeSqlLine(line: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < line.length) {
    const remaining = line.slice(index)

    const commentMatch = remaining.match(/^--.*/)
    if (commentMatch) {
      tokens.push({ value: commentMatch[0], kind: 'comment' })
      break
    }

    const whitespaceMatch = remaining.match(/^\s+/)
    if (whitespaceMatch) {
      tokens.push({ value: whitespaceMatch[0], kind: 'whitespace' })
      index += whitespaceMatch[0].length
      continue
    }

    const stringMatch = remaining.match(/^N?'(?:''|[^'])*'/)
    if (stringMatch) {
      tokens.push({ value: stringMatch[0], kind: 'string' })
      index += stringMatch[0].length
      continue
    }

    const numberMatch = remaining.match(/^\b\d+(?:\.\d+)?\b/)
    if (numberMatch) {
      tokens.push({ value: numberMatch[0], kind: 'number' })
      index += numberMatch[0].length
      continue
    }

    const operatorMatch = remaining.match(/^[()[\],.;=*<>+\-/]+/)
    if (operatorMatch) {
      tokens.push({ value: operatorMatch[0], kind: 'operator' })
      index += operatorMatch[0].length
      continue
    }

    const wordMatch = remaining.match(/^[A-Za-z_][A-Za-z0-9_$]*/)
    if (wordMatch) {
      const value = wordMatch[0]
      tokens.push({
        value,
        kind: SQL_KEYWORDS.has(value.toUpperCase()) ? 'keyword' : 'identifier'
      })
      index += value.length
      continue
    }

    tokens.push({ value: remaining[0], kind: 'identifier' })
    index += 1
  }

  return tokens
}

function tokenColor(kind: TokenKind, isDark: boolean): string | undefined {
  switch (kind) {
    case 'keyword':
      return isDark ? '#7dd3fc' : '#0f766e'
    case 'string':
      return isDark ? '#86efac' : '#166534'
    case 'number':
      return isDark ? '#f9a8d4' : '#be185d'
    case 'comment':
      return isDark ? '#94a3b8' : '#64748b'
    case 'operator':
      return isDark ? '#fcd34d' : '#92400e'
    default:
      return undefined
  }
}

export function SqlSyntaxHighlight({
  code,
  className
}: SqlSyntaxHighlightProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark'

  const lines = useMemo(() => code.split(/\r?\n/), [code])

  return (
    <pre
      className={className}
      style={{
        margin: 0,
        background: 'transparent',
        display: 'table',
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {lines.map((line, lineIndex) => {
        const tokens = tokenizeSqlLine(line)

        return (
          <div key={lineIndex} style={{ display: 'table-row' }}>
            <span
              style={{
                display: 'table-cell',
                userSelect: 'none',
                textAlign: 'right',
                paddingRight: '16px',
                minWidth: '2.5em',
                color: '#9CA3AF',
                opacity: 0.7
              }}
            >
              {lineIndex + 1}
            </span>
            <span style={{ display: 'table-cell' }}>
              {tokens.length > 0 ? (
                tokens.map((token, tokenIndex) => (
                  <span
                    key={`${lineIndex}-${tokenIndex}-${token.value}`}
                    style={{
                      color: tokenColor(token.kind, isDark),
                      fontStyle: token.kind === 'comment' ? 'italic' : 'normal',
                      fontWeight:
                        token.kind === 'keyword' || token.kind === 'operator'
                          ? 600
                          : 400
                    }}
                  >
                    {token.value}
                  </span>
                ))
              ) : (
                <span>{line}</span>
              )}
            </span>
          </div>
        )
      })}
    </pre>
  )
}
