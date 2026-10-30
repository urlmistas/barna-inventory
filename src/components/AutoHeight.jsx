import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

// anima a altura do conteúdo quando ele muda de tamanho, para a borda do cartão acompanhar o conteúdo
export function AutoHeight({ children }) {
  const ref = useRef(null)
  const [h, setH] = useState('auto')

  useEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => setH(el.offsetHeight))
    ro.observe(el)
    setH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div initial={false} animate={{ height: h }} transition={{ duration: 0.25, ease: 'easeOut' }} className="overflow-hidden">
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}
