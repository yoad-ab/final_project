import { X, Sparkles } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function AIDrawer({ onClose }: Props) {
  return (
    <div
      style={{
        width: 350,
        background: 'var(--color-bg-panel)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '9px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Sparkles size={14} color="var(--color-accent)" />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Assistant</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-3)',
            cursor: 'pointer',
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
        AI assistant — coming soon
      </div>

      <div
        style={{
          padding: '9px 12px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: 7,
        }}
      >
        <textarea
          placeholder="Ask the assistant..."
          rows={1}
          style={{
            flex: 1,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 5,
            padding: '7px 9px',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-text)',
            resize: 'none',
            outline: 'none',
          }}
        />
        <button
          style={{
            background: 'var(--color-accent)',
            border: 'none',
            color: '#fff',
            width: 30,
            height: 30,
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
