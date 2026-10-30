import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-accent text-accent-foreground',
      success: 'bg-success/15 text-success',
      muted: 'bg-muted text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export const Badge = ({ className, variant, ...p }) => (
  <span className={cn(variants({ variant }), className)} {...p} />
)
