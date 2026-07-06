import { Database, GitBranch, History, LayoutGrid, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type SidebarSection = 'analyses' | 'recipes' | 'data-sources' | 'search' | 'history'

const ITEMS: { id: SidebarSection; icon: React.ReactNode; label: string }[] = [
  { id: 'analyses',     icon: <LayoutGrid size={18} />, label: 'Analyses' },
  { id: 'recipes',      icon: <GitBranch size={18} />,  label: 'Recipes' },
  { id: 'history',      icon: <History size={18} />,     label: 'History' },
  { id: 'data-sources', icon: <Database size={18} />,   label: 'Data Sources' },
  { id: 'search',       icon: <Search size={18} />,      label: 'Search' },
]

interface Props {
  active: SidebarSection | null
  onSelect: (section: SidebarSection) => void
}

export function ActivityBar({ active, onSelect }: Props) {
  return (
    <TooltipProvider delayDuration={400}>
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
      </div>
    </TooltipProvider>
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'flex items-center justify-center rounded-md cursor-pointer transition-colors',
            'w-9 h-9 border-0',
            active
              ? 'text-[var(--color-accent)] bg-[rgba(124,106,247,0.25)]'
              : 'text-[var(--color-text-3)] bg-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-bg-hover)]'
          )}
          style={{ outline: 'none' }}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
