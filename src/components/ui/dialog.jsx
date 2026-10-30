import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({ className, children, ...p }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <D.Content
        className={cn(
          'fixed z-50 grid gap-4 border bg-popover p-6 shadow-xl outline-none',
          'inset-x-0 bottom-0 rounded-t-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
          className
        )}
        {...p}
      >
        {children}
        <D.Close className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="Fechar">
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  )
}

export const DialogTitle = ({ className, ...p }) => (
  <D.Title className={cn('text-lg font-semibold', className)} {...p} />
)
export const DialogDescription = ({ className, ...p }) => (
  <D.Description className={cn('text-sm text-muted-foreground', className)} {...p} />
)
