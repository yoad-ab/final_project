import { PanelBottomOpen } from 'lucide-react'

interface Props {
  onToggleBottom: () => void
}

export function StatusBar({ onToggleBottom }: Props) {
  return (
    <div
      style={{
        height: 22,
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 14,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
        Analysis Management System
      </span>
      <button
        onClick={onToggleBottom}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 0,
        }}
        title="Toggle bottom panel"
      >
        <PanelBottomOpen size={14} />
      </button>
    </div>
  )
}
