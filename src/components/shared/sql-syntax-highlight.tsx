'use client'

import { Highlight, themes } from 'prism-react-renderer'

interface SqlSyntaxHighlightProps {
  code: string
  className?: string
}

export function SqlSyntaxHighlight({
  code,
  className
}: SqlSyntaxHighlightProps) {
  // Code-block card background is always white in this UI — use light token
  // palette to keep contrast readable in both light and dark theme modes.
  return (
    <Highlight theme={themes.nightOwlLight} code={code} language="sql">
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
