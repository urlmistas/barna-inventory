import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

// anima de um valor ao outro (contagem suave quando o estoque ou o saldo mudam)
export function AnimatedNumber({ value, format = (v) => Math.round(v) }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => { from.current = v; setShown(v) },
    })
    return () => controls.stop()
  }, [value])

  return <>{format(shown)}</>
}
