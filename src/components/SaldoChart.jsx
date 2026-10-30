import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { brl } from '@/lib/utils'

// saldo acumulado (recebido − gasto) a cada lançamento
export function SaldoChart({ movs }) {
  const dados = useMemo(() => {
    let saldo = 0
    return [...movs]
      .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em))
      .map((m) => {
        saldo += (m.tipo === 'venda' ? 1 : -1) * Number(m.valor)
        return {
          saldo: Math.round(saldo * 100) / 100,
          hora: new Date(m.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        }
      })
  }, [movs])

  if (dados.length < 2) {
    return <p className="py-8 text-center text-sm text-muted-foreground">O gráfico aparece com 2 ou mais lançamentos.</p>
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <AreaChart data={dados} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="hora" hide />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(v) => [brl(v), 'Saldo']}
          />
          <Area type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2.5} fill="url(#saldoFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
