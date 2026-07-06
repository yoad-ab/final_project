import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex items-center gap-1.5 rounded-md border border-[var(--color-border)]',
        'bg-[var(--color-bg-surface)] px-2 py-1 text-xs font-semibold',
        'cursor-pointer outline-none transition-colors',
        'hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-hover)]',
        'data-[state=open]:border-[var(--color-accent)]',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown size={11} strokeWidth={2.5} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--color-border)]',
          'bg-[var(--color-bg-surface)] shadow-lg',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs font-medium outline-none',
        'text-[var(--color-text-2)] transition-colors',
        'hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]',
        'data-[state=checked]:text-[var(--color-text)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-35',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={11} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectValue, SelectGroup, SelectTrigger, SelectContent, SelectItem }
