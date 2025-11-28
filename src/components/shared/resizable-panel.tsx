'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ResizablePanelProps {
  children: [React.ReactNode, React.ReactNode]
  defaultSize?: number // percentage for top panel (0-100)
  minSize?: number // minimum percentage
  maxSize?: number // maximum percentage
}

export function ResizablePanel({
  children,
  defaultSize = 60,
  minSize = 20,
  maxSize = 80
}: ResizablePanelProps) {
  const [topSize, setTopSize] = useState(defaultSize)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      // Calculate new size as percentage
      const newSize = ((e.clientY - containerRect.top) / containerHeight) * 100

      // Apply constraints
      const constrainedSize = Math.min(Math.max(newSize, minSize), maxSize)
      setTopSize(constrainedSize)
    },
    [isDragging, minSize, maxSize]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Top Panel */}
      <div className="overflow-hidden" style={{ height: `${topSize}%` }}>
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        className="relative h-1 bg-slate-800 hover:bg-blue-500 cursor-ns-resize transition-colors group shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="overflow-hidden" style={{ height: `${100 - topSize}%` }}>
        {children[1]}
      </div>
    </div>
  )
}
