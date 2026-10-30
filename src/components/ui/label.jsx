import { cn } from '@/lib/utils'

export const Label = ({ className, ...p }) => (
  <label className={cn('text-sm font-medium leading-none', className)} {...p} />
)
