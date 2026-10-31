import { createContext, useContext, useId } from 'react'
import * as T from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const Ctx = createContext({ value: undefined, id: '' })

export function Tabs({ value, ...p }) {
  const id = useId()
  return (
    <Ctx.Provider value={{ value, id }}>
      <T.Root value={value} {...p} />
    </Ctx.Provider>
  )
}

export const TabsList = ({ className, ...p }) => (
  <T.List className={cn('inline-flex h-9 items-center rounded-lg bg-muted p-1 outline-none [scrollbar-width:none]', className)} {...p} />
)

// o fundo da aba ativa desliza de uma aba para a outra (layoutId compartilhado)
export function TabsTrigger({ className, children, value, ...p }) {
  const { value: atual, id } = useContext(Ctx)
  return (
    <T.Trigger
      value={value}
      className={cn(
        'relative inline-flex h-7 cursor-pointer outline-none items-center justify-center rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors data-[state=active]:text-foreground',
        className
      )}
      {...p}
    >
      {atual === value && (
        <motion.span
          layoutId={`aba-${id}`}
          className="absolute inset-0 rounded-md bg-card shadow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">{children}</span>
    </T.Trigger>
  )
}
