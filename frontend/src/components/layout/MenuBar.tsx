import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const MENUS = ['File', 'Edit', 'View', 'Run', 'Help']

interface Props {
  aiOpen: boolean
  onToggleAI: () => void
}

export function MenuBar({ aiOpen, onToggleAI }: Props) {
  return (
    <div
      style={{
        height: 30,
        background: 'var(--color-bg-bar)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {MENUS.map(m => (
        <span
          key={m}
          className="px-[9px] py-[3px] text-[12px] rounded cursor-pointer text-[var(--color-text-2)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors"
        >
          {m}
        </span>
      ))}

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleAI}
        className={cn(
          'flex items-center gap-[5px] px-[10px] py-[2px] rounded text-[11px] font-medium border cursor-pointer transition-colors',
          aiOpen
            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
            : 'bg-[rgba(124,106,247,0.12)] text-[#a89cf7] border-[rgba(124,106,247,0.3)] hover:bg-[rgba(124,106,247,0.2)]'
        )}
        style={{ outline: 'none' }}
      >
        <Sparkles size={12} />
        Assistant
      </button>
    </div>
  )
}
