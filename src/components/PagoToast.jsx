import { motion } from 'motion/react'
import { toast } from 'sonner'
import { CircleCheck, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONS = {
  pago: { Icone: CircleCheck, icone: 'bg-primary/15 text-primary', barra: 'bg-primary' },
  apagado: { Icone: Trash2, icone: 'bg-destructive/15 text-destructive', barra: 'bg-destructive' },
}

function Aviso({ id, tom, titulo, detalhe, acao, duracao }) {
  const { Icone, icone, barra } = TONS[tom]
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={() => toast.dismiss(id)}
      className="group relative w-[min(92vw,380px)] cursor-pointer overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-black/25"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
          className={cn('grid size-9 shrink-0 place-items-center rounded-full', icone)}
        >
          <Icone className="size-5" />
        </motion.span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-bold">{titulo}</p>
          {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
        </div>
        {acao && (
          <button
            className="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); acao.onClick(); toast.dismiss(id) }}
          >
            {acao.label}
          </button>
        )}
      </div>
      {/* a barra manda: quando ela termina o aviso fecha, então os dois acabam juntos; passar o mouse pausa os dois */}
      <div
        className={cn('absolute inset-x-0 bottom-0 h-1 origin-left group-hover:[animation-play-state:paused]', barra)}
        style={{ animation: `encolher ${duracao}ms linear forwards` }}
        onAnimationEnd={() => toast.dismiss(id)}
      />
    </motion.div>
  )
}

const mostrar = (tom, titulo, detalhe, { acao, duracao = 4000 } = {}) =>
  toast.custom((id) => <Aviso id={id} tom={tom} titulo={titulo} detalhe={detalhe} acao={acao} duracao={duracao} />, { duration: Infinity })

export const mostrarPago = (titulo, detalhe) => mostrar('pago', titulo, detalhe)
export const mostrarApagado = (titulo, detalhe, acao) => mostrar('apagado', titulo, detalhe, { acao, duracao: 6000 })
