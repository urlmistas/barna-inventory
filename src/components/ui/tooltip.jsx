import * as T from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = T.Provider
export const Tooltip = T.Root
export const TooltipTrigger = T.Trigger

export const TooltipContent = ({ className, sideOffset = 6, ...p }) => (
  <T.Portal>
    <T.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-md',
        className
      )}
      {...p}
    />
  </T.Portal>
)
