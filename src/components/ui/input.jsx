import { cn } from '@/lib/utils'

export const Input = ({ className, type = 'text', ...p }) => (
  <input
    type={type}
    className={cn(
      'h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base md:text-sm shadow-xs outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50',
      className
    )}
    {...p}
  />
)
