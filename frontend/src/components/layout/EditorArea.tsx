import { Keyboard } from 'lucide-react'

export function EditorArea() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        background: 'var(--color-bg-surface)',
      }}
    >
      {/* Tab strip (empty for now) */}
      <div
        style={{
          height: 35,
          background: 'var(--color-bg-bar)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 4px',
          flexShrink: 0,
        }}
      />

      {/* Empty state */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--color-text-3)',
        }}
      >
        <Keyboard size={36} strokeWidth={1.2} />
        <span style={{ fontSize: 15, color: 'var(--color-text-2)', fontWeight: 500 }}>
          No editor open
        </span>
        <span style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
          Select an analysis or recipe from the sidebar,
          <br />
          or press{' '}
          <kbd
            style={{
              padding: '1px 5px',
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-2)',
            }}
          >
            Ctrl+P
          </kbd>{' '}
          to quick-open.
        </span>
      </div>
    </div>
  )
}
