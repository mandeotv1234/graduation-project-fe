'use client'

import { useEffect, useState } from 'react'
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
  // Guard against SSR/hydration mismatch — theme is undefined on server.
  // Render light theme on first paint, switch after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted && currentTheme !== 'light'

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
              background: 'transparent'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )
      }}
    </Highlight>
  )
}
