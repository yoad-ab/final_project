import type { SidebarSection } from './ActivityBar'

interface Props {
  section: SidebarSection
}

const TITLES: Record<SidebarSection, string> = {
  analyses: 'Analyses',
  recipes:  'Recipes',
  search:   'Search',
  history:  'History',
}

export function ContextPanel({ section }: Props) {
  return (
    <div
      style={{
        width: 236,
        background: 'var(--color-bg-panel)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '9px 10px 7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: 'var(--color-text-2)',
          }}
        >
          {TITLES[section]}
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-3)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 4,
          }}
          title={`New ${TITLES[section].slice(0, -1)}`}
        >
          +
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
        {TITLES[section]} panel — coming soon
      </div>
    </div>
  )
}
