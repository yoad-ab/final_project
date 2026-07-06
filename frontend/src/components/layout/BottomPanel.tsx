import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function BottomPanel({ onClose }: Props) {
  return (
    <div
      style={{
        height: 220,
        background: 'var(--color-bg-panel)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 33,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        {['Output', 'Logs', 'Terminal', 'Files'].map((tab, i) => (
          <div
            key={tab}
            style={{
              padding: '0 13px',
              height: 33,
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              cursor: 'pointer',
              color: i === 0 ? 'var(--color-text)' : 'var(--color-text-2)',
              borderBottom: i === 0 ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
          >
            {tab}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-3)',
            cursor: 'pointer',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-3)',
          fontSize: 12,
        }}
      >
        No active run — output will appear here
      </div>
    </div>
  )
}
