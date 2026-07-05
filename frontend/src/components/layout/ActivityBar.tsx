import { LayoutGrid, GitBranch, Search, History } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarSection = 'analyses' | 'recipes' | 'search' | 'history'

const ITEMS: { id: SidebarSection; icon: React.ReactNode; label: string }[] = [
  { id: 'analyses', icon: <LayoutGrid size={18} />, label: 'Analyses' },
  { id: 'recipes',  icon: <GitBranch size={18} />,  label: 'Recipes' },
  { id: 'search',   icon: <Search size={18} />,      label: 'Search' },
]

const BOTTOM_ITEMS: { id: SidebarSection; icon: React.ReactNode; label: string }[] = [
  { id: 'history', icon: <History size={18} />, label: 'History' },
]

interface Props {
  active: SidebarSection | null
  onSelect: (section: SidebarSection) => void
}

export function ActivityBar({ active, onSelect }: Props) {
  return (
    <div
      style={{
        width: 48,
        background: 'var(--color-bg-bar)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: 2,
        flexShrink: 0,
      }}
    >
      {ITEMS.map(item => (
        <ActivityIcon
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={active === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}

      <div style={{ flex: 1 }} />

      {BOTTOM_ITEMS.map(item => (
        <ActivityIcon
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={active === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  )
}

function ActivityIcon({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-md cursor-pointer transition-colors',
        'w-9 h-9 border-0',
        active
          ? 'text-[var(--color-text)] bg-[rgba(124,106,247,0.15)]'
          : 'text-[var(--color-text-3)] bg-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-bg-hover)]'
      )}
      style={{ outline: 'none' }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: -1,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 2,
            height: 18,
            background: 'var(--color-accent)',
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}
      {icon}
    </button>
  )
}
