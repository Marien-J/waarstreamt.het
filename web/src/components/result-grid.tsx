import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate } from '@tanstack/react-router'
import type { Title } from '@/lib/data'
import { TitleCard } from './title-card'

interface ResultGridProps {
  titles: Title[]
}

function getColumnCount(width: number): number {
  if (width < 480) return 3
  if (width < 768) return 4
  if (width < 1024) return 5
  if (width < 1400) return 7
  if (width < 1800) return 9
  return 11
}

export function ResultGrid({ titles }: ResultGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [columns, setColumns] = useState(7)
  const [rowHeight, setRowHeight] = useState(220)

  // Recalculate columns on resize
  useEffect(() => {
    function updateLayout() {
      const width = parentRef.current?.clientWidth ?? window.innerWidth
      const cols = getColumnCount(width)
      setColumns(cols)
      // Each cell: width/cols, aspect 2/3 → height = (width/cols) * 1.5, plus 8px gap
      const cellWidth = (width - 16 - (cols - 1) * 8) / cols
      setRowHeight(Math.round(cellWidth * 1.5) + 8)
    }
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  const rowCount = Math.ceil(titles.length / columns)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  })

  const handleTitleClick = (title: Title) => {
    navigate({ to: '/title/$id', params: { id: title.jw_entry_id } })
  }

  if (titles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <svg className="w-16 h-16 text-[var(--muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No results found</h3>
        <p className="text-[var(--muted)]">Try adjusting your filters or search term</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
          padding: '8px',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columns
          const rowTitles = titles.slice(startIdx, startIdx + columns)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 8,
                right: 8,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: '8px',
              }}
            >
              {rowTitles.map((title) => (
                <TitleCard
                  key={title.jw_entry_id}
                  title={title}
                  onClick={() => handleTitleClick(title)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
