import { SiPython } from 'react-icons/si'
import { SiGnubash } from 'react-icons/si'

export function PythonIcon({ size = 14 }: { size?: number }) {
  return <SiPython size={size} style={{ color: '#3b82f6', flexShrink: 0 }} />
}

export function BashIcon({ size = 14 }: { size?: number }) {
  return <SiGnubash size={size} style={{ color: '#10b981', flexShrink: 0 }} />
}

export function LangIcon({ typeId, size = 14 }: { typeId: string; size?: number }) {
  if (typeId === 'shell') return <BashIcon size={size} />
  return <PythonIcon size={size} />
}
