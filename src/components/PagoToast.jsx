import { motion } from 'motion/react'
import { toast } from 'sonner'
import { CircleCheck } from 'lucide-react'

const DURACAO = 4000

function Pago({ titulo, detalhe, id }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={() => toast.dismiss(id)}
      className="relative w-[min(92vw,380px)] cursor-pointer overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-black/25"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
        >
          <CircleCheck className="size-5" />
        </motion.span>
        <div className="leading-tight">
          <p className="text-sm font-bold">{titulo}</p>
          {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
        </div>
      </div>
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1 origin-left bg-primary"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: DURACAO / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

export const mostrarPago = (titulo, detalhe) =>
  toast.custom((id) => <Pago id={id} titulo={titulo} detalhe={detalhe} />, { duration: DURACAO })
