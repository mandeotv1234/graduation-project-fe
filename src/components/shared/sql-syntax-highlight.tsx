'use client'

import { Highlight, themes } from 'prism-react-renderer'
import { useTheme } from 'next-themes'

interface SqlSyntaxHighlightProps {
  code: string
  className?: string
}

export function SqlSyntaxHighlight({
  code,
  className
}: SqlSyntaxHighlightProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark'

  return (
    <Highlight
      theme={isDark ? themes.nightOwl : themes.nightOwlLight}
      code={code}
      language="sql"
    >
      {({ style, tokens, getLineProps, getTokenProps }) => {
        const { fontFamily, fontSize, ...themeStyle } = style
        void fontFamily
        void fontSize

        return (
          <pre
            className={className}
            style={{
              ...themeStyle,
              margin: 0,
              background: 'transparent',
              display: 'table',
              width: '100%'
            }}
          >
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line })}
                style={{ display: 'table-row' }}
              >
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
                  {i + 1}
                </span>
                <span style={{ display: 'table-cell' }}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )
      }}
    </Highlight>
  )
}
