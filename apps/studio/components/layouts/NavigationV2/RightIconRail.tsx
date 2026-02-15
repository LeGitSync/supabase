import { Bell, Bot, CircleHelp, Database, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { cn } from 'ui'

type RailItem = {
  label: string
  icon: LucideIcon
}

const rightRailItems: RailItem[] = [
  { label: 'AI', icon: Bot },
  { label: 'SQL', icon: Database },
  { label: 'Alerts', icon: Bell },
  { label: 'Help', icon: CircleHelp },
]

export function RightIconRail({
  activeItemLabel,
  onSelect,
}: {
  activeItemLabel: string | null
  onSelect: (label: string) => void
}) {
  return (
    <aside className="bg-dash-sidebar text-foreground-lighter border-default flex w-12 border-l">
      <nav className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
        {rightRailItems.map((item) => {
          const isActive = activeItemLabel === item.label

          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              onClick={() => onSelect(item.label)}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-md transition-colors',
                isActive
                  ? 'bg-surface-200 text-foreground'
                  : 'hover:bg-surface-200 hover:text-foreground'
              )}
            >
              <item.icon className="size-4" />
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export function RightRailLayout({ children }: { children: ReactNode }) {
  const [activeItemLabel, setActiveItemLabel] = useState<string | null>(null)

  const activeItem = useMemo(
    () => rightRailItems.find((item) => item.label === activeItemLabel) ?? null,
    [activeItemLabel]
  )

  const handleSelect = (label: string) => {
    setActiveItemLabel((current) => (current === label ? null : label))
  }

  return (
    <div className="min-h-svh md:flex">
      <div className="min-w-0 flex-1">{children}</div>

      <div className="hidden md:flex md:shrink-0">
        {activeItem ? (
          <aside className="bg-dash-sidebar border-default flex w-96 flex-col border-l">
            <header className="border-default border-b p-4">
              <p className="text-foreground-muted text-xs uppercase font-mono tracking-wide">
                {activeItem.label}
              </p>
            </header>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 pt-0 text-center">
              <h1 className="font-medium text-foreground">Content Area</h1>
              <p className="text-foreground-muted text-sm">
                This is the main content area for all pages.
              </p>
            </div>
          </aside>
        ) : null}

        <RightIconRail activeItemLabel={activeItemLabel} onSelect={handleSelect} />
      </div>
    </div>
  )
}
