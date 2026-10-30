import * as T from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = T.Root
export const TabsList = ({ className, ...p }) => (
  <T.List className={cn('inline-flex h-9 items-center rounded-lg bg-muted p-1', className)} {...p} />
)
export const TabsTrigger = ({ className, ...p }) => (
  <T.Trigger
    className={cn(
      'inline-flex h-7 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-semibold text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...p}
  />
)
